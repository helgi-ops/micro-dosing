import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL =
  (typeof window !== "undefined" && window.__SUPABASE_URL__) ||
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
  "";

const SUPABASE_ANON_KEY =
  (typeof window !== "undefined" && window.__SUPABASE_ANON_KEY__) ||
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("[dataClient] Missing Supabase config. Ensure __SUPABASE_URL__/__SUPABASE_ANON_KEY__ are set on window.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "coach-dashboard-auth",
    storage: window.localStorage, // explicit storage for privacy-strict browsers
  },
});

function nowISO() {
  return new Date().toISOString();
}

// --- Firefox-safe auth hydration (define ONCE) ---
let __authReadyResolve;
const __authReady = new Promise((res) => (__authReadyResolve = res));

supabase.auth.onAuthStateChange((_event, session) => {
  if (__authReadyResolve) {
    __authReadyResolve(session || null);
    __authReadyResolve = null; // resolve once
  }
});

export async function waitForAuthReadySafe(timeoutMs = 1500) {
  return Promise.race([
    __authReady,
    new Promise((res) => setTimeout(() => res(null), timeoutMs)),
  ]);
}

let __authReadyFlag = false;
export function isAuthReady() {
  return __authReadyFlag;
}

async function sessionUserId() {
  const { data, error } = await supabase.auth.getSession();
  __authReadyFlag = true;
  if (error) throw error;
  return data?.session?.user?.id || null;
}

export const api = {
  supabase,
  isAuthReady,

  async initAuth() {
    const { data, error } = await supabase.auth.getSession();
    __authReadyFlag = true;
    if (error) throw error;
    return data?.session || null;
  },

  async getCachedSession() {
    const { data, error } = await supabase.auth.getSession();
    __authReadyFlag = true;
    if (error) return null;
    return data?.session || null;
  },

  async waitForAuthReady() {
    // Minimal: session restore is handled by supabase-js; returning current session is enough.
    return this.getCachedSession();
  },

  async listMyTeams() {
    const userId = await sessionUserId();
    if (!userId) return [];
    const { data, error } = await supabase
      .from("team_members")
      .select("team_id, teams:team_id (id, name)")
      .eq("user_id", userId);

    if (error) throw error;

    return (data || []).map((r) => ({
      id: r.team_id,
      name: r.teams?.name || r.team_id,
    }));
  },

  async getMyPlayer() {
    const userId = await sessionUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from("players")
      .select("id, team_id, first_name, last_name, email, invite_email, auth_user_id")
      .eq("auth_user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  },

  async listMyAssignedWeeks() {
    const player = await this.getMyPlayer();
    if (!player?.id) return [];
    const { data, error } = await supabase
      .from("week_assignments")
      .select("id, status, assigned_at, week_id, weeks:week_id (id, team_id, week_number, title, start_date, end_date, status)")
      .eq("player_id", player.id)
      .order("assigned_at", { ascending: false })
      .limit(25);

    if (error) throw error;
    return data || [];
  },

  async listPublishedWeeks(teamId) {
    if (!teamId) return [];
    const { data, error } = await supabase
      .from("weeks")
      .select("id, title, status, team_id, created_at, updated_at")
      .eq("team_id", teamId)
      .eq("status", "published")
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getWeekDays(weekId) {
    if (!weekId) return [];
    const { data, error } = await supabase
      .from("week_days")
      .select("*")
      .eq("week_id", weekId)
      .order("day_index", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async listMyDayCompletionsForWeek(weekId) {
    if (!weekId) return [];
    const player = await this.getMyPlayer();
    if (!player?.id) return [];

    // If the table doesn't exist or RLS blocks it, return [] (do not crash UI)
    try {
      const { data, error } = await supabase
        .from("day_completions")
        .select("id, player_id, week_id, day_index, done_at, notes")
        .eq("player_id", player.id)
        .eq("week_id", weekId)
        .order("day_index", { ascending: true });

      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  },

  async markDayDone({ weekId, dayIndex, playerId, notes } = {}) {
    if (!weekId || dayIndex == null) return { ok: false, error: "weekId and dayIndex required" };

    const pid = playerId || (await this.getMyPlayer())?.id;
    if (!pid) return { ok: false, error: "playerId missing" };

    // Safe upsert; if table missing/RLS blocks -> return ok:false (but no throw)
    try {
      const row = {
        player_id: pid,
        week_id: weekId,
        day_index: dayIndex,
        done_at: nowISO(),
        notes: notes || null,
      };

      const { data, error } = await supabase
        .from("day_completions")
        .upsert(row, { onConflict: "player_id,week_id,day_index" })
        .select("*")
        .maybeSingle();

      if (error) return { ok: false, error };
      return { ok: true, data };
    } catch (e) {
      return { ok: false, error: e };
    }
  },

  // Token + link helpers (safe stubs until token table is finalized)
  async ensurePlayerToken(token) {
    if (!token) return { ok: false, error: "token required" };
    // If you have a real invites table later, replace this query.
    // For now: do not crash.
    return { ok: true, token, skipped: true };
  },

  buildPlayerLink(playerId) {
    const url = new URL(`${window.location.origin}/player.html`);
    if (playerId) url.searchParams.set("id", playerId);
    return url.toString();
  },
};

// Named exports expected by various modules (thin shims)
export async function initAuth() { return api.initAuth(); }
export async function getCachedSession() { return api.getCachedSession(); }
export async function waitForAuthReady() { return api.waitForAuthReady(); }

export async function listMyTeams() { return api.listMyTeams(); }
export async function getMyPlayer() { return api.getMyPlayer(); }
export async function listMyAssignedWeeks() { return api.listMyAssignedWeeks(); }
export async function listPublishedWeeks(teamId) { return api.listPublishedWeeks(teamId); }
export async function getWeekDays(weekId) { return api.getWeekDays(weekId); }

export async function listMyDayCompletionsForWeek(weekId) { return api.listMyDayCompletionsForWeek(weekId); }
export async function markDayDone(payload) { return api.markDayDone(payload); }

export async function ensurePlayerToken(token) { return api.ensurePlayerToken(token); }
export function buildPlayerLink(playerId) { return api.buildPlayerLink(playerId); }

// Legacy global exposure (coach.html still has some window.api.supabase usage)
if (typeof window !== "undefined") {
  window.supabase = supabase;
  window.api = window.api || {};
  window.api.supabase = supabase;
}

// Backward-compat exports (some legacy modules import these names)
export const SUPABASE_URL_PUBLIC =
  (typeof window !== "undefined" && (window.__SUPABASE_URL__ || window.SUPABASE_URL)) || "";

export const SUPABASE_ANON_PUBLIC =
  (typeof window !== "undefined" && (window.__SUPABASE_ANON_KEY__ || window.SUPABASE_ANON_KEY)) || "";

// Safe alias expected by some auth helpers
export const waitForAuthReadySafe = waitForAuthReady;

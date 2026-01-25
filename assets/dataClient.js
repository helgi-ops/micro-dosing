import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://tbtkxttiwbdmugjivmvb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRidGt4dHRpd2JkbXVnaml2bXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjYxOTgsImV4cCI6MjA4MzkwMjE5OH0.2PvhrzwYdx5oxf_oARFIio5Es8mgv3_ks3CAqxUcsKI";

const baseUrl = new URL("./", window.location.href).toString();
const LOGIN_URL = baseUrl + "index.html";
export const SUPABASE_URL_PUBLIC = SUPABASE_URL;
export const SUPABASE_ANON_PUBLIC = SUPABASE_ANON_KEY;

// --- SINGLETON supabase client ---
const _supabase =
  window.__supabase ||
  (window.__supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: "coach-dashboard-auth",
    },
  }));

export const supabase = _supabase;

// HARD GUARANTEE: expose supabase client globally (legacy compatibility)
if (typeof window !== "undefined") {
  window.supabase = supabase;
  window.api = window.api || {};
  window.api.supabase = supabase;
}

// Handle magic-link hash cleanup
if (location.hash && location.hash.includes("access_token=")) {
  (async () => {
    try { await new Promise((r) => setTimeout(r, 50)); } catch (_) {}
    try { history.replaceState({}, document.title, location.pathname + location.search); } catch (_) {}
  })();
}

// --- Simple session cache ---
let __cachedSession = null;
let __authReady = false;
let __resolveAuthReady;
const __authReadyPromise = new Promise((resolve) => { __resolveAuthReady = resolve; });

supabase.auth.onAuthStateChange((event, session) => {
  if (!__authReady) {
    __authReady = true;
    __cachedSession = session || null;
    __resolveAuthReady?.(session || null);
  }
  if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
    __cachedSession = session || null;
  }
  if (event === "SIGNED_OUT") __cachedSession = null;
});

export function getCachedSession() {
  return __cachedSession;
}

export async function waitForAuthReady() {
  if (__authReady) return __cachedSession;
  return __authReadyPromise;
}

export async function waitForAuthReadySafe() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (!error && data?.session) {
      __cachedSession = data.session;
      __authReady = true;
      return data.session;
    }
  } catch (_) {}
  try {
    const sess = await Promise.race([
      __authReadyPromise,
      new Promise((resolve) => setTimeout(() => resolve(null), 2000)),
    ]);
    if (sess) __cachedSession = sess;
    return sess || null;
  } catch {
    return null;
  }
}

export const api = {
  async getSession() {
    await waitForAuthReady();
    return getCachedSession();
  },

  async signInWithEmail(email) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: LOGIN_URL },
    });
    if (error) throw error;
    return data;
  },

  async sendMagicLink(email) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: LOGIN_URL },
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async listMyTeams() {
    const { data: sess, error: sErr } = await supabase.auth.getSession();
    if (sErr) throw sErr;
    const userId = sess?.session?.user?.id;
    if (!userId) throw new Error("Not signed in");

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

  async getTeams() {
    const { data, error } = await supabase.from("teams").select("id,name,created_at").order("name");
    if (error) throw error;
    return data || [];
  },

  async getPlayers(teamId) {
    const { data, error } = await supabase
      .from("players")
      .select(
        "id, team_id, first_name, last_name, position, status, created_at, invite_email, invite_sent_at, auth_user_id, invite_accepted_at"
      )
      .eq("team_id", teamId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createPlayer(teamId, firstName, lastName, position, status) {
    const { data, error } = await supabase
      .from("players")
      .insert([
        {
          team_id: teamId,
          first_name: firstName,
          last_name: lastName,
          position: position || null,
          status: status || "active",
        },
      ])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deletePlayer(playerId) {
    const { error } = await supabase.from("players").delete().eq("id", playerId);
    if (error) throw error;
  },

  async getPlayer(playerId) {
    const { data, error } = await supabase.from("players").select("*").eq("id", playerId).maybeSingle();
    if (error) throw error;
    return data;
  },

  async getPlayerById(playerId) {
    return this.getPlayer(playerId);
  },

  async assignWeekToPlayers(weekId, playerIds) {
    if (!weekId || !(playerIds || []).length) throw new Error("weekId and playerIds required");
    const ids = (playerIds || []).filter(Boolean);
    if (!ids.length) throw new Error("playerIds required");
    const rows = ids.map((pid) => ({
      player_id: pid,
      week_id: weekId,
      status: "assigned",
      assigned_at: new Date().toISOString(),
    }));
    const { data, error } = await supabase
      .from("week_assignments")
      .upsert(rows, { onConflict: "player_id" })
      .select("id, player_id, week_id, status, assigned_at");
    if (error) throw error;
    return { assignedCount: data?.length || 0, data };
  },

  async listPublishedWeeks(teamId) {
    if (!teamId) throw new Error("teamId required");
    const { data, error } = await supabase
      .from("weeks")
      .select("id, team_id, week_number, title, start_date, end_date, status")
      .eq("team_id", teamId)
      .in("status", ["published", "active", "assigned"])
      .order("week_number", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async listMyAssignedWeeks() {
    const { data: sess } = await supabase.auth.getSession();
    const userId = sess?.session?.user?.id;
    if (!userId) throw new Error("Not signed in");

    const { data: player, error: pErr } = await supabase
      .from("players")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!player?.id) return [];

    const { data, error } = await supabase
      .from("week_assignments")
      .select(
        "id, status, assigned_at, week_id, weeks:week_id (id, team_id, week_number, title, start_date, end_date, status)"
      )
      .eq("player_id", player.id)
      .order("assigned_at", { ascending: false })
      .limit(25);
    if (error) throw error;
    return data || [];
  },

  async ensurePlayerToken(token) {
    if (!token) throw new Error("token required");
    try {
      const { data, error } = await supabase
        .from("player_invites")
        .select("id, player_id, team_id, token, expires_at, used_at")
        .eq("token", token)
        .maybeSingle();
      if (error) return { ok: false, error };
      if (!data) return { ok: false, error: new Error("Invalid token") };
      return { ok: true, invite: data };
    } catch (e) {
      return { ok: false, error: e };
    }
  },

  async getWeekDays(weekId) {
    if (!weekId) throw new Error("weekId required");
    const { data, error } = await supabase
      .from("week_days")
      .select("*")
      .eq("week_id", weekId)
      .order("day_index", { ascending: true });
    if (error) throw error;
    return data || [];
  },
}; // end api

// ===== Named export shims (keep legacy imports working) =====
export function isAuthReady() {
  if (typeof window !== "undefined" && window.__authReady != null) return !!window.__authReady;
  return !!supabase;
}

export function buildPlayerLink(playerId) {
  const url = new URL(`${window.location.origin}/player.html`);
  if (playerId) url.searchParams.set("id", playerId);
  return url.toString();
}

export async function markDayDone(payload) {
  if (api && typeof api.markDayDone === "function") return api.markDayDone(payload);
  return { ok: true, skipped: true };
}

export async function listPublishedWeeks(teamId) {
  return api.listPublishedWeeks(teamId);
}

export async function listMyAssignedWeeks() {
  return api.listMyAssignedWeeks();
}

export async function listMyTeams() {
  return api.listMyTeams();
}

export async function ensurePlayerToken(token) {
  return api.ensurePlayerToken(token);
}

export async function getWeekDays(weekId) {
  return api.getWeekDays(weekId);
}

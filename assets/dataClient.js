// assets/dataClient.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = window.__SUPABASE_URL__;
const SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY__;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "coach-dashboard-auth",
  },
});
window.supabase = supabase;

// Handle magic-link landing early so session is stored and hash cleared
if (location.hash && location.hash.includes("access_token=")) {
  (async () => {
    try {
      await supabase.auth.getSession();
    } catch (_) {}
    try {
      history.replaceState({}, document.title, location.pathname + location.search);
    } catch (_) {}
  })();
}

export const api = {
  async getSession() {
    await waitForAuthReady();
    return getCachedSession();
  },

  async signInWithEmail(email) {
    const redirectTo = window.location.href.split('#')[0];
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo
      }
    });
    if (error) {
      console.error("Supabase signInWithOtp error:", error);
      throw error;
    }
    return data;
  },

  async sendMagicLink(email) {
    const redirectTo = window.location.href.split('#')[0];
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo }
    });
    if (error) {
      console.error("Supabase signInWithOtp error:", error);
      throw error;
    }
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getTeams() {
    const { data, error } = await supabase
      .from("teams")
      .select("id,name,created_at")
      .order("name");
    if (error) throw error;
    return data || [];
  },

  async getPlayers(teamId) {
    const { data, error } = await supabase
      .from("players")
      .select("id, team_id, first_name, last_name, position, status, created_at, invite_email, invite_sent_at, auth_user_id, invite_accepted_at")
      .eq("team_id", teamId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createPlayer(teamId, firstName, lastName, position, status) {
    const { data, error } = await supabase
      .from("players")
      .insert([{
        team_id: teamId,
        first_name: firstName,
        last_name: lastName,
        position: position || null,
        status: status || "active",
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deletePlayer(playerId) {
    const { error } = await supabase
      .from("players")
      .delete()
      .eq("id", playerId);
    if (error) throw error;
  },

  async createInvite(teamId, playerId, email) {
    const { data, error } = await supabase
      .from("player_invites")
      .upsert([{
        team_id: teamId,
        player_id: playerId,
        email: (email || "").trim().toLowerCase(),
        created_by: (await supabase.auth.getUser()).data?.user?.id || null,
      }], { onConflict: "player_id" })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getMyInvites() {
    const user = (await supabase.auth.getUser()).data?.user;
    const email = (user?.email || "").trim().toLowerCase();
    if (!email) return [];
    const { data, error } = await supabase
      .from("player_invites")
      .select("id,team_id,player_id,email,accepted_at,created_at")
      .eq("email", email)
      .is("accepted_at", null)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async acceptInvite(inviteId) {
    const { data, error } = await supabase
      .rpc("accept_player_invite", { _invite_id: inviteId });
    if (error) throw error;
    return data;
  },

  // ------------------------- PROGRAM LIBRARY -------------------------

  async listProgramTemplates(teamId) {
    return supabase
      .from('program_templates')
      .select('id, team_id, title, description, tags, level, goal, created_at')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });
  },

  async createProgramTemplate(teamId, payload) {
    const row = {
      team_id: teamId,
      title: payload.title,
      description: payload.description ?? null,
      tags: payload.tags ?? [],
      level: payload.level ?? null,
      goal: payload.goal ?? null
    };
    return supabase.from('program_templates').insert(row).select().single();
  },

  async getProgramTemplate(templateId) {
    const { data: t, error: tErr } = await supabase
      .from('program_templates')
      .select('id, team_id, title, description, tags, level, goal')
      .eq('id', templateId)
      .single();

    if (tErr) return { data: null, error: tErr };

    const { data: days, error: dErr } = await supabase
      .from('program_template_days')
      .select('id, template_id, day_index, title, notes')
      .eq('template_id', templateId)
      .order('day_index', { ascending: true });

    if (dErr) return { data: null, error: dErr };

    const dayIds = (days || []).map(d => d.id);
    let items = [];
    if (dayIds.length) {
      const { data: its, error: iErr } = await supabase
        .from('program_template_items')
        .select('id, template_day_id, sort_order, item_type, name, sets, reps, intensity, rest, notes, meta')
        .in('template_day_id', dayIds)
        .order('sort_order', { ascending: true });

      if (iErr) return { data: null, error: iErr };
      items = its || [];
    }

    const itemsByDay = new Map();
    for (const it of items) {
      const arr = itemsByDay.get(it.template_day_id) || [];
      arr.push(it);
      itemsByDay.set(it.template_day_id, arr);
    }

    return {
      data: {
        template: t,
        days: (days || []).map(d => ({ ...d, items: itemsByDay.get(d.id) || [] }))
      },
      error: null
    };
  },

  async upsertTemplateDay(templateId, dayIndex, title, notes = null) {
    const row = { template_id: templateId, day_index: dayIndex, title, notes };
    return supabase
      .from('program_template_days')
      .upsert(row, { onConflict: 'template_id,day_index' })
      .select()
      .single();
  },

  async addTemplateItem(templateDayId, item) {
    const row = {
      template_day_id: templateDayId,
      sort_order: item.sort_order ?? 1,
      item_type: item.item_type ?? 'exercise',
      name: item.name,
      sets: item.sets ?? null,
      reps: item.reps ?? null,
      intensity: item.intensity ?? null,
      rest: item.rest ?? null,
      notes: item.notes ?? null,
      meta: item.meta ?? {}
    };
    return supabase.from('program_template_items').insert(row).select().single();
  },

  // ------------------------- PUBLISH WEEK FROM TEMPLATE -------------------------

  async publishWeekFromTemplate(teamId, isoYear, isoWeek, templateId, weekDraft) {
    const flattenDayItems = (day) => {
      return (day.items || []).map(it => ({
        type: it.item_type,
        name: it.name,
        sets: it.sets,
        reps: it.reps,
        intensity: it.intensity,
        rest: it.rest,
        notes: it.notes,
        meta: it.meta
      }));
    };

    const { data: w, error: wErr } = await supabase
      .from('weeks')
      .upsert(
        {
          team_id: teamId,
          iso_year: isoYear,
          iso_week: isoWeek,
          status: 'published',
          source_template_id: templateId
        },
        { onConflict: 'team_id,iso_year,iso_week' }
      )
      .select()
      .single();

    if (wErr) return { data: null, error: wErr };

    for (const d of (weekDraft.days || [])) {
      const row = {
        week_id: w.id,
        day_index: d.day_index,
        title: d.title,
        notes: d.notes ?? null,
        items: flattenDayItems(d)
      };

      const { error: dayErr } = await supabase
        .from('week_days')
        .upsert(row, { onConflict: 'week_id,day_index' });

      if (dayErr) return { data: null, error: dayErr };
    }

    return { data: w, error: null };
  },

  async assignWeekToPlayers(weekId, playerIds) {
    const rows = (playerIds || []).map(pid => ({
      week_id: weekId,
      player_id: pid,
      status: 'assigned'
    }));
    return supabase
      .from('week_assignments')
      .upsert(rows, { onConflict: 'week_id,player_id' })
      .select();
  }
};

// ------------------------- ATHLETE: MY PLAN -------------------------

export async function getMyPlayer() {
  // Finds the player row linked to the signed-in user (players.auth_user_id = auth.uid()).
  return supabase
    .from('players')
    .select('id, team_id, first_name, last_name, position, status, auth_user_id')
    .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
    .maybeSingle();
}

export async function listMyAssignedWeeks() {
  // Uses RLS: athlete can select week_assignments where player.auth_user_id = auth.uid()
  // Join week for metadata
  return supabase
    .from('week_assignments')
    .select(`
      id,
      status,
      assigned_at,
      week_id,
      weeks:week_id (
        id,
        team_id,
        iso_year,
        iso_week,
        status,
        created_at
      )
    `)
    .order('assigned_at', { ascending: false });
}

export async function getWeekDays(weekId) {
  // RLS: athlete must have an assignment to see related week_days if you later lock it down.
  // For now, coaches have full access; athlete view uses assignment-based discovery.
  return supabase
    .from('week_days')
    .select('id, week_id, day_index, title, notes, items')
    .eq('week_id', weekId)
    .order('day_index', { ascending: true });
}

export async function listMyDayCompletionsForWeek(weekId) {
  // Fetch completions for all days in a week for this athlete
  // Approach: first fetch week days, then completions by those ids (simple and reliable)
  const { data: days, error: dErr } = await getWeekDays(weekId);
  if (dErr) return { data: null, error: dErr };

  const dayIds = (days || []).map(d => d.id);
  if (!dayIds.length) return { data: { days: days || [], completions: [] }, error: null };

  const { data: playerRow, error: pErr } = await getMyPlayer();
  if (pErr) return { data: null, error: pErr };
  if (!playerRow?.id) return { data: null, error: new Error('No linked player for this account.') };

  const { data: comps, error: cErr } = await supabase
    .from('day_completions')
    .select('id, week_day_id, player_id, completed_at, rpe, pain, notes')
    .eq('player_id', playerRow.id)
    .in('week_day_id', dayIds)
    .order('completed_at', { ascending: false });

  if (cErr) return { data: null, error: cErr };

  return { data: { days: days || [], completions: comps || [] }, error: null };
}

export async function markDayDone(weekDayId, payload = {}) {
  const { data: playerRow, error: pErr } = await getMyPlayer();
  if (pErr) return { data: null, error: pErr };
  if (!playerRow?.id) return { data: null, error: new Error('No linked player for this account.') };

  return supabase
    .from('day_completions')
    .insert({
      week_day_id: weekDayId,
      player_id: playerRow.id,
      rpe: payload.rpe ?? null,
      pain: payload.pain ?? null,
      notes: payload.notes ?? null
    })
    .select()
    .single();
}

export async function invitePlayer(playerId, inviteEmail) {
  const session = isAuthReady() ? getCachedSession() : await waitForAuthReady();
  const token = session?.access_token;
  if (!token) throw new Error('Not signed in');

  const redirectTo = new URL('./', window.location.href).toString();

  const res = await fetch(`${SUPABASE_URL}/functions/v1/invite-player`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      player_id: playerId,
      invite_email: inviteEmail,
      redirect_to: redirectTo
    })
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Invite failed');
  return json;
}

// expose on api for convenience
api.invitePlayer = invitePlayer;

// debug (valfrjálst)
window.__api = api;
window.__supabase = supabase;

export function getAuthSession() {
  return getCachedSession();
}

export async function initAuth() {
  const session = await waitForAuthReady();
  window.dispatchEvent(new CustomEvent('auth:changed', { detail: { session, event: 'INITIAL' } }));
  return session;
}

// --- Auth ready + session cache (Supabase v2 safe) ---
let __authReady = false;
let __cachedSession = null;

// Promise sem leysist þegar INITIAL_SESSION kemur
let __resolveAuthReady;
const __authReadyPromise = new Promise((resolve) => { __resolveAuthReady = resolve; });

supabase.auth.onAuthStateChange((event, session) => {
  if (event === "INITIAL_SESSION") {
    __authReady = true;
    __cachedSession = session || null;
    __resolveAuthReady?.(session || null);
    window.dispatchEvent(new CustomEvent("auth:ready", { detail: { session: __cachedSession } }));
    return;
  }

  if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
    __cachedSession = session || null;
    window.dispatchEvent(new CustomEvent("auth:changed", { detail: { session: __cachedSession } }));
    return;
  }

  if (event === "SIGNED_OUT") {
    __cachedSession = null;
    window.dispatchEvent(new CustomEvent("auth:changed", { detail: { session: null } }));
  }
});

export function isAuthReady() {
  return __authReady;
}

export function getCachedSession() {
  return __cachedSession;
}

export async function waitForAuthReady() {
  // ef ready nú þegar
  if (__authReady) return __cachedSession;
  // annars bíð eftir INITIAL_SESSION
  return __authReadyPromise;
}

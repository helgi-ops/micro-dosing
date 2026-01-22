// assets/dataClient.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://tbtkxttiwbdmugjivmvb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_7ePvUt_6A7KKyGpV7eYfaQ_3w81AUuA";

const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, "/");
const LOGIN_URL = `${window.location.origin}/coach.html`;
export const SUPABASE_URL_PUBLIC = SUPABASE_URL;
export const SUPABASE_ANON_PUBLIC = SUPABASE_ANON_KEY;

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: localStorage,
      storageKey: "coach-dashboard-auth"
    }
  }
);
window.supabase = supabase;

// Handle magic-link landing early so session is stored and hash cleared
if (location.hash && location.hash.includes("access_token=")) {
  (async () => {
    try {
      // Let Supabase SDK process the hash; avoid getSession to prevent AbortError
      await new Promise(r => setTimeout(r, 50));
    } catch (_) {} // swallow
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
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/coach.html`
      }
    });
    if (error) {
      console.error("Supabase signInWithOtp error:", error);
      throw error;
    }
    return data;
  },

  async sendMagicLink(email) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/coach.html` }
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

  async getMyTeams(userId) {
    // RLS-safe: team_members -> teams join
    const { data, error } = await supabase
      .from("team_members")
      .select("team_id, teams:team_id ( id, name )")
      .eq("user_id", userId);

    if (error) throw error;

    const teams = (data || [])
      .map(r => r.teams)
      .filter(Boolean);

    teams.sort((a,b) => (a.name || "").localeCompare(b.name || ""));
    return teams;
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

  async getPlayer(playerId) {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("id", playerId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getPlayerById(playerId) {
    return this.getPlayer(playerId);
  },

  async getAssignedWeekForPlayer(playerId) {
    const { data, error } = await supabase
      .from("player_weeks")
      .select("week_id, is_active, assigned_at, week:weeks(id, title)")
      .eq("player_id", playerId)
      .eq("is_active", true)
      .order("assigned_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getWeekPreview(weekId) {
    const { data, error } = await supabase
      .from("week_days")
      .select("week_id, day_index, session_type, title")
      .eq("week_id", weekId)
      .order("day_index", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getLatestCheckin(playerId, dateISO) {
    const { data, error } = await supabase
      .from("checkins")
      .select("*")
      .eq("player_id", playerId)
      .eq("date", dateISO)
      .order("created_at", { ascending: false })
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async listCmjHistory(playerId, limit = 50) {
    const { data, error } = await supabase
      .from("cmj_tests")
      .select("*")
      .eq("player_id", playerId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  async getTodayGeneratedPlan(playerId, dateISO) {
    const { data, error } = await supabase
      .from("generated_plans")
      .select("*")
      .eq("player_id", playerId)
      .eq("date", dateISO)
      .order("created_at", { ascending: false })
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async submitCheckin(payload) {
    const { playerId, dateISO, readiness, soreness, sleep, readiness_state } = payload;
    const { data, error } = await supabase
      .from("checkins")
      .insert([{
        player_id: playerId,
        date: dateISO,
        readiness,
        soreness,
        sleep,
        readiness_state: readiness_state || null
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async submitCmj({ playerId, dateISO, cmjValue }) {
    const { data, error } = await supabase
      .from("cmj_tests")
      .insert([{
        player_id: playerId,
        date: dateISO,
        cmj_value: cmjValue
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getMyPlayerId() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!session?.user?.id) return null;

    const { data, error: e2 } = await supabase
      .from("player_users")
      .select("player_id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (e2) throw e2;
    return data?.player_id ?? null;
  },

  async getLatestWeekAssignmentForPlayer(playerId) {
    const { data, error } = await supabase
      .from("week_assignments")
      .select(`
        week_id,
        status,
        assigned_at,
        weeks:week_id (
          id,
          team_id,
          title,
          week_number,
          start_date,
          end_date,
          iso_year,
          iso_week,
          source_template_id
        )
      `)
      .eq("player_id", playerId)
      .order("assigned_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  },

  async getProgramTemplateWithDaysAndItems(templateId) {
    const { data: template, error: e1 } = await supabase
      .from("program_templates")
      .select("id, team_id, title, description, level, goal, tags, created_at")
      .eq("id", templateId)
      .single();

    if (e1) throw e1;

    const { data: days, error: e2 } = await supabase
      .from("program_template_days")
      .select(`
        id,
        template_id,
        day_index,
        notes,
        created_at,
        program_template_items (
          id,
          template_day_id,
          sort_order,
          item_type,
          name,
          sets,
          reps
        )
      `)
      .eq("template_id", templateId)
      .order("day_index", { ascending: true })
      .order("sort_order", { foreignTable: "program_template_items", ascending: true });

    if (e2) throw e2;

    return { template, days: days || [] };
  },

  async getWeekDays(weekId) {
    const { data, error } = await supabase
      .from("week_days")
      .select("id, week_id, day_index, date, created_at")
      .eq("week_id", weekId)
      .order("day_index", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async listPublishedWeeks(teamId) {
    const { data, error } = await supabase
      .from("weeks")
      .select("id, title, week_number, start_date, end_date, iso_year, iso_week, status, created_at")
      .eq("team_id", teamId)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async publishWeek(payload) {
    const {
      teamId,
      weekId,
      title,
      weekNumber,
      startDate,
      endDate,
      isoYear,
      isoWeek,
      sourceTemplateId,
      days,
    } = payload;

    const weekRow = {
      id: weekId,
      team_id: teamId,
      title: title ?? null,
      week_number: weekNumber ?? null,
      start_date: startDate ?? null,
      end_date: endDate ?? null,
      iso_year: isoYear ?? null,
      iso_week: isoWeek ?? null,
      source_template_id: sourceTemplateId ?? null,
      status: "published",
    };

    const { data: week, error: e1 } = await supabase
      .from("weeks")
      .upsert(weekRow, { onConflict: "id" })
      .select()
      .single();

    if (e1) throw e1;

    const rows = (days || []).map((itemsObj, i) => ({
      week_id: week.id,
      day_index: i,
      items: itemsObj ?? {},
      date: null,
    }));

    for (let i = rows.length; i < 7; i++) {
      rows.push({ week_id: week.id, day_index: i, items: {}, date: null });
    }

    const { error: e2 } = await supabase
      .from("week_days")
      .upsert(rows, { onConflict: "week_id,day_index" });

    if (e2) throw e2;

    return week;
  },

  async assignSelectedWeekToPlayer({ playerId, weekId }) {
    const row = {
      id: crypto.randomUUID ? crypto.randomUUID() : undefined,
      player_id: playerId,
      week_id: weekId,
      status: "assigned",
      assigned_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("week_assignments")
      .upsert(row, { onConflict: "player_id" })
      .select("id, player_id, week_id, status, assigned_at")
      .single();

    if (error) throw error;
    return data;
  },

  async listPublishedWeeks(teamId) {
    const { data, error } = await supabase
      .from("weeks")
      .select("id, title, week_number, start_date, end_date, iso_year, iso_week, status, created_at")
      .eq("team_id", teamId)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async publishWeek(payload) {
    const {
      teamId,
      weekId,
      title,
      weekNumber,
      startDate,
      endDate,
      isoYear,
      isoWeek,
      sourceTemplateId,
      days,
    } = payload;

    const weekRow = {
      id: weekId,
      team_id: teamId,
      title: title ?? null,
      week_number: weekNumber ?? null,
      start_date: startDate ?? null,
      end_date: endDate ?? null,
      iso_year: isoYear ?? null,
      iso_week: isoWeek ?? null,
      source_template_id: sourceTemplateId ?? null,
      status: "published",
    };

    const { data: week, error: e1 } = await supabase
      .from("weeks")
      .upsert(weekRow, { onConflict: "id" })
      .select()
      .single();

    if (e1) throw e1;

    const rows = (days || []).map((itemsObj, i) => ({
      week_id: week.id,
      day_index: i,
      items: itemsObj ?? {},
      date: null,
    }));

    for (let i = rows.length; i < 7; i++) {
      rows.push({ week_id: week.id, day_index: i, items: {}, date: null });
    }

    const { error: e2 } = await supabase
      .from("week_days")
      .upsert(rows, { onConflict: "week_id,day_index" });

    if (e2) throw e2;

    return week;
  },

  async getMyPlayerId() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!session?.user?.id) return null;

    const { data, error: e2 } = await supabase
      .from("player_users")
      .select("player_id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (e2) throw e2;
    return data?.player_id ?? null;
  },

  async getLatestWeekAssignmentForPlayer(playerId) {
    const { data, error } = await supabase
      .from("week_assignments")
      .select(`
        week_id,
        status,
        assigned_at,
        weeks:week_id (
          id,
          team_id,
          title,
          week_number,
          start_date,
          end_date,
          iso_year,
          iso_week,
          source_template_id
        )
      `)
      .eq("player_id", playerId)
      .order("assigned_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  },

  async getProgramTemplateWithDaysAndItems(templateId) {
    const { data: template, error: e1 } = await supabase
      .from("program_templates")
      .select("id, team_id, title, description, level, goal, tags, created_at")
      .eq("id", templateId)
      .single();

    if (e1) throw e1;

    const { data: days, error: e2 } = await supabase
      .from("program_template_days")
      .select(`
        id,
        template_id,
        day_index,
        notes,
        created_at,
        program_template_items (
          id,
          template_day_id,
          sort_order,
          item_type,
          name,
          sets,
          reps
        )
      `)
      .eq("template_id", templateId)
      .order("day_index", { ascending: true })
      .order("sort_order", { foreignTable: "program_template_items", ascending: true });

    if (e2) throw e2;

    return { template, days: days || [] };
  },

  async getWeekDays(weekId) {
    const { data, error } = await supabase
      .from("week_days")
      .select("id, week_id, day_index, date, created_at")
      .eq("week_id", weekId)
      .order("day_index", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async insertCmjAttempt({ playerId, testDateISO, value, protocol = "CMJ_no_arm_swing", metric = "jump_height_cm" }) {
    const { data, error } = await supabase
      .from("cmj_attempts")
      .insert([{
        player_id: playerId,
        test_date: testDateISO,
        value,
        protocol,
        metric
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async rebuildCmjSessionForDate({ playerId, testDateISO }) {
    const { data: attempts, error: aErr } = await supabase
      .from("cmj_attempts")
      .select("value")
      .eq("player_id", playerId)
      .eq("test_date", testDateISO);
    if (aErr) throw aErr;
    if (!attempts || !attempts.length) throw new Error("No attempts for that date");
    const values = attempts.map(a => Number(a.value) || 0).filter(v => v >= 0);
    if (!values.length) throw new Error("No valid attempts");
    const n_attempts = values.length;
    const avg_value = values.reduce((a,b)=>a+b,0) / values.length;
    const best_value = Math.max(...values);
    const { data, error } = await supabase
      .from("cmj_sessions")
      .upsert([{
        player_id: playerId,
        test_date: testDateISO,
        n_attempts,
        avg_value,
        best_value,
        protocol: "CMJ_no_arm_swing",
        metric: "jump_height_cm"
      }], { onConflict: "player_id,test_date" })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getCmjSessionHistory(playerId, limit = 30) {
    const { data, error } = await supabase
      .from("cmj_sessions")
      .select("*")
      .eq("player_id", playerId)
      .order("test_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  async getCmjBestAllTime(playerId) {
    const { data, error } = await supabase
      .from("cmj_sessions")
      .select("best_value")
      .eq("player_id", playerId)
      .order("best_value", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data?.best_value || null;
  },

  async getCmjMostRecent(playerId) {
    const { data, error } = await supabase
      .from("cmj_sessions")
      .select("*")
      .eq("player_id", playerId)
      .order("test_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async createGeneratedPlan({ playerId, dateISO, weekId, readinessState, workoutPayload, source }) {
    const { data, error } = await supabase
      .from("generated_plans")
      .insert([{
        player_id: playerId,
        date: dateISO,
        week_id: weekId || null,
        readiness_state: readinessState || null,
        workout_payload: workoutPayload || {},
        source: source || "auto_readiness"
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
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
    if (!weekId || !(playerIds || []).length) throw new Error("weekId and playerIds required");
    const ids = playerIds.filter(Boolean);
    if (!ids.length) throw new Error("playerIds required");

    // deactivate old assignments
    const { error: updErr } = await supabase
      .from("player_weeks")
      .update({ is_active: false })
      .in("player_id", ids)
      .eq("is_active", true);
    if (updErr) throw updErr;

    const rows = ids.map(pid => ({
      player_id: pid,
      week_id: weekId,
      is_active: true
    }));

    const { data, error } = await supabase
      .from("player_weeks")
      .insert(rows)
      .select();
    if (error) throw error;
    return { assignedCount: data?.length || 0, data };
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

// --- INVITE PLAYER (Netlify Function) ---
async function invitePlayerByEmailViaNetlify({ teamId, email }) {
  const url = "/.netlify/functions/invite-player";
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team_id: teamId, email })
    });
  } catch (e) {
    alert(
      "Invite failed (network).\n\n" +
      "Most likely wrong endpoint URL or blocked request.\n" +
      "Tried: " + url + "\n\n" +
      "Open DevTools → Network and check the failing request.\n\n" +
      "Details: " + (e?.message || e)
    );
    throw e;
  }

  let payloadText = "";
  try { payloadText = await res.text(); } catch (_) {}

  if (!res.ok) {
    alert(
      "Invite failed (HTTP " + res.status + ").\n\n" +
      "Endpoint: " + url + "\n\n" +
      "Response:\n" + (payloadText || "(empty)")
    );
    throw new Error("Invite failed: HTTP " + res.status);
  }

  let data = null;
  try { data = payloadText ? JSON.parse(payloadText) : null; } catch (_) {}
  return data;
}

export async function invitePlayer(playerId, inviteEmail) {
  // Fallback legacy call (kept for compatibility) — if you still want Supabase function
  // invocation with auth token, keep the code below; otherwise you can remove it.
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

export async function invitePlayerEmail({ team_id, player_id, email, mode = "invite" }) {
  const { data: sessionData } = await supabase.auth.getSession();
  const access_token = sessionData?.session?.access_token;
  if (!access_token) throw new Error("Not signed in");

  const { data, error } = await supabase.functions.invoke("invite-player", {
    body: { team_id, player_id, email, mode },
    headers: { Authorization: `Bearer ${access_token}` }
  });

  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || "Invite failed");
  return data;
}

// Expose Netlify invite helper for coach UI
api.invitePlayerByEmailViaNetlify = invitePlayerByEmailViaNetlify;
api.invitePlayerEmail = invitePlayerEmail;

// expose on api for convenience
api.invitePlayer = invitePlayer;

// debug (valfrjálst)
window.__api = api;
window.__supabase = supabase;
// DEBUG ONLY (remove later if you want)
window.supabase = supabase;
window.api = api;

export function makeRandomToken(len = 40) {
  // URL-safe token
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) s += chars[arr[i] % chars.length];
  return s;
}

export async function ensurePlayerToken(playerId, expiresDays = 120) {
  // 1) fetch current token
  const cur = await supabase
    .from("players")
    .select("id, access_token, token_expires_at")
    .eq("id", playerId)
    .maybeSingle();

  if (cur.error) throw cur.error;
  if (!cur.data) throw new Error("Player not found");

  if (cur.data.access_token) return cur.data.access_token;

  // 2) set new token
  const token = makeRandomToken(40);
  const token_expires_at =
    expiresDays ? new Date(Date.now() + expiresDays * 86400000).toISOString() : null;

  const up = await supabase
    .from("players")
    .update({ access_token: token, token_expires_at })
    .eq("id", playerId)
    .select("access_token")
    .maybeSingle();

  if (up.error) throw up.error;
  return up.data.access_token;
}

export function buildPlayerLink(token) {
  const base = window.location.origin;
  return `${base}/player.html?t=${encodeURIComponent(token)}`;
}

export async function rotatePlayerToken(playerId, expiresDays = 90) {
  const token = makeRandomToken(40);
  const token_expires_at = expiresDays ? new Date(Date.now() + expiresDays * 86400000).toISOString() : null;

  const up = await supabase
    .from("players")
    .update({ access_token: token, token_expires_at })
    .eq("id", playerId)
    .select("access_token")
    .maybeSingle();

  if (up.error) throw up.error;
  return buildPlayerLink(up.data.access_token);
}

export function getAuthSession() {
  return getCachedSession();
}

export async function listMyTeams() {
  // Prefer auth.getUser to avoid cached-session issues
  let userId = null;
  try {
    const { data: userData } = await supabase.auth.getUser();
    userId = userData?.user?.id || null;
  } catch (e) {
    console.warn("getUser failed, falling back to getSession:", e);
  }

  if (!userId) {
    try {
      const session = await api.getSession();
      userId = session?.user?.id || null;
    } catch (_) {}
  }

  if (!userId) return [];

  const { data, error } = await supabase
    .from("team_members")
    .select("team_id, teams:team_id ( id, name )")
    .eq("user_id", userId);

  if (error) {
    console.error("listMyTeams error:", error);
    throw error;
  }

  return (data || []).map(r => ({
    team_id: r.team_id,
    team: r.teams
  }));
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
  // Mark ready on first event if not already (some environments skip INITIAL_SESSION)
  if (!__authReady) {
    __authReady = true;
    __resolveAuthReady?.(session || null);
    window.dispatchEvent(new CustomEvent("auth:ready", { detail: { session: session || null } }));
  }

  if (event === "INITIAL_SESSION") {
    __cachedSession = session || null;
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

// expose for non-module scripts (modals, legacy code)
window.supabase = supabase;
window.api = window.api || {};
window.api.supabase = supabase;

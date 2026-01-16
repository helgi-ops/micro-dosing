import { supabase, waitForAuthReady, getCachedSession } from "./dataClient.js";

export const ROUTES = {
  coach: "./index.html",
  player: "./player.html",
  login: "./login.html"
};

const PLAYER_USER_COL = "user_id"; // change to "auth_user_id" if your schema uses that

export async function getSessionSafe() {
  try { await waitForAuthReady?.(); } catch {}
  const cached = getCachedSession?.();
  if (cached) return cached;
  const { data } = await supabase.auth.getSession();
  return data?.session || null;
}

export async function resolveMyRole() {
  const session = await getSessionSafe();
  if (!session?.user?.id) return { role: "anon", session: null };

  const userId = session.user.id;

  {
    const { data, error } = await supabase
      .from("team_members")
      .select("role, team_id")
      .eq("user_id", userId)
      .limit(1);

    if (!error && data?.length) {
      const r = data[0].role || "coach";
      const role = (r === "admin" || r === "coach") ? r : "coach";
      return { role, session, team_id: data[0].team_id };
    }
  }

  {
    const { data, error } = await supabase
      .from("players")
      .select("id, status, team_id")
      .eq(PLAYER_USER_COL, userId)
      .limit(1);

    if (!error && data?.length) {
      return { role: "player", session, player_id: data[0].id, team_id: data[0].team_id };
    }
  }

  return { role: "no_access", session };
}

export async function routeAfterLogin() {
  const r = await resolveMyRole();
  if (r.role === "admin" || r.role === "coach") {
    window.location.href = ROUTES.coach;
    return;
  }
  if (r.role === "player") {
    window.location.href = ROUTES.player;
    return;
  }
  return r;
}

export async function requireRole(allowedRoles = []) {
  const r = await resolveMyRole();

  if (r.role === "anon") {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `${ROUTES.login}?next=${next}`;
    return { ok: false, reason: "anon" };
  }

  if (!allowedRoles.includes(r.role)) {
    return { ok: false, reason: "forbidden", role: r.role, session: r.session };
  }

  return { ok: true, ...r };
}

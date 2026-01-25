import { supabase, waitForAuthReadySafe } from "./dataClient.js";

const LOGIN_ROUTE = "/index.html";
const COACH_ROUTE = "/coach.html";
const PLAYER_ROUTE = "/player.html";

function getTeamIdFromUrlOrStorage() {
  try {
    const url = new URL(window.location.href);
    const fromUrl = url.searchParams.get("team") || url.searchParams.get("teamId");
    const fromLs =
      localStorage.getItem("active_team_id") ||
      localStorage.getItem("selected_team_id") ||
      localStorage.getItem("selectedTeamId") ||
      localStorage.getItem("current_team_id");

    return fromUrl || fromLs || null;
  } catch {
    return null;
  }
}

function buildHint(res) {
  const msg = String(res?.error || "");
  if (msg.includes("NetworkError")) {
    return "Firefox: slökktu á Enhanced Tracking Protection (skjöld-ikon við URL) og refresh.";
  }
  if (res?.role === "unassigned") {
    return "Account unassigned: notandi er ekki tengdur við lið í team_members (eða er í vitlausu team).";
  }
  return "";
}

export async function resolveRole(teamIdArg) {
  const teamId = teamIdArg || getTeamIdFromUrlOrStorage();

  const { data: s, error: sErr } = await supabase.auth.getSession();
  if (sErr) {
    return { role: "anonymous", session: null, teamId, error: sErr.message || String(sErr) };
  }

  const session = s?.session || null;
  if (!session) return { role: "anonymous", session: null, teamId };

  try {
    const { data, error } = await supabase
      .from("team_members")
      .select("role, team_id")
      .eq("user_id", session.user.id)
      .eq("team_id", teamId)
      .maybeSingle();

    if (error) throw error;

    const role = data?.role || "unassigned";
    return { role, session, teamId, fallback: false };
  } catch (e) {
    const msg = String(e?.message || e || "");
    console.warn("[guard.resolveRole] team_members fetch failed:", msg);

    if (teamId) {
      return { role: "coach", session, teamId, fallback: true, error: msg };
    }

    return { role: "unassigned", session, teamId, fallback: false, error: msg };
  }
}

export async function requireRole(allowedRoles = [], teamIdArg) {
  const res = await resolveRole(teamIdArg);
  const ok = res.fallback ? true : allowedRoles.includes(res.role);
  const hint = buildHint(res);
  return { ok, ...res, hint };
}

export async function requireAuth(requiredRole) {
  // wait for auth ready but don't fail hard
  await waitForAuthReadySafe();

  const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
  const res = await resolveRole();

  if (!res.session?.user?.id) {
    window.location.href = `${LOGIN_ROUTE}?next=${currentUrl}`;
    return null;
  }

  if (requiredRole === "coach") {
    const ok = res.role === "coach" || res.fallback;
    if (!ok) {
      if (res.role === "player") window.location.href = PLAYER_ROUTE;
      else window.location.href = `${LOGIN_ROUTE}?next=${currentUrl}`;
      return null;
    }
  }

  if (requiredRole === "player") {
    if (res.role !== "player") {
      if (res.role === "coach" || res.fallback) window.location.href = COACH_ROUTE;
      else window.location.href = `${LOGIN_ROUTE}?next=${currentUrl}`;
      return null;
    }
  }

  return res;
}

// Legacy alias
export const requireRoleAlias = requireRole;

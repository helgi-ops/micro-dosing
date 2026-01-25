import { supabase, waitForAuthReadySafe } from "./dataClient.js";

// Helper to read team id from URL or storage (used for fallback when network blocks team_members)
function getTeamIdFromUrlOrStorage() {
  try {
    const url = new URL(window.location.href);
    const teamFromUrl = url.searchParams.get("team");
    const teamFromStorage =
      window.localStorage.getItem("current_team_id") ||
      window.localStorage.getItem("team_id") ||
      window.localStorage.getItem("selectedTeamId");

    return teamFromUrl || teamFromStorage || null;
  } catch {
    return null;
  }
}

// Resolve the user's role deterministically from Supabase
export async function resolveRole(teamIdArg) {
  const teamId = teamIdArg || getTeamIdFromUrlOrStorage();
  try {
    const sess = await waitForAuthReadySafe();
    const session = sess || (await supabase.auth.getSession()).data?.session || null;
    if (!session?.user?.id) return { role: "anonymous" };

    const userId = session.user.id;

    const { data: playerRow, error: playerErr } = await supabase
      .from("players")
      .select("*")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (playerErr) console.warn("[resolveRole] players error", playerErr);
    if (playerRow) {
      const res = { role: "player", player: playerRow, session, teamId };
      console.log("[auth] role resolved:", res.role, res);
      return res;
    }

    try {
      const { data, error } = await supabase
        .from("team_members")
        .select("role, team_id")
        .eq("user_id", userId)
        .eq("team_id", teamId)
        .maybeSingle();

      if (error) throw error;

      const role = data?.role || "unassigned";
      const res = { role, session, teamId, teamIds: data?.team_id ? [data.team_id] : [] };
      console.log("[auth] role resolved:", res.role, res);
      return res;
    } catch (e) {
      const msg = String(e?.message || e || "");
      console.warn("[resolveRole] team_members fetch failed:", e);

      if (teamId) {
        console.warn(
          "[resolveRole] Fallback role=coach due to fetch failure. If on Firefox, disable Enhanced Tracking Protection for this site."
        );
        return { role: "coach", session, teamId, fallback: true, error: msg };
      }

      const res = { role: "unassigned", session, teamId, error: msg };
      console.log("[auth] role resolved:", res.role, res);
      return res;
    }
  } catch (e) {
    console.error("[resolveRole] fatal", e);
    const res = { role: "anonymous" };
    console.log("[auth] role resolved:", res.role, res);
    return res;
  }
}

// Called on index.html to route after login
export async function routeFromLogin() {
  const sess = await waitForAuthReadySafe();
  if (!sess) {
    console.warn("[routeFromLogin] not signed in");
    return;
  }

  const result = await resolveRole();
  console.log("[routeFromLogin] role", result.role);

  if (result.role === "player") {
    location.href = "/player.html";
    return;
  }
  if (result.role === "coach") {
    location.href = "/coach.html";
    return;
  }

  const msgEl = document.getElementById("msg");
  if (msgEl) msgEl.textContent = "Account is not assigned. Contact admin.";
  console.warn("[routeFromLogin] Account unassigned");
}

// Role gate that returns detail (no redirect here)
export async function requireRole(allowedRoles = []) {
  const teamId = getTeamIdFromUrlOrStorage();
  const res = await resolveRole(teamId);

  const ok = allowedRoles.includes(res.role);
  if (!ok) {
    const hint =
      res?.error?.includes("NetworkError") || res?.fallback
        ? "Firefox: slökktu á Enhanced Tracking Protection (skjöld-ikon við URL) og refresh."
        : "Þú ert ekki með coach/admin aðgang í þessu liði.";

    return { ok: false, ...res, hint };
  }

  return { ok: true, ...res };
}

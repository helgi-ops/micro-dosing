import { supabase, waitForAuthReadySafe } from "./dataClient.js";

// Resolve the user's role deterministically from Supabase
export async function resolveRole() {
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
      const res = { role: "player", player: playerRow, session };
      console.log("[auth] role resolved:", res.role, res);
      return res;
    }

    const { data: tmRows, error: tmErr } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", userId);
    if (tmErr) console.warn("[resolveRole] team_members error", tmErr);
    if (tmRows && tmRows.length) {
      const res = { role: "coach", teamIds: tmRows.map((r) => r.team_id), session };
      console.log("[auth] role resolved:", res.role, res);
      return res;
    }

    const res = { role: "unassigned", session };
    console.log("[auth] role resolved:", res.role, res);
    return res;
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

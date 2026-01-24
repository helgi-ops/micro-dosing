import { supabase } from "./supabaseClient.js";
import { waitForAuthReadySafe } from "./dataClient.js";

const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, "/");
export const ROUTES = {
  login: baseUrl + "index.html",
};

export async function requireAuth(requiredRole) {
  const session = await waitForAuthReadySafe();
  if (!session?.user?.id) {
    window.location.href = ROUTES.login;
    return null;
  }

  const userId = session.user.id;

  if (requiredRole === "coach") {
    const { data: tm, error: tmErr } = await supabase
      .from("team_members")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (tmErr || !tm) {
      window.location.href = ROUTES.login;
      return null;
    }
  }

  if (requiredRole === "player") {
    const { data: pl, error: plErr } = await supabase
      .from("players")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (plErr || !pl) {
      window.location.href = ROUTES.login;
      return null;
    }
  }

  return session;
}

// Convenience to support existing code expecting multi-role array
export async function requireRole(roles = []) {
  const session = await waitForAuthReadySafe();
  if (!session?.user?.id) {
    window.location.href = ROUTES.login;
    return { ok: false };
  }
  const userId = session.user.id;

  const wantsCoach = roles.includes("coach") || roles.includes("admin");
  const wantsPlayer = roles.includes("player");

  if (wantsCoach) {
    const { data: tm } = await supabase
      .from("team_members")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (tm) return { ok: true, role: "coach", session };
  }

  if (wantsPlayer) {
    const { data: pl } = await supabase
      .from("players")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (pl) return { ok: true, role: "player", session };
  }

  window.location.href = ROUTES.login;
  return { ok: false };
}

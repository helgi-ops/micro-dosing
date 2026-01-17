import { supabase } from "./supabaseClient.js";

export async function requireAuth(requiredRole) {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    window.location.href = "/index.html";
    return null;
  }
  const session = data?.session;
  if (!session?.user?.id) {
    window.location.href = "/index.html";
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
      window.location.href = "/index.html";
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
      window.location.href = "/index.html";
      return null;
    }
  }

  return session;
}

// Convenience to support existing code expecting multi-role array
export async function requireRole(roles = []) {
  const { data } = await supabase.auth.getSession();
  const session = data?.session;
  if (!session?.user?.id) {
    window.location.href = "/index.html";
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

  window.location.href = "/index.html";
  return { ok: false };
}

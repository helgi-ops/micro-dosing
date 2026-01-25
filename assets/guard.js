import { supabase, waitForAuthReadySafe } from "./dataClient.js";
import { resolveRole } from "./authGuard.js";

const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, "/");
const LOGIN_ROUTE = "/index.html";
const COACH_ROUTE = "/coach.html";
const PLAYER_ROUTE = "/player.html";

export async function requireAuth(requiredRole) {
  const session = await waitForAuthReadySafe();
  const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);

  if (!session?.user?.id) {
    window.location.href = `${LOGIN_ROUTE}?next=${currentUrl}`;
    return null;
  }

  const resolved = await resolveRole();
  console.log("[auth] requireAuth", { requiredRole, role: resolved.role });

  if (requiredRole === "coach" && resolved.role !== "coach") {
    if (resolved.role === "player") window.location.href = PLAYER_ROUTE;
    else window.location.href = `${LOGIN_ROUTE}?next=${currentUrl}`;
    return null;
  }
  if (requiredRole === "player" && resolved.role !== "player") {
    if (resolved.role === "coach") window.location.href = COACH_ROUTE;
    else window.location.href = `${LOGIN_ROUTE}?next=${currentUrl}`;
    return null;
  }

  return resolved;
}

// Alias for legacy imports
export const requireRole = requireAuth;

import { supabase, waitForAuthReadySafe } from "./dataClient.js";

export async function requireSession({ allowDebug = true } = {}) {
  const params = new URLSearchParams(location.search);
  const debug = allowDebug && params.get("debug") === "1";

  const session = await waitForAuthReadySafe();
  if (session) return { ok: true, session, debug };

  if (!debug) {
    const next = encodeURIComponent(location.pathname + location.search);
    location.replace(`/index.html?next=${next}`);
  } else {
    console.warn("DEBUG: redirect to login blocked (no session)");
  }
  return { ok: false, session: null, debug };
}

export async function routeFromLogin() {
  const session = await waitForAuthReadySafe();
  if (!session) return;

  const params = new URLSearchParams(location.search);
  const next = params.get("next");
  location.replace(next ? decodeURIComponent(next) : "/coach.html");
}

import { supabase } from "./dataClient.js";

export async function requireSession({ allowDebug = true } = {}) {
  const params = new URLSearchParams(location.search);
  const debug = allowDebug && params.get("debug") === "1";

  const { data, error } = await supabase.auth.getSession();
  if (error) console.warn("getSession error:", error);

  if (data?.session) return { ok: true, session: data.session, debug };

  if (!debug) {
    const next = encodeURIComponent(location.pathname + location.search);
    location.replace(`/index.html?next=${next}`);
  }
  return { ok: false, session: null, debug };
}

export async function routeFromLogin() {
  const { data } = await supabase.auth.getSession();
  if (!data?.session) return;

  const params = new URLSearchParams(location.search);
  const next = params.get("next");
  location.replace(next ? decodeURIComponent(next) : "/coach.html");
}

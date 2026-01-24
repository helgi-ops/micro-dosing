import { supabase, waitForAuthReadySafe } from "./dataClient.js";

// Session-first: if not signed in, allow token view; otherwise redirect to login
export async function requirePlayerAuth() {
  const sess = await waitForAuthReadySafe();
  if (sess?.user) return sess;

  const qs = new URLSearchParams(location.search);
  const token = qs.get("t") || qs.get("token") || "";
  if (token) return null; // allow token-based readonly view

  const next = encodeURIComponent(location.pathname + location.search);
  location.replace(`/index.html?next=${next}`);
  return null;
}

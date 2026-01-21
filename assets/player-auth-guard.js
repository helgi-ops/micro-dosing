import { supabase } from "./supabaseClient.js";

export async function requirePlayerAuth() {
  const { data: { session } = {} } = await supabase.auth.getSession();
  if (session) return session;

  const token = new URLSearchParams(location.search).get("t") || "";
  if (!token) {
    location.replace("/index.html");
    return null;
  }

  // Token-based view is allowed; sessionless but token present
  return null;
}

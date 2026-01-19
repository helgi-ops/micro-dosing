import { supabase } from "./dataClient.js";

// Prevent redirect ping-pong
const LOOP_KEY = "auth_redirect_lock_v1";

function setLock() {
  localStorage.setItem(LOOP_KEY, String(Date.now()));
}
function hasRecentLock(ms = 1500) {
  const v = Number(localStorage.getItem(LOOP_KEY) || "0");
  return v && (Date.now() - v) < ms;
}

export async function requireAuth({ onAuthed, onUnAuthed }) {
  const { data } = await supabase.auth.getSession();
  const session = data?.session || null;

  supabase.auth.onAuthStateChange((_event, newSession) => {
    if (hasRecentLock()) return;
    if (newSession) onAuthed?.(newSession);
    else onUnAuthed?.();
  });

  if (session) {
    onAuthed?.(session);
  } else {
    // If a redirect just happened, give auth a moment before treating as unauthed
    if (hasRecentLock()) return;
    onUnAuthed?.();
  }
}

export const authLoopLock = { setLock, hasRecentLock };

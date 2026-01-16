import { supabase, waitForAuthReady, getCachedSession } from "./dataClient.js";
import { routeAfterLogin, ROUTES } from "./guard.js";

const $ = (id) => document.getElementById(id);

function setStatus(t) { $("status").textContent = t || ""; }
function setMsg(t, cls) {
  const el = $("msg");
  el.className = cls ? cls : "muted";
  el.textContent = t || "";
}

function getNext() {
  const u = new URL(window.location.href);
  return u.searchParams.get("next");
}

async function getSessionCached() {
  await waitForAuthReady?.();
  const cached = getCachedSession?.();
  if (cached) return cached;
  const { data } = await supabase.auth.getSession();
  return data?.session || null;
}

async function goNextOrRole() {
  const next = getNext();
  if (next) {
    window.location.href = next;
    return;
  }
  const r = await routeAfterLogin();
  if (r?.role === "no_access") {
    setStatus("Signed in");
    setMsg("Signed in, but you don’t have access yet (no team member / player link found).", "err");
    $("signOutBtn").style.display = "inline-block";
  }
}

async function init() {
  setStatus("Checking session…");
  const session = await getSessionCached();

  if (session) {
    $("signOutBtn").style.display = "inline-block";
    setStatus("Signed in");
    await goNextOrRole();
  } else {
    setStatus("Not signed in");
  }

  supabase.auth.onAuthStateChange(async () => {
    const s = await getSessionCached();
    if (s) {
      $("signOutBtn").style.display = "inline-block";
      setStatus("Signed in");
      await goNextOrRole();
    } else {
      $("signOutBtn").style.display = "none";
      setStatus("Not signed in");
    }
  });

  $("signInBtn").onclick = async () => {
    try {
      setMsg("");
      const email = $("email").value.trim();
      const password = $("password").value;
      if (!email || !password) throw new Error("Enter email + password.");

      setStatus("Signing in…");
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      setStatus("Signed in");
      setMsg("Success. Routing…", "ok");
      await goNextOrRole();
    } catch (e) {
      setStatus("Error");
      setMsg(e?.message || String(e), "err");
    }
  };

  $("signUpBtn").onclick = async () => {
    try {
      setMsg("");
      const email = $("email").value.trim();
      const password = $("password").value;
      if (!email || !password) throw new Error("Enter email + password.");

      setStatus("Creating account…");
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      setStatus("Account created");
      setMsg("Account created. If email confirmation is enabled, confirm your email then sign in.", "ok");
    } catch (e) {
      setStatus("Error");
      setMsg(e?.message || String(e), "err");
    }
  };

  $("signOutBtn").onclick = async () => {
    await supabase.auth.signOut();
    setMsg("Signed out.", "muted");
    setStatus("Not signed in");
    $("signOutBtn").style.display = "none";
    window.location.href = ROUTES.login;
  };
}

init();

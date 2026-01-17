import { supabase, waitForAuthReady, getCachedSession } from "./dataClient.js";
import { ROUTES } from "./guard.js";

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
}

async function routeUser(session) {
  const userId = session?.user?.id;
  if (!userId) return;

  // coach?
  const { data: tm } = await supabase
    .from("team_members")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (tm) {
    window.location.href = "/coach.html";
    return;
  }

  const { data: pl } = await supabase
    .from("players")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (pl) {
    window.location.href = "/player.html";
    return;
  }

  setMsg("No role assigned. Contact your coach.", "err");
  $("signOutBtn").style.display = "inline-block";
}

async function init() {
  setStatus("Checking session…");
  const session = await getSessionCached();

  if (session) {
    $("signOutBtn").style.display = "inline-block";
    setStatus("Signed in");
    await goNextOrRole();
    await routeUser(session);
  } else {
    setStatus("Not signed in");
  }

  supabase.auth.onAuthStateChange(async (_event, s) => {
    const sess = s || await getSessionCached();
    if (sess) {
      $("signOutBtn").style.display = "inline-block";
      setStatus("Signed in");
      await goNextOrRole();
      await routeUser(sess);
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
      const sess = await getSessionCached();
      await goNextOrRole();
      if (sess) await routeUser(sess);
    } catch (e) {
      setStatus("Error");
      setMsg(e?.message || String(e), "err");
    }
  };

  $("forgotLink").onclick = (e) => {
    e.preventDefault();
    document.getElementById("pwArea").style.display = "none";
    document.getElementById("resetArea").style.display = "block";
  };

  $("backToLogin").onclick = (e) => {
    e.preventDefault();
    document.getElementById("resetArea").style.display = "none";
    document.getElementById("pwArea").style.display = "block";
    setMsg("");
  };

  $("sendResetBtn").onclick = async () => {
    try {
      setMsg("");
      const email = $("email").value.trim();
      if (!email) throw new Error("Enter your email.");
      setStatus("Sending reset link…");
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname.replace(/\/[^/]*$/, "/") + "reset-password.html"
      });
      setStatus("If an account exists, reset link sent");
      setMsg("If an account exists for this email, a password reset link has been sent.", "ok");
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

import { supabase, waitForAuthReady, waitForAuthReadySafe, getCachedSession } from "./dataClient.js";
import { routeFromLogin } from "./authGuard.js";

const $ = (id) => document.getElementById(id);
const LOGIN_URL = baseUrl + "index.html";
const RESET_URL = baseUrl + "reset-password.html";

async function onLoginSuccess() {
  await new Promise(r => setTimeout(r, 50));
  routeFromLogin();
}

function setStatus(t) { $("status").textContent = t || ""; }
function setMsg(t, cls) {
  const el = $("msg");
  el.className = cls ? cls : "muted";
  el.textContent = t || "";
}

function showResetMode(on) {
  const resetArea = $("resetArea");
  if (resetArea) resetArea.style.display = on ? "block" : "none";
  const backToLogin = $("backToLoginLink") || $("backToLogin");
  if (backToLogin) backToLogin.style.display = on ? "inline" : "none";
  const pwArea = $("pwArea");
  if (pwArea) pwArea.style.display = on ? "none" : "block";
  const signInBtn = $("signInBtn");
  if (signInBtn) signInBtn.disabled = on;
  const signUpBtn = $("signUpBtn");
  if (signUpBtn) signUpBtn.disabled = on;
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

async function init() {
  setStatus("Checking session…");
  showResetMode(false);

  // If already signed in, move along
  try {
    const sess = await waitForAuthReadySafe();
    if (sess) {
      setStatus("Signed in");
      routeFromLogin();
      return;
    }
  } catch (_) {}

  // --- Handle Supabase email links (confirm/invite/recovery) ---
  try {
    const url = new URL(window.location.href);
    const hasCode = url.searchParams.get("code");
    const hasError = url.searchParams.get("error") || url.searchParams.get("error_description");

    if (hasError) {
      const msg = url.searchParams.get("error_description") || url.searchParams.get("error");
      setStatus("Error");
      setMsg(decodeURIComponent(msg || "Auth error"), "err");
    } else if (hasCode) {
      setStatus("Finalizing sign-in…");
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
      if (error) throw error;
      try { window.history.replaceState({}, document.title, LOGIN_URL); } catch (_) {}
      setStatus("Signed in");
      setMsg("Success. Routing…", "ok");
    }
  } catch (e) {
    setStatus("Error");
    setMsg(e?.message || String(e), "err");
  }

  // --- UI bindings first so they work even if session fetch errors ---
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
      const sess = await waitForAuthReadySafe();
      await goNextOrRole();
      if (sess) await routeFromLogin();
      await onLoginSuccess();
    } catch (e) {
      setStatus("Error");
      setMsg(e?.message || String(e), "err");
    }
  };

  const signUpBtn = $("signUpBtn");
  if (signUpBtn) {
    signUpBtn.onclick = async () => {
      try {
        setMsg("");
        const email = $("email").value.trim();
        const password = $("password").value;
        if (!email || !password) throw new Error("Enter email + password.");
        setStatus("Creating account…");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: LOGIN_URL }
        });
        if (error) throw error;
        setStatus("Account created");
        const needsVerify = !data?.session;
        setMsg(
          needsVerify
            ? "Check your email to confirm, then contact an admin to be added to a team."
            : "Account created. Contact an admin to be added to a team.",
          "ok"
        );
        if (data?.session) await onLoginSuccess();
      } catch (e) {
        setStatus("Error");
        setMsg(e?.message || String(e), "err");
      }
    };
  }

  const resendBtn = $("resendBtn");
  if (resendBtn) {
    resendBtn.onclick = async () => {
      try {
        setMsg("");
        const email = $("email").value.trim();
        if (!email) throw new Error("Enter your email first.");
        setStatus("Resending confirmation…");
        const { error } = await supabase.auth.resend({
          type: "signup",
          email,
          options: { emailRedirectTo: LOGIN_URL }
        });
        if (error) throw error;
        setStatus("Email sent");
        setMsg("Confirmation email sent (check inbox/spam).", "ok");
      } catch (e) {
        setStatus("Error");
        setMsg(e?.message || String(e), "err");
      }
    };
  }

  const forgotLink = $("forgotPwLink") || $("forgotLink");
  if (forgotLink) {
    forgotLink.onclick = (e) => {
      e.preventDefault();
      setMsg("");
      showResetMode(true);
      setStatus("Reset password");
    };
  }

  const backToLogin = $("backToLoginLink") || $("backToLogin");
  if (backToLogin) {
    backToLogin.onclick = (e) => {
      e.preventDefault();
      setMsg("");
      showResetMode(false);
      setStatus("Not signed in");
    };
  }

  $("sendResetBtn").onclick = async () => {
    try {
      setMsg("");
      const email = $("email").value.trim();
      if (!email) throw new Error("Enter your email.");
      setStatus("Sending reset link…");
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/reset-password.html`,
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
    window.location.href = LOGIN_URL;
  };

  // --- Session handling after UI is wired ---
  let session = null;
  try {
    session = await waitForAuthReadySafe();
  } catch (e) {
    setStatus("Error");
    setMsg(e?.message || String(e), "err");
  }

  if (session) {
    $("signOutBtn").style.display = "inline-block";
    setStatus("Signed in");
    // Only auto-route if explicit ?next= is present
    if (getNext()) {
      await goNextOrRole();
      await routeFromLogin();
    }
  } else if ($("status").textContent === "Checking session…") {
    setStatus("Not signed in");
  }

  supabase.auth.onAuthStateChange(async (event, s) => {
    const sess = s || await getSessionCached().catch(() => null);
    if (sess) {
      $("signOutBtn").style.display = "inline-block";
      setStatus("Signed in");
      if (event === "SIGNED_IN") {
        await goNextOrRole();
        await routeFromLogin();
        await onLoginSuccess();
      }
    } else {
      $("signOutBtn").style.display = "none";
      setStatus("Not signed in");
    }
  });
}

init();

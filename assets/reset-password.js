import { supabase, waitForAuthReady } from "./dataClient.js";

const $ = (id) => document.getElementById(id);

function setStatus(t) { $("status").textContent = t || ""; }
function setMsg(t, cls) {
  const el = $("msg");
  el.className = cls ? cls : "muted";
  el.textContent = t || "";
}

async function ensureRecoverySession() {
  await waitForAuthReady?.();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const session = data?.session;
  if (!session || !session?.user) throw new Error("No recovery session found.");
  return session;
}

async function init() {
  const btn = $("setPasswordBtn");
  btn.disabled = true; // enable only when session is valid

  // If tokens arrive in URL fragment (implicit flow), set session from them
  try {
    const hash = window.location.hash || "";
    if (hash.includes("access_token=") && hash.includes("refresh_token=")) {
      const params = new URLSearchParams(hash.replace(/^#/, ""));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
        history.replaceState({}, document.title, window.location.pathname);
      }
    }
  } catch (e) {
    // ignore; will be caught by session check
  }

  // 1) Finalize PKCE recovery link (MUST be awaited)
  try {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const type = url.searchParams.get("type");

    const err = url.searchParams.get("error_description") || url.searchParams.get("error");
    if (err) throw new Error(decodeURIComponent(err));

    if (code && type === "recovery") {
      setStatus("Verifying reset link…");
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
      if (error) throw error;

      // Clean URL (remove code/type params)
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  } catch (e) {
    setStatus("Error");
    setMsg(e?.message || "Invalid or expired reset link.", "err");
    return;
  }

  // 2) Ensure we actually have a recovery session
  try {
    setStatus("Checking session…");
    await ensureRecoverySession();
    setStatus("Ready");
    btn.disabled = false;
  } catch (e) {
    setStatus("Error");
    setMsg("Invalid or missing recovery session. Please use the reset link from your email.", "err");
    return;
  }

  // 3) Set password
  btn.addEventListener("click", async () => {
    try {
      setMsg("");
      const pw = $("newPassword").value;
      const pw2 = $("confirmPassword").value;

      if (!pw || !pw2) throw new Error("Enter both fields.");
      if (pw !== pw2) throw new Error("Passwords do not match.");
      if (pw.length < 8) throw new Error("Password must be at least 8 characters.");

      btn.disabled = true;
      setStatus("Updating…");

      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;

      setStatus("Updated");
      setMsg("Password updated. Signing out…", "ok");

      await supabase.auth.signOut();

      setStatus("Redirecting…");
      setTimeout(() => { window.location.href = "./index.html"; }, 600);
    } catch (e) {
      setStatus("Error");
      setMsg(e?.message || String(e), "err");
      btn.disabled = false;
    }
  });
}

init();

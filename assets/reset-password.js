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
  // --- PKCE recovery: exchange ?code for a session ---
  try {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const type = url.searchParams.get("type");
    const hasError = url.searchParams.get("error") || url.searchParams.get("error_description");

    if (hasError) {
      const msg = url.searchParams.get("error_description") || url.searchParams.get("error");
      throw new Error(decodeURIComponent(msg || "Auth error"));
    }

    if (code && type === "recovery") {
      setStatus("Verifying reset link…");
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
      if (error) throw error;

      try { window.history.replaceState({}, document.title, window.location.pathname); } catch (_) {}

      setStatus("Link verified");
    }
  } catch (e) {
    setStatus("Error");
    setMsg(e?.message || "Invalid or expired reset link.", "err");
    $("setPasswordBtn").disabled = true;
    return;
  }

  try {
    setStatus("Checking session…");
    await ensureRecoverySession();
    setStatus("Ready");
  } catch (e) {
    setStatus("Error");
    setMsg("Invalid or missing recovery session. Please use the reset link from your email.", "err");
    $("setPasswordBtn").disabled = true;
    return;
  }

  $("setPasswordBtn").onclick = async () => {
    try {
      setMsg("");
      const pw = $("newPassword").value;
      const pw2 = $("confirmPassword").value;
      if (!pw || !pw2) throw new Error("Enter both fields.");
      if (pw !== pw2) throw new Error("Passwords do not match.");

      setStatus("Updating…");
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;

      setStatus("Updated");
      setMsg("Password updated. Signing out…", "ok");
      setStatus("Redirecting…");
      setTimeout(async () => {
        try { await supabase.auth.signOut(); } catch (_) {}
        window.location.href = "./index.html";
      }, 1200);
    } catch (e) {
      setStatus("Error");
      setMsg(e?.message || String(e), "err");
    }
  };
}

init();

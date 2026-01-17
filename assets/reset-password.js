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
      setMsg("Password updated. Redirecting to login…", "ok");
      setTimeout(() => { window.location.href = "./index.html"; }, 1200);
    } catch (e) {
      setStatus("Error");
      setMsg(e?.message || String(e), "err");
    }
  };
}

init();

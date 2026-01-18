import { supabase } from "./dataClient.js";

document.addEventListener("DOMContentLoaded", init);

async function init() {
  setStatus("Checking session...");

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    showError("Invalid or expired reset link.");
    disableForm();
    return;
  }

  // ✅ Recovery session is present
  setStatus("Ready");
  enableForm();
}

const form = document.querySelector("#reset-form");
const passwordInput = document.querySelector("#new-password");
const confirmInput = document.querySelector("#confirm-password");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const password = passwordInput.value;
  const confirm = confirmInput.value;

  if (!password || password !== confirm) {
    showError("Passwords do not match.");
    return;
  }

  setStatus("Updating password...");

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    showError(error.message);
    return;
  }

  setStatus("Password updated. Redirecting...");
  await supabase.auth.signOut();
  window.location.href = "/index.html";
});

/* ---------- helpers ---------- */

function setStatus(text) {
  const el = document.querySelector("#status-text");
  if (el) el.textContent = text;
}

function showError(msg) {
  const el = document.querySelector("#error-text");
  if (el) el.textContent = msg;
}

function disableForm() {
  form.querySelectorAll("input, button").forEach((el) => (el.disabled = true));
}

function enableForm() {
  form.querySelectorAll("input, button").forEach((el) => (el.disabled = false));
}

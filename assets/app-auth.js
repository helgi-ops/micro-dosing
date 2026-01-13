// assets/app-auth.js
import { api, supabase } from "./dataClient.js";

function el(id) { return document.getElementById(id); }

function ensureAuthUI(hostEl) {
  // Býr til lítið auth box ef það er ekki til
  const old = document.getElementById("authBox");
if (old) old.remove();

  const host =
    hostEl ||
    document.getElementById("supabaseHooks") ||
    document.querySelector("main") ||
    document.body;

  const box = document.createElement("div");
  box.id = "authBox";
  box.style.cssText =
    "margin:12px 0; padding:12px; border:1px solid rgba(255,255,255,.12); border-radius:12px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;";

  box.innerHTML = `
    <input id="authEmail" type="email" placeholder="email fyrir innskráningu"
      style="min-width:240px; padding:10px; border-radius:10px; border:1px solid rgba(255,255,255,.12); background:transparent; color:inherit;" />
    <button id="btnSignIn" style="padding:10px 14px; border-radius:10px;">Send login link</button>
    <button id="btnSignOut" style="padding:10px 14px; border-radius:10px;">Sign out</button>
    <span id="authStatus" style="opacity:.85;"></span>

    <span style="margin-left:10px; opacity:.7;">Team:</span>
    <select id="teamSelect"
      style="min-width:240px; padding:10px; border-radius:10px; border:1px solid rgba(255,255,255,.12); background:transparent; color:inherit;">
      <option value="">— Veldu lið —</option>
    </select>
    <span id="teamStatus" style="opacity:.75;"></span>
  `;

  host.prepend(box);

  document.getElementById("btnSignIn").addEventListener("click", async () => {
    const email = document.getElementById("authEmail").value.trim();
    if (!email) return (document.getElementById("authStatus").textContent = "Sláðu inn email.");
    document.getElementById("authStatus").textContent = "Sendi login link…";
    try {
      await api.signInWithEmail(email);
      document.getElementById("authStatus").textContent = "Login link sent á email.";
    } catch (e) {
      console.error(e);
      document.getElementById("authStatus").textContent = "Villa: " + (e?.message || e);
    }
  });

  document.getElementById("btnSignOut").addEventListener("click", async () => {
    document.getElementById("authStatus").textContent = "Signing out…";
    try {
      await api.signOut();
      document.getElementById("authStatus").textContent = "Signed out.";
      await loadTeams();
    } catch (e) {
      console.error(e);
      document.getElementById("authStatus").textContent = "Villa: " + (e?.message || e);
    }
  });

  document.getElementById("teamSelect").addEventListener("change", () => {
    const v = document.getElementById("teamSelect").value;
    localStorage.setItem("selectedTeamId", v || "");
    window.__selectedTeamId = v || "";
    document.getElementById("teamStatus").textContent = v ? "Valið." : "";
    window.dispatchEvent(new CustomEvent("team:changed", { detail: { teamId: v || "" } }));
  });
}

async function updateAuthStatus() {
  const session = await api.getSession();
  const user = session?.user;
  el("authStatus").textContent = user ? `Signed in: ${user.email}` : "Not signed in.";
}

async function loadTeams() {
  try {
    await updateAuthStatus();
    const session = await api.getSession();
    if (!session?.user) {
      // ekki loggaður inn -> engin teams
      el("teamSelect").innerHTML = `<option value="">— Veldu lið —</option>`;
      el("teamStatus").textContent = "";
      return;
    }

    const teams = await api.getTeams();
    const selected = localStorage.getItem("selectedTeamId") || (teams[0]?.id ?? "");
    el("teamSelect").innerHTML =
      `<option value="">— Veldu lið —</option>` +
      teams.map(t => `<option value="${t.id}">${t.name}</option>`).join("");

    el("teamSelect").value = selected || "";
    window.__selectedTeamId = selected || "";
    el("teamStatus").textContent = selected ? "Loaded." : "Engin lið (RLS?)";
    if (selected) {
      window.dispatchEvent(new CustomEvent("team:changed", { detail: { teamId: selected } }));
    }
  } catch (e) {
    console.error(e);
    el("teamStatus").textContent = "Teams error: " + (e?.message || e);
  }
}

// React to auth changes
supabase.auth.onAuthStateChange(async () => {
  await loadTeams();
});

const host = document.getElementById("supabaseHooks") || document.querySelector("main") || document.body;
ensureAuthUI()
loadTeams();

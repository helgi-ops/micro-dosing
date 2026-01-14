// assets/app-auth.js
import { api, supabase } from "./dataClient.js";

function el(id) { return document.getElementById(id); }

function resetTeamSelection() {
  try {
    localStorage.removeItem("selectedTeamId");
    localStorage.removeItem("selected_team_id");
  } catch (_) {}
  window.__selectedTeamId = "";
  window.currentTeamId = "";

  const authSel = el("authBoxTeamSelect");
  const topSel = document.getElementById("teamSelect");
  const placeholder = `<option value="">— Veldu lið —</option>`;
  if (authSel) {
    authSel.innerHTML = placeholder;
    authSel.value = "";
    el("authBoxTeamStatus") && (el("authBoxTeamStatus").textContent = "");
  }
  if (topSel) {
    topSel.innerHTML = placeholder;
    topSel.value = "";
  }
}

function ensureAuthUI(hostEl) {
  // Býr til lítið auth box ef það er ekki til
  const old = document.getElementById("authBox");
if (old) old.remove();

  const host =
    hostEl ||
    document.getElementById("rosterHooks");

  if (!host) return; // birta aðeins í Roster view

  const box = document.createElement("div");
  box.id = "authBox";
  box.style.cssText =
    "margin:12px 0; padding:12px; border:1px solid rgba(255,255,255,.12); border-radius:12px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;";

  box.innerHTML = `
    <input id="authBoxEmail" type="email" placeholder="email fyrir innskráningu"
      style="min-width:240px; padding:10px; border-radius:10px; border:1px solid rgba(255,255,255,.12); background:transparent; color:inherit;" />
    <button id="authBoxSignIn" style="padding:10px 14px; border-radius:10px;">Send login link</button>
    <button id="authBoxSignOut" style="padding:10px 14px; border-radius:10px;">Sign out</button>
    <span id="authBoxStatus" style="opacity:.85;"></span>

    <span style="margin-left:10px; opacity:.7;">Team:</span>
    <select id="authBoxTeamSelect"
      style="min-width:240px; padding:10px; border-radius:10px; border:1px solid rgba(255,255,255,.12); background:transparent; color:inherit;">
      <option value="">— Veldu lið —</option>
    </select>
    <span id="authBoxTeamStatus" style="opacity:.75;"></span>
  `;

  host.prepend(box);

  document.getElementById("authBoxSignIn").addEventListener("click", async () => {
    const email = document.getElementById("authBoxEmail").value.trim();
    if (!email) return (document.getElementById("authBoxStatus").textContent = "Sláðu inn email.");
    document.getElementById("authBoxStatus").textContent = "Sendi login link…";
    try {
      await api.signInWithEmail(email);
      document.getElementById("authBoxStatus").textContent = "Login link sent á email.";
    } catch (e) {
      console.error(e);
      document.getElementById("authBoxStatus").textContent = "Villa: " + (e?.message || e);
    }
  });

  document.getElementById("authBoxSignOut").addEventListener("click", async () => {
    document.getElementById("authBoxStatus").textContent = "Signing out…";
    try {
      await api.signOut();
      document.getElementById("authBoxStatus").textContent = "Signed out.";
      await loadTeams();
    } catch (e) {
      console.error(e);
      document.getElementById("authBoxStatus").textContent = "Villa: " + (e?.message || e);
    }
  });

  document.getElementById("authBoxTeamSelect").addEventListener("change", () => {
    const v = document.getElementById("authBoxTeamSelect").value;
    localStorage.setItem("selectedTeamId", v || "");
    localStorage.setItem("selected_team_id", v || "");
    window.__selectedTeamId = v || "";
    window.currentTeamId = v || "";
    document.getElementById("authBoxTeamStatus").textContent = v ? "Valið." : "";
    window.dispatchEvent(new CustomEvent("team:changed", { detail: { teamId: v || "" } }));
    window.dispatchEvent(new Event("team:changed"));
    const topSel = document.getElementById("teamSelect");
    if (topSel) topSel.value = v || "";
  });

  // Sync from topbar select into auth box
  const topSel = document.getElementById("teamSelect");
  if (topSel && !topSel.dataset.bound) {
    topSel.dataset.bound = "1";
    topSel.addEventListener("change", () => {
      const v = topSel.value || "";
      const authSel = document.getElementById("authBoxTeamSelect");
      if (authSel) {
        authSel.value = v;
        authSel.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  }
}

// Handle magic link landing (#access_token=...) before loading teams
async function settleAuthFromUrl() {
  if (location.hash && location.hash.includes("access_token=")) {
    await new Promise(r => setTimeout(r, 80));
    try { await supabase.auth.getSession(); } catch (_) {}
    history.replaceState({}, document.title, location.pathname + location.search);
  }
}

async function updateAuthStatus() {
  const session = await api.getSession();
  const user = session?.user;
  el("authBoxStatus").textContent = user ? `Signed in: ${user.email}` : "Not signed in.";
  if (!user) resetTeamSelection();
}

async function loadTeams() {
  try {
    await updateAuthStatus();
    const session = await api.getSession();
    if (!session?.user) {
      resetTeamSelection();
      return;
    }

    if (el("authBoxTeamStatus")) el("authBoxTeamStatus").textContent = "Hleð liðum…";

    let teams = await api.getTeams();
    // If no teams returned but we have a preferred id, expose it as placeholder
    const preferredId = "b0748c6f-0b22-4043-8078-8dfd5f13a053";
    const hasPreferred = teams.some(t => t.id === preferredId);
    if (!teams.length && preferredId) {
      teams = [{ id: preferredId, name: "Lið" }];
    }
    const stored = localStorage.getItem("selectedTeamId") || "";
    const hasStored = teams.some(t => t.id === stored);

    let selected = "";
    if (hasPreferred) selected = preferredId;
    else if (hasStored) selected = stored;
    else if (teams.length) selected = teams[0].id;
    el("authBoxTeamSelect").innerHTML =
      `<option value="">— Veldu lið —</option>` +
      teams.map(t => `<option value="${t.id}">${t.name}</option>`).join("");

    el("authBoxTeamSelect").value = selected || "";
    window.__selectedTeamId = selected || "";
    window.currentTeamId = selected || "";
    if (el("authBoxTeamStatus")) {
      el("authBoxTeamStatus").textContent = teams.length ? "Lið hlaðin." : "Engin lið (RLS?)";
    }
    const topSel = document.getElementById("teamSelect");
    if (topSel) {
      topSel.innerHTML = el("authBoxTeamSelect").innerHTML;
      topSel.value = el("authBoxTeamSelect").value;
    }
    // Persist selection if chosen/auto-chosen
    try {
      localStorage.setItem("selectedTeamId", selected || "");
      localStorage.setItem("selected_team_id", selected || "");
    } catch (_) {}
    // Always broadcast (empty allowed)
    window.dispatchEvent(new CustomEvent("team:changed", { detail: { teamId: selected || "" } }));
  } catch (e) {
    const msg = String(e?.message || e);
    if (msg.includes("aborted") || msg.includes("AbortError")) {
      setTimeout(loadTeamsSafely, 120);
      return;
    }
    console.error("Teams load failed:", e);
    el("authBoxTeamStatus").textContent = "Teams error: " + msg;
  }
}

let teamsLoadInFlight = null;
async function loadTeamsSafely() {
  if (teamsLoadInFlight) return teamsLoadInFlight;

  teamsLoadInFlight = (async () => {
    try {
      await loadTeams();
    } finally {
      teamsLoadInFlight = null;
    }
  })();

  return teamsLoadInFlight;
}

// React to auth changes
supabase.auth.onAuthStateChange(async (_event, session) => {
  await loadTeamsSafely();
});

const host = document.getElementById("rosterHooks");
ensureAuthUI(host);
document.addEventListener("DOMContentLoaded", () => {
  settleAuthFromUrl().then(loadTeamsSafely);
  // Safety retry after short delay in case session arrives late
  setTimeout(loadTeamsSafely, 200);
});

// Expose helper so other modules (roster-supabase) can remount after DOM changes
window.renderAuthBox = function(target){
  ensureAuthUI(target);
  settleAuthFromUrl().then(loadTeamsSafely);
};

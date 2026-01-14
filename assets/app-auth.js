// assets/app-auth.js
import { api, supabase } from "./dataClient.js";

function el(id) { return document.getElementById(id); }

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
    const topSel = document.getElementById("teamSelectTopbar");
    if (topSel) topSel.value = v || "";
  });

  // Sync from topbar select into auth box
  const topSel = document.getElementById("teamSelectTopbar");
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

async function updateAuthStatus() {
  const session = await api.getSession();
  const user = session?.user;
  el("authBoxStatus").textContent = user ? `Signed in: ${user.email}` : "Not signed in.";
}

async function loadTeams() {
  try {
    await updateAuthStatus();
    const session = await api.getSession();
    if (!session?.user) {
      // ekki loggaður inn -> engin teams
      el("authBoxTeamSelect").innerHTML = `<option value="">— Veldu lið —</option>`;
      el("authBoxTeamStatus").textContent = "";
      return;
    }

    const teams = await api.getTeams();
    const selected = localStorage.getItem("selectedTeamId") || (teams[0]?.id ?? "");
    el("authBoxTeamSelect").innerHTML =
      `<option value="">— Veldu lið —</option>` +
      teams.map(t => `<option value="${t.id}">${t.name}</option>`).join("");

    el("authBoxTeamSelect").value = selected || "";
    window.__selectedTeamId = selected || "";
    el("authBoxTeamStatus").textContent = selected ? "Loaded." : "Engin lið (RLS?)";
    const topSel = document.getElementById("teamSelectTopbar");
    if (topSel) {
      topSel.innerHTML = el("authBoxTeamSelect").innerHTML;
      topSel.value = el("authBoxTeamSelect").value;
    }
    if (selected) {
      window.dispatchEvent(new CustomEvent("team:changed", { detail: { teamId: selected } }));
    }
  } catch (e) {
    const msg = String(e?.message || e);
    if (msg.includes("aborted") || msg.includes("AbortError")) return;
    console.error("Teams load failed:", e);
    el("authBoxTeamStatus").textContent = "Teams error: " + msg;
  }
}

let teamsLoadInFlight = null;
async function loadTeamsSafely() {
  if (teamsLoadInFlight) return teamsLoadInFlight;

  teamsLoadInFlight = (async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await loadTeams();
    } finally {
      teamsLoadInFlight = null;
    }
  })();

  return teamsLoadInFlight;
}

// React to auth changes
supabase.auth.onAuthStateChange(async (_event, session) => {
  if (!session) return;
  await loadTeamsSafely();
});

const host = document.getElementById("rosterHooks");
ensureAuthUI(host);
if (host) loadTeamsSafely();

// Expose helper so other modules (roster-supabase) can remount after DOM changes
window.renderAuthBox = function(target){
  ensureAuthUI(target);
  loadTeamsSafely();
};

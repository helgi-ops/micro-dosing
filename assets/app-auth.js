// assets/app-auth.js
import { api, supabase, waitForAuthReady, getCachedSession, listMyTeams } from "./dataClient.js";

function el(id) { return document.getElementById(id); }

function setActiveTeam(teamId) {
  window.__selectedTeamId = teamId || "";
  window.currentTeamId = teamId || "";
  try {
    localStorage.setItem("selectedTeamId", teamId || "");
    localStorage.setItem("selected_team_id", teamId || "");
  } catch (_) {}
  const topSel = document.getElementById("teamSelectTopbar");
  if (topSel) topSel.value = teamId || "";
  window.dispatchEvent(new CustomEvent("team:changed", { detail: { teamId: teamId || "" } }));
  window.dispatchEvent(new Event("team:changed"));
}

async function ensureSessionOrRedirect() {
  await waitForAuthReady?.();
  const session = getCachedSession?.() || (await supabase.auth.getSession()).data?.session;
  if (!session) {
    window.location.href = "./index.html";
    return null;
  }
  return session;
}

async function loadTeams() {
  const session = await ensureSessionOrRedirect();
  if (!session) return;

  const topSel = document.getElementById("teamSelectTopbar");
  if (!topSel) return;

  const placeholder = `<option value="">— Veldu lið —</option>`;
  topSel.innerHTML = placeholder;

  let teams = [];
  try {
    teams = await listMyTeams();
    console.log("[team] user", session.user.id);
    console.log("[team] memberships", teams);
  } catch (e) {
    console.error("Teams load failed:", e);
  }

  const opts = teams.map(t => `<option value="${t.team_id || t.id}">${t.team?.name || t.name || t.team_id}</option>`).join("");
  topSel.innerHTML = placeholder + opts;

  let selected = "";
  if (teams.length === 1) {
    selected = teams[0].team_id || teams[0].id;
  } else {
    const stored = localStorage.getItem("selectedTeamId") || "";
    if (stored && teams.some(t => (t.team_id || t.id) === stored)) selected = stored;
  }

  if (selected) {
    topSel.value = selected;
    setActiveTeam(selected);
  } else {
    setActiveTeam("");
    const statusLine = document.getElementById("teamStatusLine");
    if (statusLine) statusLine.textContent = "Lið: No team access";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const topSel = document.getElementById("teamSelectTopbar");
  if (topSel && !topSel.dataset.bound) {
    topSel.dataset.bound = "1";
    topSel.addEventListener("change", () => {
      setActiveTeam(topSel.value || "");
    });
  }
  loadTeams();
});

supabase.auth.onAuthStateChange(async (_event, session) => {
  if (!session) {
    window.location.href = "./index.html";
    return;
  }
  await loadTeams();
});

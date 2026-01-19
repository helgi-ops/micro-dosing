// assets/app-auth.js
import { api, supabase, waitForAuthReady, getCachedSession, listMyTeams } from "./dataClient.js";

function el(id) { return document.getElementById(id); }

function setActiveTeam(teamId, label) {
  window.__selectedTeamId = teamId || "";
  window.currentTeamId = teamId || "";
  try {
    localStorage.setItem("selectedTeamId", teamId || "");
    localStorage.setItem("selected_team_id", teamId || "");
    localStorage.setItem("active_team_id", teamId || "");
  } catch (_) {}
  const topSel = document.getElementById("teamSelectTopbar");
  if (topSel) topSel.value = teamId || "";
  const teamLine = document.getElementById("teamStatusLine");
  if (teamLine) teamLine.textContent = teamId ? `Lið: ${label || teamId}` : "Lið: —";
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

let __loadingTeams = false;

async function loadTeams() {
  if (__loadingTeams) return;
  __loadingTeams = true;

  try {
    const session = await ensureSessionOrRedirect();
    if (!session) return;

    const topSel = document.getElementById("teamSelectTopbar");
    const statusLine = document.getElementById("teamStatusLine");

    let teams;
    try {
      teams = await listMyTeams();
      console.log("[team] user", session.user.id);
      console.log("[team] memberships", teams);
    } catch (e) {
      // ✅ Ekki tæma active team á transient error
      console.error("Teams load failed (keeping current team):", e);
      if (statusLine) statusLine.textContent = "Lið: —";
      return;
    }

    // Ef þetta er raunverulega tómt => enginn aðgangur
    if (!Array.isArray(teams) || teams.length === 0) {
      if (topSel) topSel.innerHTML = `<option value="">— Veldu lið —</option>`;
      setActiveTeam("");
      if (statusLine) statusLine.textContent = "Lið: No team access";
      return;
    }

    // Build dropdown
    const placeholder = `<option value="">— Veldu lið —</option>`;
    if (topSel) {
      const opts = teams
        .map(t => {
          const id = t.team_id || t.id;
          const name = t.team?.name || t.name || t.team_id || id;
          return `<option value="${id}">${name}</option>`;
        })
        .join("");
      topSel.innerHTML = placeholder + opts;
    }

    // ✅ Always select a valid team: stored if valid, else FIRST
    const stored =
      localStorage.getItem("active_team_id") ||
      localStorage.getItem("selectedTeamId") ||
      localStorage.getItem("selected_team_id") ||
      "";

    let selected = "";
    if (stored && teams.some(t => (t.team_id || t.id) === stored)) {
      selected = stored;
    } else {
      selected = teams[0].team_id || teams[0].id; // <-- mikilvægasta línan
    }

    if (topSel) topSel.value = selected;

    const active = teams.find(t => (t.team_id || t.id) === selected) || {};
    const label = active.team?.name || active.name || active.team_id || selected;

    setActiveTeam(selected, label);
  } finally {
    __loadingTeams = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const topSel = document.getElementById("teamSelectTopbar");
  if (topSel && !topSel.dataset.bound) {
    topSel.dataset.bound = "1";
    topSel.addEventListener("change", () => {
      const val = topSel.value || "";
      const label = topSel.selectedOptions?.[0]?.textContent || val;
      setActiveTeam(val, label);
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

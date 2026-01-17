// assets/app-auth.js
import { api, supabase, waitForAuthReady, getCachedSession } from "./dataClient.js";

function el(id) { return document.getElementById(id); }

async function fetchTeamsForUser(session) {
  const { data, error } = await supabase
    .from("team_members")
    .select("team_id, role, teams(id,name)")
    .eq("user_id", session.user.id)
    .in("role", ["coach", "admin"]);
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.teams?.id || row.team_id,
    name: row.teams?.name || row.team_id
  })).filter(t => t.id);
}

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
    teams = await fetchTeamsForUser(session);
  } catch (e) {
    console.error("Teams load failed:", e);
  }

  const opts = teams.map(t => `<option value="${t.id}">${t.name}</option>`).join("");
  topSel.innerHTML = placeholder + opts;

  let selected = "";
  if (teams.length === 1) {
    selected = teams[0].id;
  } else {
    const stored = localStorage.getItem("selectedTeamId") || "";
    if (stored && teams.some(t => t.id === stored)) selected = stored;
  }

  if (selected) {
    topSel.value = selected;
    setActiveTeam(selected);
  } else {
    setActiveTeam("");
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

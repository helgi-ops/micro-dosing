// assets/roster-supabase.js
import { api, supabase } from "./dataClient.js";

const IDS = {
  hook: "rosterHooks",      // UI á að fara hingað (Roster view)
  status: "rosterStatus",
  list: "rosterPlayerList",
  first: "addPlayerFirst",
  last: "addPlayerLast",
  pos: "addPlayerPos",
  btn: "btnAddPlayer",
};

function byId(id) { return document.getElementById(id); }

function getTeamId() {
  return window.__selectedTeamId || localStorage.getItem("selectedTeamId") || "";
}

async function isSignedIn() {
  const { data } = await supabase.auth.getSession();
  return !!data?.session?.user;
}

function ensureRosterUI() {
  const host = byId(IDS.hook);
  if (!host) return; // ef rosterHooks er ekki til, þá gerum ekkert (þetta er viljandi)

  // Clear + rebuild (þannig þetta virkar alltaf eftir route/view skipti)
  host.innerHTML = `
    <div id="${IDS.status}" style="margin:10px 0; opacity:.85;"></div>

    <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin:12px 0;">
      <input id="${IDS.first}" placeholder="Fornafn"
        style="padding:10px; border-radius:10px; border:1px solid rgba(255,255,255,.12); background:transparent; color:inherit; min-width:180px;" />
      <input id="${IDS.last}" placeholder="Eftirnafn"
        style="padding:10px; border-radius:10px; border:1px solid rgba(255,255,255,.12); background:transparent; color:inherit; min-width:180px;" />
      <input id="${IDS.pos}" placeholder="Staða (val)"
        style="padding:10px; border-radius:10px; border:1px solid rgba(255,255,255,.12); background:transparent; color:inherit; min-width:160px;" />
      <button id="${IDS.btn}" style="padding:10px 14px; border-radius:10px;">Bæta við leikmanni</button>
    </div>

    <div id="${IDS.list}" style="display:grid; gap:8px;"></div>
  `;
}

function renderPlayers(players) {
  const list = byId(IDS.list);
  if (!list) return;

  if (!players.length) {
    list.innerHTML = `<div style="opacity:.75;">Engir leikmenn í þessu liði enn.</div>`;
    return;
  }

  list.innerHTML = players.map(p => {
    const name = `${p.first_name} ${p.last_name}`.trim();
    const pos = p.position ? ` • ${p.position}` : "";
    return `
      <div style="padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,.10);">
        <div style="font-weight:600;">${name}</div>
        <div style="opacity:.75; font-size:.9rem;">${pos || "&nbsp;"}</div>
      </div>
    `;
  }).join("");
}

async function loadPlayers(teamId) {
  const status = byId(IDS.status);
  if (!status) return;

  // þarf login (RLS)
  if (!(await isSignedIn())) {
    status.textContent = "Skráðu þig inn til að sjá lið og leikmenn.";
    renderPlayers([]);
    return;
  }

  if (!teamId) {
    status.textContent = "Veldu lið (efst) til að hlaða leikmenn.";
    renderPlayers([]);
    return;
  }

  try {
    status.textContent = "Hleð leikmenn…";
    const players = await api.getPlayers(teamId);
    status.textContent = `Leikmenn: ${players.length}`;
    renderPlayers(players);
  } catch (e) {
    console.error(e);
    status.textContent = "Villa við að hlaða leikmenn: " + (e?.message || e);
    renderPlayers([]);
  }
}

async function addPlayer(teamId) {
  const status = byId(IDS.status);
  if (!status) return;

  if (!(await isSignedIn())) return (status.textContent = "Þú þarft að vera skráður inn.");

  if (!teamId) return (status.textContent = "Veldu lið (efst) fyrst.");

  const first = (byId(IDS.first)?.value || "").trim();
  const last  = (byId(IDS.last)?.value || "").trim();
  const pos   = (byId(IDS.pos)?.value || "").trim();

  if (!first || !last) return (status.textContent = "Vantar fornafn og eftirnafn.");

  try {
    status.textContent = "Bæti við leikmanni…";
    await api.createPlayer(teamId, { first_name: first, last_name: last, position: pos });

    byId(IDS.first).value = "";
    byId(IDS.last).value = "";
    byId(IDS.pos).value = "";

    await loadPlayers(teamId);
    status.textContent = "Leikmaður bættur við ✅";
  } catch (e) {
    console.error(e);
    status.textContent = "Villa við að bæta við leikmanni: " + (e?.message || e);
  }
}

function wire() {
  ensureRosterUI();

  // ef rosterHooks er ekki til, hættum (UI á bara að vera í Roster view)
  if (!byId(IDS.hook)) return;

  // initial load
  loadPlayers(getTeamId());

  // þegar team breytist (frá app-auth.js)
  window.addEventListener("team:changed", (ev) => {
    const teamId = ev?.detail?.teamId || getTeamId();
    loadPlayers(teamId);
  });

  // add player
  byId(IDS.btn)?.addEventListener("click", () => addPlayer(getTeamId()));

  // auth changes -> reload
  supabase.auth.onAuthStateChange(() => loadPlayers(getTeamId()));
}

wire();

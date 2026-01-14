// assets/roster-supabase.js
import { api, supabase } from "./dataClient.js";

const IDS = {
  hook: "rosterHooks",      // UI á að fara hingað (Roster view)
  status: "rosterStatus",
  list: "rosterPlayerList",
  first: "playerFirstName",
  last: "playerLastName",
  pos: "playerPosition",
  btn: "addPlayerBtn",
  authHint: "authRequiredHint"
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
    <section class="roster-add-player">
      <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin:0 0 10px;">
        <input id="${IDS.first}" placeholder="Fornafn"
          style="padding:10px; border-radius:10px; border:1px solid rgba(255,255,255,.12); background:transparent; color:inherit; min-width:160px;" />
        <input id="${IDS.last}" placeholder="Eftirnafn"
          style="padding:10px; border-radius:10px; border:1px solid rgba(255,255,255,.12); background:transparent; color:inherit; min-width:160px;" />
        <input id="${IDS.pos}" placeholder="Staða (val)"
          style="padding:10px; border-radius:10px; border:1px solid rgba(255,255,255,.12); background:transparent; color:inherit; min-width:140px;" />
        <button id="${IDS.btn}" style="padding:10px 14px; border-radius:10px;">Bæta við leikmanni</button>
      </div>
      <p id="${IDS.authHint}" class="hint auth-required" style="display:block;">Skráðu þig inn og veldu lið til að vista leikmenn.</p>
    </section>

    <section class="roster-auth">
      <div id="authBoxMount"></div>
    </section>

    <div id="${IDS.status}" style="margin:10px 0; opacity:.85;"></div>
    <div id="${IDS.list}" style="display:grid; gap:8px;"></div>
  `;

  // Render auth UI inside roster panel if helper is exposed
  if (window.renderAuthBox) {
    window.renderAuthBox(host.querySelector('.roster-auth') || host);
  }
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
      <div class="roster-player" data-player-id="${p.id}" style="padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,.10); cursor:pointer;">
        <div style="font-weight:600;">${name}</div>
        <div style="opacity:.75; font-size:.9rem;">${pos || "&nbsp;"}</div>
      </div>
    `;
  }).join("");

  // Bind click to show athlete detail
  list.querySelectorAll('.roster-player').forEach(row => {
    row.addEventListener('click', () => {
      const pid = row.getAttribute('data-player-id');
      if (window.showAthleteDetail) window.showAthleteDetail(pid);
    });
  });
}

async function loadPlayers(teamId) {
  const status = byId(IDS.status);
  if (!status) return;

  // þarf login (RLS)
  const signedIn = await isSignedIn();
  if (!signedIn) {
    status.textContent = "Skráðu þig inn til að sjá lið og leikmenn.";
    renderPlayers([]);
    updateAddState(signedIn, teamId);
    return;
  }

  if (!teamId) {
    status.textContent = "Veldu lið (efst) til að hlaða leikmenn.";
    renderPlayers([]);
    updateAddState(signedIn, teamId);
    return;
  }

  try {
    status.textContent = "Hleð leikmenn…";
    const players = await api.getPlayers(teamId);
    status.textContent = `Leikmenn: ${players.length}`;
    renderPlayers(players);
    updateAddState(signedIn, teamId);
  } catch (e) {
    const msg = String(e?.message || e);
    if (msg.includes("aborted") || msg.includes("AbortError")) return;
    console.error(e);
    status.textContent = "Villa við að hlaða leikmenn: " + msg;
    renderPlayers([]);
    updateAddState(signedIn, teamId);
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

async function updateAddState(isAuthed, teamId){
  const btn = byId(IDS.btn);
  const hint = byId(IDS.authHint);
  const disabled = !isAuthed || !teamId;
  if (btn) btn.disabled = disabled;
  if (hint) hint.style.display = disabled ? "block" : "none";
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

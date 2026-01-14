// assets/roster-supabase.js
import { api, supabase } from "./dataClient.js";

const IDS = {
  hook: "rosterHooks",      // UI á að fara hingað (Roster view)
  status: "rosterStatus",
  list: "rosterPlayerList",
  name: "playerName",
  pos: "playerPosition",
  btn: "rosterAddPlayerBtn",
  authHint: "authRequiredHint"
};

function byId(id) { return document.getElementById(id); }

function getTeamId() {
  return (
    window.__selectedTeamId ||
    localStorage.getItem("selectedTeamId") ||
    localStorage.getItem("selected_team_id") ||
    ""
  );
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
        <input id="${IDS.name}" placeholder="Nafn leikmanns"
          style="padding:10px; border-radius:10px; border:1px solid rgba(255,255,255,.12); background:transparent; color:inherit; min-width:200px;" />
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
      <div class="roster-player" data-player-id="${p.id}" style="padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,.10); cursor:pointer; display:flex; justify-content:space-between; align-items:center; gap:8px;">
        <div>
          <div style="font-weight:600;">${name}</div>
          <div style="opacity:.75; font-size:.9rem;">${pos || "&nbsp;"}</div>
        </div>
        <button type="button" class="ghost-btn small-btn roster-delete" data-player-id="${p.id}">✕</button>
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

  // Delete buttons
  list.querySelectorAll('.roster-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const pid = btn.getAttribute('data-player-id');
      if (!pid) return;
      await deletePlayerSafe(getTeamId(), pid);
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
    window.dispatchEvent(new CustomEvent('players:updated', { detail: { teamId, players } }));
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

  const name = (byId(IDS.name)?.value || "").trim();
  const pos   = (byId(IDS.pos)?.value || "").trim();

  if (!name) return (status.textContent = "Vantar nafn leikmanns.");

  // split name into first/last (simple)
  const parts = name.split(/\s+/);
  const first = parts.shift() || name;
  const last = parts.join(" ");

  try {
    status.textContent = "Bæti við leikmanni…";
    await api.createPlayer(teamId, first, last, pos);

    byId(IDS.name).value = "";
    byId(IDS.pos).value = "";

    await loadPlayers(teamId);
    status.textContent = "Leikmaður bættur við ✅";
  } catch (e) {
    console.error(e);
    status.textContent = "Villa við að bæta við leikmanni: " + (e?.message || e);
  }
}

async function deletePlayerSafe(teamId, playerId){
  const status = byId(IDS.status);
  if (!status) return;
  if (!(await isSignedIn())) return (status.textContent = "Þarft að vera innskráður.");
  if (!teamId || !playerId) return;
  try{
    await api.deletePlayer(teamId, playerId);
    status.textContent = "Leikmaður eyddur.";
    await loadPlayers(teamId);
  } catch(e){
    const msg = String(e?.message || e);
    if (msg.includes("aborted") || msg.includes("AbortError")) return;
    console.error(e);
    status.textContent = "Gat ekki eytt leikmanni: " + msg;
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

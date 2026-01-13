// assets/roster-supabase.js
import { api } from "./dataClient.js";

const UI = {
  statusId: "rosterStatus",
  playerSelectIds: ["playerSelect", "athleteSelect", "athleteName"], // prófum í þessari röð
};

function byId(id){ return document.getElementById(id); }

function findPlayerSelect(){
  for (const id of UI.playerSelectIds){
    const el = byId(id);
    if (el && el.tagName === "SELECT") return el;
  }
  return null;
}

function ensureStatusEl(){
  let el = byId(UI.statusId);
  if (el) return el;
  const host = document.querySelector("#roster") || document.querySelector("main") || document.body;
  el = document.createElement("div");
  el.id = UI.statusId;
  el.style.cssText = "margin:10px 0; opacity:.85;";
  host.prepend(el);
  return el;
}

function ensureAddPlayerUI(){
  // ef til nú þegar, sleppum
  if (byId("btnAddPlayer")) return;

  const host = document.querySelector("#roster") || document.querySelector("main") || document.body;
  const row = document.createElement("div");
  row.style.cssText = "display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin:12px 0;";

  row.innerHTML = `
    <input id="addPlayerFirst" placeholder="Fornafn" style="padding:10px; border-radius:10px; border:1px solid rgba(255,255,255,.12); background:transparent; color:inherit; min-width:180px;" />
    <input id="addPlayerLast"  placeholder="Eftirnafn" style="padding:10px; border-radius:10px; border:1px solid rgba(255,255,255,.12); background:transparent; color:inherit; min-width:180px;" />
    <input id="addPlayerPos"   placeholder="Staða (val)" style="padding:10px; border-radius:10px; border:1px solid rgba(255,255,255,.12); background:transparent; color:inherit; min-width:160px;" />
    <button id="btnAddPlayer" style="padding:10px 14px; border-radius:10px;">Bæta við leikmanni</button>
  `;
  host.prepend(row);
}

function getTeamId(){
  return window.__selectedTeamId || localStorage.getItem("selectedTeamId") || "";
}

async function loadPlayers(teamId){
  const status = ensureStatusEl();
  const sel = findPlayerSelect();

  if (!teamId){
    status.textContent = "Veldu lið til að hlaða leikmenn.";
    if (sel) sel.innerHTML = `<option value="">— Veldu leikmann —</option>`;
    return;
  }

  try{
    status.textContent = "Hleð leikmenn…";
    const players = await api.getPlayers(teamId);

    if (sel){
      sel.innerHTML =
        `<option value="">— Veldu leikmann —</option>` +
        players.map(p => {
          const name = `${p.first_name} ${p.last_name}`.trim();
          return `<option value="${p.id}">${name}${p.position ? " — " + p.position : ""}</option>`;
        }).join("");
    }

    status.textContent = players.length ? `Leikmenn: ${players.length}` : "Engir leikmenn í liðinu enn.";
  } catch(e){
    console.error(e);
    status.textContent = "Villa við að hlaða leikmenn: " + (e?.message || e);
  }
}

async function addPlayer(){
  const status = ensureStatusEl();
  const teamId = getTeamId();
  if (!teamId) return (status.textContent = "Veldu lið fyrst.");

  const first = (byId("addPlayerFirst")?.value || "").trim();
  const last  = (byId("addPlayerLast")?.value || "").trim();
  const pos   = (byId("addPlayerPos")?.value || "").trim();

  if (!first || !last) return (status.textContent = "Vantar fornafn og eftirnafn.");

  try{
    status.textContent = "Bæti við leikmanni…";
    await api.createPlayer(teamId, { first_name: first, last_name: last, position: pos });

    byId("addPlayerFirst").value = "";
    byId("addPlayerLast").value = "";
    byId("addPlayerPos").value = "";

    await loadPlayers(teamId);
    status.textContent = "Leikmaður bættur við ✅";
  } catch(e){
    console.error(e);
    status.textContent = "Villa við að bæta við leikmanni: " + (e?.message || e);
  }
}

function wire(){
  ensureStatusEl();
  ensureAddPlayerUI();

  // load initial
  loadPlayers(getTeamId());

  // on team change
  window.addEventListener("team:changed", (ev) => {
    const teamId = ev?.detail?.teamId || getTeamId();
    loadPlayers(teamId);
  });

  // add player click
  byId("btnAddPlayer")?.addEventListener("click", addPlayer);
}

wire();

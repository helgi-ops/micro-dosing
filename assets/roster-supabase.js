// assets/roster-supabase.js
import { api, supabase, getCachedSession, isAuthReady, SUPABASE_URL_PUBLIC, SUPABASE_ANON_PUBLIC, ensurePlayerToken, buildPlayerLink } from "./dataClient.js";

// DEBUG proof-of-life
window.__ROSTER_SUPABASE_LOADED_AT = new Date().toISOString();
console.log("[roster-supabase] loaded", window.__ROSTER_SUPABASE_LOADED_AT);

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
  // Prefer an explicit team in the URL (coach.html?team=<uuid>)
  const urlTeam = new URLSearchParams(location.search).get("team");
  if (urlTeam && /^[0-9a-fA-F-]{36}$/.test(urlTeam)) {
    // keep all common caches in sync so other modules see the same team
    window.__selectedTeamId = urlTeam;
    try {
      localStorage.setItem("active_team_id", urlTeam);
      localStorage.setItem("selectedTeamId", urlTeam);
      localStorage.setItem("selected_team_id", urlTeam);
    } catch {}
    return urlTeam;
  }

  return (
    window.__selectedTeamId ||
    localStorage.getItem("active_team_id") ||
    localStorage.getItem("selectedTeamId") ||
    localStorage.getItem("selected_team_id") ||
    ""
  );
}

let currentTeamId = getTeamId();
let __rosterUnsubAuth = null;
let __rosterWired = false;

function fmtDT(x) {
  try {
    if (!x) return '';
    return new Date(x).toLocaleString();
  } catch {
    return String(x || '');
  }
}

function getInviteStatus(p) {
  if (p?.auth_user_id) {
    return {
      key: 'accepted',
      label: 'Accepted',
      title: `Accepted: ${fmtDT(p.invite_accepted_at) || '—'}`
    };
  }
  if (p?.invite_email) {
    return {
      key: 'invited',
      label: 'Invited',
      title: `Invited: ${p.invite_email}\nSent: ${fmtDT(p.invite_sent_at) || '—'}`
    };
  }
  return {
    key: 'none',
    label: 'Not invited',
    title: 'No invite sent'
  };
}

function isSignedInSync() {
  const s = getCachedSession();
  return !!s?.user;
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
      <!-- auth UI removed; login handled via login.html -->
    </section>

    <div id="${IDS.status}" style="margin:10px 0; opacity:.85;"></div>
    <div id="${IDS.list}" style="display:grid; gap:8px;"></div>
  `;

  // Render auth UI inside roster panel if helper is exposed
  if (window.renderAuthBox) {
    const mount = host.querySelector('#authBoxMount') || host;
    window.renderAuthBox(mount);
  }
}

function renderPlayers(players) {
  const list = byId(IDS.list);
  if (!list) return;

  list.innerHTML = "";

  if (!players.length) {
    list.innerHTML = `<div style="opacity:.75;">Engir leikmenn í þessu liði enn.</div>`;
    return;
  }

  players.forEach(p => {
    const s = getInviteStatus(p);
    const accepted = s.key === 'accepted';
    const inviteEmailValue = p.invite_email || '';
    const btnLabel = accepted ? 'Accepted' : (s.key === 'invited' ? 'Resend' : 'Send invite');
    const row = document.createElement('div');
    row.className = "roster-player";
    row.dataset.playerId = p.id;

    row.innerHTML = `
      <div class="player-row">
        <div class="player-main">
          <div class="player-name">${p.first_name} ${p.last_name}</div>
          <div class="player-meta">${p.position ?? ''}</div>
        </div>

        <div class="invite-actions">
          <span class="invite-pill invite-${s.key}" title="${(s.title || '').replace(/"/g, '&quot;')}">
            ${s.label}
          </span>

          <input class="invite-input"
                 type="email"
                 placeholder="Invite email"
                 value="${inviteEmailValue}"
                 data-invite-email="${p.id}"
                 ${accepted ? 'disabled' : ''} />

          <button class="btn"
                  data-invite-send="${p.id}"
                  ${accepted ? 'disabled' : ''}>
            ${btnLabel}
          </button>
        </div>
      </div>
    `;

    const actions = row.querySelector('.invite-actions');
    if (actions) {
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'ghost-btn small-btn roster-delete';
      delBtn.dataset.playerId = p.id;
      delBtn.textContent = '✕';
      actions.appendChild(delBtn);
      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await deletePlayerSafe(currentTeamId || getTeamId(), p.id);
      });
      // Copy player link button
      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'ghost-btn small-btn roster-copy';
      copyBtn.dataset.playerId = p.id;
      copyBtn.textContent = 'Copy link';
      actions.appendChild(copyBtn);
      copyBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          copyBtn.disabled = true;
          const token = await ensurePlayerToken(p.id, 90);
          const url = buildPlayerLink(token);
          await navigator.clipboard.writeText(url);
          const old = copyBtn.textContent;
          copyBtn.textContent = "Copied!";
          setTimeout(() => { copyBtn.textContent = old; }, 1200);
        } catch (err) {
          alert(err?.message || String(err));
        } finally {
          copyBtn.disabled = false;
        }
      });
    }

    const main = row.querySelector('.player-main');
    main?.addEventListener('click', () => {
      // Navigate to player page; if custom detail exists, prefer that
      if (window.showAthleteDetail) {
        window.showAthleteDetail(p.id);
        return;
      }
      window.location.href = `./player.html?id=${encodeURIComponent(p.id)}`;
    });

    const inviteBtn = row.querySelector(`button[data-invite-send="${p.id}"]`);
    if (inviteBtn && !inviteBtn.disabled) {
      inviteBtn.addEventListener('click', async () => {
        const input = row.querySelector(`input[data-invite-email="${p.id}"]`);
        const email = (input?.value || '').trim();
        if (!email) return alert('Settu inn email');
        const teamId = currentTeamId || getTeamId();
        if (!teamId) return alert('Veldu lið fyrst (team_id vantar).');

        inviteBtn.disabled = true;
        const oldText = inviteBtn.textContent;
        inviteBtn.textContent = 'Sending...';

        try {
          const { data: sessData } = await supabase.auth.getSession();
          const accessToken = sessData?.session?.access_token;
          if (!accessToken) throw new Error("Not signed in");

          const resp = await fetch(`${SUPABASE_URL_PUBLIC}/functions/v1/send-invite`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": SUPABASE_ANON_PUBLIC,
              "Authorization": `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              email,
              player_id: p.id,
              team_id: teamId
            })
          });

          const text = await resp.text();
          let data = null;
          try { data = text ? JSON.parse(text) : null; } catch (_) {}

          if (!resp.ok || (data && data.ok === false)) {
            const msg = data?.error || text || `Invite failed (HTTP ${resp.status})`;
            throw new Error(msg);
          }

        // IMPORTANT: reload roster so status updates immediately
        await loadPlayersForTeam(currentTeamId);

      } catch (e) {
        inviteBtn.disabled = false;
        inviteBtn.textContent = oldText || 'Send invite';
        alert(e?.message || String(e));
      }
    });
  }

    list.appendChild(row);
  });
}

async function loadPlayersForTeam(teamId) {
  currentTeamId = teamId || getTeamId();
  return loadPlayers(currentTeamId);
}

async function loadPlayers(teamId) {
  const status = byId(IDS.status);
  if (!status) return;

  if (!isAuthReady()) {
    status.textContent = "Athuga innskráningu…";
    return;
  }

  // þarf login (RLS)
  const signedIn = isSignedInSync();
  if (!signedIn) {
    status.textContent = "Skráðu þig inn til að sjá lið og leikmenn. (session=null eða error)";
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

  if (!isSignedInSync()) return (status.textContent = "Þú þarft að vera skráður inn.");

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

    await loadPlayersForTeam(teamId);
    status.textContent = "Leikmaður bættur við ✅";
  } catch (e) {
    console.error(e);
    status.textContent = "Villa við að bæta við leikmanni: " + (e?.message || e);
  }
}

async function deletePlayerSafe(teamId, playerId){
  const status = byId(IDS.status);
  if (!status) return;
  if (!isSignedInSync()) return (status.textContent = "Þarft að vera innskráður.");
  if (!teamId || !playerId) return;
  if (!confirm("Eyða leikmanni?")) return;
  try{
    await api.deletePlayer(playerId);
    status.textContent = "Leikmaður eyddur.";
    await loadPlayersForTeam(teamId);
  } catch(e){
    const msg = String(e?.message || e);
    if (msg.includes("aborted") || msg.includes("AbortError")) return;
    console.error(e);
    status.textContent = "Gat ekki eytt leikmanni: " + msg;
    alert("Gat ekki eytt leikmanni: " + msg);
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

  // prevent double-wiring
  if (__rosterWired) return;
  __rosterWired = true;

  // initial load
  loadPlayersForTeam(getTeamId());

  // þegar team breytist (frá app-auth.js)
  window.addEventListener("team:changed", (ev) => {
    const teamId = ev?.detail?.teamId || getTeamId();
    loadPlayersForTeam(teamId);
  });

  // add player
  byId(IDS.btn)?.addEventListener("click", () => addPlayer(currentTeamId || getTeamId()));

  // auth changes -> reload (unsubscribe old first if any)
  try { __rosterUnsubAuth?.unsubscribe?.(); } catch {}
  const sub = supabase.auth.onAuthStateChange(() => loadPlayersForTeam(currentTeamId || getTeamId()));
  __rosterUnsubAuth = sub?.data?.subscription || sub;

  window.addEventListener('auth:ready', () => {
    loadPlayersForTeam(currentTeamId || getTeamId());
  });
}

wire();

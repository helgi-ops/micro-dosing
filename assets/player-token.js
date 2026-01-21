import { supabase } from "./dataClient.js";

function getToken() {
  return (new URLSearchParams(location.search).get("t") || "").trim();
}

async function loadPlayerByToken(token) {
  const res = await supabase
    .from("players")
    .select("id, first_name, last_name, team_id, token_expires_at")
    .eq("access_token", token)
    .maybeSingle();

  if (res.error) throw res.error;
  if (!res.data) throw new Error("Invalid link (player not found)");
  return res.data;
}

async function loadLatestWeekAssignment(playerId) {
  const res = await supabase
    .from("week_assignments")
    .select(`
      week_id,
      assigned_at,
      status,
      weeks (
        id,
        week_number,
        title,
        start_date,
        end_date
      )
    `)
    .eq("player_id", playerId)
    .order("assigned_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (res.error) throw res.error;
  return res.data;
}

function renderWeek(assignment) {
  const box = document.getElementById("weekBox");
  if (!box) return;

  if (!assignment?.weeks) {
    box.innerHTML = "<p>Engin vika úthlutuð enn.</p>";
    return;
  }

  const w = assignment.weeks;
  box.innerHTML = `
    <div style="padding:12px;border:1px solid rgba(255,255,255,.1);border-radius:12px;">
      <div><strong>Week ${w.week_number ?? ""}</strong></div>
      <div>${w.title ?? ""}</div>
      <div style="opacity:.8;">${w.start_date ?? ""} – ${w.end_date ?? ""}</div>
    </div>
  `;
}

(async () => {
  try {
    const token = getToken();
    if (!token) throw new Error("Missing token");

    const player = await loadPlayerByToken(token);
    const assignment = await loadLatestWeekAssignment(player.id);

    const nameEl = document.querySelector("#playerName");
    if (nameEl) nameEl.textContent = `${player.first_name ?? ""} ${player.last_name ?? ""}`.trim();
    const nameCard = document.querySelector("#playerNameCard");
    if (nameCard) nameCard.textContent = `${player.first_name ?? ""} ${player.last_name ?? ""}`.trim();

    renderWeek(assignment);
  } catch (err) {
    document.body.innerHTML = `
      <div style="max-width:640px;margin:40px auto;font-family:system-ui;padding:16px;">
        <h2>Link not valid</h2>
        <p>${(err?.message || String(err))}</p>
      </div>
    `;
  }
})();

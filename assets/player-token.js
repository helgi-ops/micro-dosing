import { supabase } from "./dataClient.js";

function getToken() {
  const p = new URLSearchParams(location.search);
  return (p.get("t") || "").trim();
}

function withTokenHeaders(token) {
  return {
    headers: {
      "x-player-token": token,
    },
  };
}

async function loadPlayerByToken(token) {
  const opts = withTokenHeaders(token);

  const playerRes = await supabase
    .from("players")
    .select("id, first_name, last_name, team_id, invite_status")
    .eq("access_token", token)
    .maybeSingle(opts);

  if (playerRes.error) throw playerRes.error;
  if (!playerRes.data) throw new Error("Invalid or expired link");

  return playerRes.data;
}

async function loadAssignedWeek(playerId, token) {
  const res = await supabase
    .from("week_assignments")
    .select(`
      week_id,
      assigned_at,
      weeks (
        id,
        week_number,
        start_date,
        end_date,
        title
      )
    `)
    .eq("player_id", playerId)
    .order("assigned_at", { ascending: false })
    .limit(1)
    .maybeSingle({
      headers: {
        "x-player-token": token
      }
    });

  if (res.error) throw res.error;
  return res.data;
}

function renderWeek(assignment) {
  const box = document.getElementById("weekBox");
  if (!box) return;

  if (!assignment || !assignment.weeks) {
    box.innerHTML = "<p>Engin vika úthlutuð enn.</p>";
    return;
  }

  const w = assignment.weeks;

  box.innerHTML = `
    <div class="week-card">
      <h3>Vika ${w.week_number ?? ""}</h3>
      <p>${w.title ?? ""}</p>
      <p>
        ${w.start_date ?? ""} – ${w.end_date ?? ""}
      </p>
    </div>
  `;
}

(async () => {
  try {
    const token = getToken();
    if (!token) throw new Error("Missing token");

    const player = await loadPlayerByToken(token);
    const assignment = await loadAssignedWeek(player.id, token);

    const nameEl = document.querySelector("#playerName");
    if (nameEl) nameEl.textContent = `${player.first_name ?? ""} ${player.last_name ?? ""}`.trim();

    console.log("player loaded:", player, "assigned week:", assignment);
    renderWeek(assignment);
  } catch (err) {
    console.error(err);
    document.body.innerHTML = `
      <div style="max-width:640px;margin:40px auto;font-family:system-ui;padding:16px;">
        <h2>Link not valid</h2>
        <p>${(err?.message || String(err))}</p>
      </div>
    `;
  }
})();

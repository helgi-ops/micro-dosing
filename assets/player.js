import { api, supabase, waitForAuthReady } from "./dataClient.js";
import { requireRole } from "./guard.js";

const gate = await requireRole(["player", "coach", "admin"]);
if (!gate.ok) {
  document.body.innerHTML = `<div style="padding:20px">Not authorized for player view.</div>`;
  throw new Error("Forbidden");
}
const IS_COACH = gate.role === "coach" || gate.role === "admin";

const $ = (id) => document.getElementById(id);

function setStatus(txt) {
  const el = $("status");
  if (el) el.textContent = txt || "";
}

function setActionMsg(txt, isError = false) {
  const el = $("actionMsg");
  if (!el) return;
  el.textContent = txt || "";
  el.style.color = isError ? "rgba(255,120,120,.95)" : "";
}

function setPill(id, txt) {
  const el = $(id);
  if (el) el.textContent = txt ?? "—";
}

function qs(name) {
  const u = new URL(window.location.href);
  return u.searchParams.get(name);
}

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function dayIndexFromISO(iso) {
  const d = new Date(iso + "T00:00:00Z");
  // Monday=0
  return (d.getUTCDay() + 6) % 7;
}

function computeReadinessState({ readiness, soreness, sleep, cmjValue, cmjAllTimeBest, cmjMostRecent }) {
  let cmjPctBest = null;
  if (cmjAllTimeBest && cmjValue) cmjPctBest = cmjValue / cmjAllTimeBest;
  let deltaFromMostRecent = null;
  if (cmjMostRecent && cmjValue) deltaFromMostRecent = cmjValue - cmjMostRecent;

  if (
    (readiness ?? 0) <= 5 ||
    (soreness ?? 0) >= 4 ||
    (cmjPctBest !== null && cmjPctBest < 0.9)
  ) {
    return { readiness_state: "READY_LOW", cmjPctBest, deltaFromMostRecent };
  }
  if (
    (readiness ?? 0) === 6 || (readiness ?? 0) === 7 ||
    (soreness ?? 0) === 3 ||
    (cmjPctBest !== null && cmjPctBest < 0.95)
  ) {
    return { readiness_state: "READY_MODERATE", cmjPctBest, deltaFromMostRecent };
  }
  return { readiness_state: "READY_HIGH", cmjPctBest, deltaFromMostRecent };
}

function mapSession(readinessState, plannedSessionType) {
  if (readinessState === "READY_LOW") return "RECOVERY";
  if (readinessState === "READY_MODERATE") return `MICRODOSE_${plannedSessionType || "STRENGTH"}`;
  return plannedSessionType || "STRENGTH";
}

function buildWorkoutPayload({ dayType, readinessState }) {
  const blocks = [];
  const rationale = [`Readiness: ${readinessState}`, `Planned: ${dayType || "Strength"}`];
  const base = (name, items) => ({ name, items });

  const templates = {
    STRENGTH: [
      base("Prep", ["Mobility 5-8m", "RAMP warm-up"]),
      base("Main", ["Squat pattern 3x4-6 @8", "Hinge 3x6-8", "Push/Pull 3x8"]),
      base("Accessory", ["Core/brace 3x12", "Single-leg balance 2x30s"]),
    ],
    POWER: [
      base("Prep", ["Dynamic warm-up", "A-skips/B-skips"]),
      base("Main", ["Jumps/Bounds 4x3", "Medball throws 4x4", "Olympic variant 4x3"]),
      base("Accessory", ["Sprint strides 3x30m", "Core anti-rotation 3x10/side"]),
    ],
    RECOVERY: [
      base("Prep", ["Breathing reset 3m", "T-spine/hip mobility 8m"]),
      base("Main", ["Bike/row easy 10-15m @ <60% HRmax", "Tissue work / band work 8-10m"]),
      base("Accessory", ["Light core 2x15", "Optional walk 10m"]),
    ],
  };

  const key = (dayType || "").toUpperCase().includes("POWER") ? "POWER" :
    (dayType || "").toUpperCase().includes("RECOVERY") ? "RECOVERY" :
    (dayType || "").toUpperCase().includes("PRIMER") ? "RECOVERY" :
    "STRENGTH";

  let chosen = templates.STRENGTH;
  if (readinessState === "READY_LOW") chosen = templates.RECOVERY;
  else if (readinessState === "READY_MODERATE") chosen = key === "POWER" ? templates.POWER : templates.STRENGTH;
  else if (readinessState === "READY_HIGH") chosen = templates[key] || templates.STRENGTH;

  return {
    title: `${key} session (${readinessState})`,
    readiness_state: readinessState,
    rationale,
    blocks: chosen
  };
}

function renderWeekPreview(days) {
  const list = $("weeksList");
  list.innerHTML = "";
  const has = (days || []).length;
  $("weeksEmpty").style.display = has ? "none" : "block";
  $("weeksCount").textContent = has ? "1" : "0";

  const names = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const map = new Map();
  (days || []).forEach(d => map.set(d.day_index, d));

  for (let i = 0; i < 7; i++) {
    const d = map.get(i);
    const li = document.createElement("li");
    const type = d?.session_type || d?.title || "—";
    li.textContent = `${names[i]} — ${type}`;
    list.appendChild(li);
  }
}

function renderWorkout(plan) {
  const area = $("workoutArea");
  if (!plan) {
    area.textContent = "No workout assigned yet.";
    return;
  }
  const payload = plan.workout_payload || {};
  const blocks = payload.blocks || [];
  const rationale = payload.rationale || [];
  area.innerHTML = `
    <div class="muted">Readiness: ${payload.readiness_state || plan.readiness_state || "—"}</div>
    <div class="muted">Source: ${plan.source || "auto_readiness"}</div>
    <div style="height:8px"></div>
    ${rationale.length ? `<div class="muted">Rationale: ${rationale.join(" · ")}</div>` : ""}
    ${blocks.map(b => `
      <div style="margin-top:8px;">
        <strong>${b.name}</strong>
        <ul class="list">${(b.items || []).map(it => `<li>${it}</li>`).join("")}</ul>
      </div>
    `).join("")}
  `;
}

async function main() {
  await waitForAuthReady?.();

  let playerId = qs("id");
  if (!playerId && gate.player_id) playerId = gate.player_id;
  if (!playerId) {
    setStatus("Missing player id");
    $("playerName").textContent = "No player selected";
    return;
  }

  const coachActions = $("coachActions");
  const readinessCard = $("readinessCard");
  const cmjCard = $("cmjCard");
  const assignCard = $("assignCard");
  if (!IS_COACH) {
    coachActions.style.display = "none";
  }
  if (IS_COACH) {
    readinessCard.style.display = "none";
    cmjCard.style.display = "none";
    assignCard.style.display = "none";
  }

  try {
    setStatus("Loading player…");
    const player = await api.getPlayerById(playerId);
    if (!player) throw new Error("Player not found (or blocked by RLS).");

    const name = `${player.first_name || ""} ${player.last_name || ""}`.trim() || player.id;
    const position = player.position || "—";
    const statusText = player.status || "active";
    const email = player.email || player.invite_email || "—";

    $("crumbName").textContent = name;
    $("playerName").textContent = name;
    $("playerMeta").textContent = `id: ${playerId}`;
    $("position").textContent = position;
    $("statusText").textContent = statusText;
    $("email").textContent = email;
    $("createdAt").textContent = fmtDate(player.created_at);
    setPill("playerState", `Status: ${statusText}`);

    const invite = player.invite_email ? { status: player.auth_user_id ? "accepted" : "invited" } : null;
    setPill("inviteState", invite ? `Invite: ${invite.status}` : "Invite: none");

    setStatus("Loading assigned week…");
    const weekLink = await api.getAssignedWeekForPlayer(playerId);
    const assignedWeekId = weekLink?.week_id;
    $("assignedWeek").textContent = weekLink?.week?.title || assignedWeekId || "—";

    let weekDays = [];
    if (assignedWeekId) {
      weekDays = await api.getWeekPreview(assignedWeekId);
      renderWeekPreview(weekDays);
    } else {
      $("weeksEmpty").style.display = "block";
    }

    const today = todayISO();
    const checkin = await api.getLatestCheckin(playerId, today);
    if (checkin) {
      $("checkinStatus").textContent = `Submitted (${fmtDate(checkin.created_at)})`;
      $("readinessInput").value = checkin.readiness ?? "";
      $("sorenessInput").value = checkin.soreness ?? "";
      $("sleepInput").value = checkin.sleep ?? "";
    }

    const cmjHistory = await api.listCmjHistory(playerId, 50);
    const cmjBestVal = cmjHistory.length ? Math.max(...cmjHistory.map(c => c.cmj_value || 0)) : null;
    const cmjRecentVal = cmjHistory.length ? cmjHistory[0].cmj_value : null;
    $("cmjBest").textContent = cmjBestVal ?? "—";
    $("cmjRecent").textContent = cmjRecentVal ?? "—";

    const todaysPlan = await api.getTodayGeneratedPlan(playerId, today);
    renderWorkout(todaysPlan);

    const updateCmjPct = (current) => {
      if (!cmjBestVal || !current) {
        $("cmjPct").textContent = "—";
        return;
      }
      $("cmjPct").textContent = `${((current / cmjBestVal) * 100).toFixed(1)}%`;
    };

    $("saveCheckinBtn").onclick = async () => {
      try {
        const readiness = Number($("readinessInput").value);
        const soreness = Number($("sorenessInput").value);
        const sleep = Number($("sleepInput").value);
        if (!readiness || !soreness && soreness !== 0 || sleep === null) throw new Error("Fill all fields.");
        const readinessCalc = computeReadinessState({
          readiness,
          soreness,
          sleep,
          cmjValue: cmjRecentVal,
          cmjAllTimeBest: cmjBestVal,
          cmjMostRecent: cmjRecentVal
        });
        await api.submitCheckin({
          playerId,
          dateISO: today,
          readiness,
          soreness,
          sleep,
          readiness_state: readinessCalc.readiness_state
        });
        $("checkinStatus").textContent = `Submitted (${readinessCalc.readiness_state})`;
        setStatus("Check-in saved");
      } catch (e) {
        setStatus(e?.message || String(e));
      }
    };

    $("saveCmjBtn").onclick = async () => {
      try {
        const cmjValue = Number($("cmjInput").value);
        if (!cmjValue) throw new Error("Enter CMJ value.");
        const row = await api.submitCmj({ playerId, dateISO: today, cmjValue });
        $("cmjStatus").textContent = `Saved (${fmtDate(row.created_at)})`;
        if (!cmjBestVal || cmjValue > cmjBestVal) $("cmjBest").textContent = cmjValue;
        $("cmjRecent").textContent = cmjValue;
        updateCmjPct(cmjValue);
      } catch (e) {
        setStatus(e?.message || String(e));
      }
    };

    updateCmjPct(cmjRecentVal);

    $("assignWorkoutBtn").onclick = async () => {
      try {
        setStatus("Assigning workout…");
        const latestCheck = await api.getLatestCheckin(playerId, today);
        if (!latestCheck) throw new Error("Submit readiness first.");

        const latestCmj = (await api.listCmjHistory(playerId, 5))[0];

        const readinessCalc = computeReadinessState({
          readiness: latestCheck.readiness,
          soreness: latestCheck.soreness,
          sleep: latestCheck.sleep,
          cmjValue: latestCmj?.cmj_value,
          cmjAllTimeBest: cmjBestVal || latestCmj?.cmj_value || null,
          cmjMostRecent: cmjRecentVal
        });

        const idx = dayIndexFromISO(today);
        const plannedDay = (weekDays || []).find(d => d.day_index === idx);
        const plannedType = plannedDay?.session_type || plannedDay?.title || "Strength";
        const mapped = mapSession(readinessCalc.readiness_state, plannedType.toUpperCase());
        const payload = buildWorkoutPayload({ dayType: mapped, readinessState: readinessCalc.readiness_state });

        const plan = await api.createGeneratedPlan({
          playerId,
          dateISO: today,
          weekId: assignedWeekId,
          readinessState: readinessCalc.readiness_state,
          workoutPayload: payload,
          source: "auto_readiness"
        });

        renderWorkout(plan);
        setStatus("Workout assigned");
      } catch (e) {
        setStatus(e?.message || String(e));
      }
    };

    $("sendInviteBtn").onclick = async () => {
      try {
        setActionMsg("Sending invite…");
        if (api?.sendPlayerInvite) {
          await api.sendPlayerInvite(playerId);
        } else {
          const { error } = await supabase
            .from("player_invites")
            .insert([{ player_id: playerId, status: "invited" }]);
          if (error) throw error;
        }
        setActionMsg("Invite sent.");
        setPill("inviteState", "Invite: invited");
      } catch (e) {
        setActionMsg(e?.message || String(e), true);
      }
    };

    $("removeInviteBtn").onclick = async () => {
      try {
        setActionMsg("Revoking invite…");
        if (api?.revokePlayerInvite) {
          await api.revokePlayerInvite(playerId);
        } else {
          const { error } = await supabase
            .from("player_invites")
            .delete()
            .eq("player_id", playerId);
          if (error) throw error;
        }
        setActionMsg("Invite revoked.");
        setPill("inviteState", "Invite: none");
      } catch (e) {
        setActionMsg(e?.message || String(e), true);
      }
    };

    $("removePlayerBtn").onclick = async () => {
      try {
        if (!confirm("Remove this player? This cannot be undone.")) return;
        setActionMsg("Removing player…");
        if (api?.removePlayer) {
          await api.removePlayer(playerId);
        } else {
          const { error } = await supabase.from("players").delete().eq("id", playerId);
          if (error) throw error;
        }
        setActionMsg("Player removed. Redirecting…");
        window.location.href = "./index.html";
      } catch (e) {
        setActionMsg(e?.message || String(e), true);
      }
    };

    setStatus("Ready");
  } catch (err) {
    setStatus("Error");
    $("playerName").textContent = "Failed to load player";
    setActionMsg(err?.message || String(err), true);
  }
}

main();

(() => {
  // ===============================
  // MICRO-DOSING TEMPLATE LIBRARY
  // UI-only playbook (no logic)
  // ===============================
  const TRAFFIC_UI_MARKERS = {
    green: `🟢 GRÆNT – Fullt svigrúm til markvissrar þjálfunar

Líkaminn þolir áreiti í dag.
Hægt er að keyra valið template óbreytt innan skilgreindra tímamarka.

Ath:
- Gæði > magn
- Stoppaðu ef hraði eða tækni fellur`,
    yellow: `🟡 GULT – Viðhald / snerting

Takmarkað svigrúm fyrir nýtt álag.
Dagurinn er ætlaður viðhaldi eða léttu snertiáreiti.

Leiðbeiningar:
- Halda magni lágu
- Engin failure
- Isometric eða low-volume útfærsla í forgangi`,
    red: `🔴 RAUTT – Endurheimt / Primer

Engin ný þjálfun í dag.
Markmið er að styðja endurheimt og undirbúa næsta dag.

Leiðbeiningar:
- Engar þungar lyftur
- Engar sprengihreyfingar
- Létt hreyfing, öndun eða very low-load isometrics`
  };

  const TEMPLATE_LIBRARY = {
    "Anchor – Strength Dominant": {
      timeCap: "20–25 mín",
      type: "Anchor",
      content: `
Markmið:
- Viðhalda eða örva hámarksstyrk
- Hámarks gæði með lágmarks þreytu

A) Primary Strength
- 4–6 × 2–3 reps
- RPE 7–8
- 2–3 mín hvíld

B) Strength Support / Iso
- 2–3 × 2–3 reps EÐA 20–30 sek iso

C) Trunk / Carry
- Létt stoðæfing

Reglur:
- Engin failure
- Stoppa ef hraði eða tækni fellur
`
    },

    "Anchor – Power Dominant": {
      timeCap: "20–25 mín",
      type: "Anchor",
      content: `
Markmið:
- Viðhalda eða örva sprengikraft
- Hámarks taugavirkni, engin þreyta

A) Primary Power
- 4–6 × 2–3 reps
- Létt–miðlungs þyngd
- Stoppa um leið og hraði fellur

B) Strength Support
- 2–3 × 2–3 reps EÐA 15–25 sek iso
- RPE ≤ 7

C) Elastic / Reactive
- 2–3 × 6–10 reps

Reglur:
- Engar langar eccentrics
- Engin metabolic þreyta
`
    },

    "Anchor – Mixed (Low Volume)": {
      timeCap: "20–25 mín",
      type: "Anchor",
      content: `
Markmið:
- Snerta bæði styrk og power
- Lágmarks þreyta í þéttri viku

A) Strength Touch
- 2–3 × 2–3 reps
- RPE 6–7

B) Power Touch
- 3–4 × 3 reps

C) Isometric / Trunk
- 2–3 × 20–30 sek

Reglur:
- Þetta er viðhald, ekki þróun
`
    },

    "Maintenance – Strength Touch": {
      timeCap: "15–20 mín",
      type: "Maintenance",
      content: `
Markmið:
- Viðhalda styrk án þreytu

A) Primary Strength
- 3–4 × 3–4 reps
- RPE 6–7

B) Isometric Support
- 2–3 × 20–30 sek

C) Trunk / Unilateral
- Létt stoðæfing

Reglur:
- Engin failure
`
    },

    "Maintenance – Power Touch": {
      timeCap: "10–15 mín",
      type: "Maintenance",
      content: `
Markmið:
- Viðhalda sprengikrafti

A) Power Movement
- 3–5 × 2–3 reps

B) Elastic Support
- 2–3 × 6–10 reps

Reglur:
- Gæði > magn
`
    },

    "Maintenance – Isometric Bias": {
      timeCap: "10–15 mín",
      type: "Maintenance",
      content: `
Markmið:
- Viðhald með lágmarks álagi
- Stöðugleiki og taugavirkni

A) Primary Isometric
- 3 × 20–30 sek

B) Secondary Iso / Slow Strength
- 2–3 sett

C) Breathing / Reset
- 2–3 mín

Reglur:
- Æfingin á að róa kerfið
`
    },

    "Primer – Neural / Speed": {
      timeCap: "6–10 mín",
      type: "Primer",
      content: `
Markmið:
- Virkja taugakerfi
- Auka readiness

A) Speed / Jump
- 2–3 × 2–3 reps

B) Elastic
- 2–3 × 10–15 sek

Reglur:
- Engin þreyta
`
    },

    "Primer – Recovery": {
      timeCap: "6–10 mín",
      type: "Primer",
      content: `
Markmið:
- Endurheimt
- Lækka taugaspennu

A) Létt hreyfing
- 2–4 mín

B) Öndun
- 2–3 mín

C) Valfrjáls iso
- 1–2 × 20–30 sek

Reglur:
- Engin ný þjálfun
`
    }
  };
window.updateLastStrengthFromWeekSelections =
  window.updateLastStrengthFromWeekSelections || function () {};

window.updateLastPowerFromWeekSelections =
  window.updateLastPowerFromWeekSelections || function () {};

window.updateLastPlyoFromWeekSelections =
  window.updateLastPlyoFromWeekSelections || function () {};

  function populateWeekGrid() {
    const grid = document.getElementById('microdose-week-grid');
    if (!grid) return;

    const labels = ['Mán','Þri','Mið','Fim','Fös','Lau','Sun'];
    const keys = ['man','tri','mid','fim','fos','lau','sun'];

    grid.innerHTML = keys.map((k, i) => `
      <div class="week-day-select">
        <div class="week-day-label">${labels[i]}</div>
        <label>Dagskrá
          <select id="week-plan-${i}-schedule">
            <option value="">—</option>
            <option value="practice">Æfing</option>
            <option value="game">Leikur</option>
            <option value="skill_session">Tækni</option>
            <option value="off">Frí</option>
          </select>
        </label>
        <label>Álag
          <select id="week-plan-${i}-load">
            <option value="">—</option>
            <option value="Lágt">Lágt</option>
            <option value="Miðlungs">Miðlungs</option>
            <option value="Hátt">Hátt</option>
          </select>
        </label>
      </div>
    `).join('');
  }

  const dagPanel = {
    section: document.getElementById('microdose-section'),
    btn: document.getElementById('microdose-run'),
    dagur: document.getElementById('microdose-dagur'),
    focusDaySelect: document.querySelector('#focusDaySelect') || document.getElementById('microdose-dagur'),
    readiness: document.getElementById('microdose-readiness'),
    focus: document.querySelector('#focusText') || document.getElementById('microdose-focus'),
    output: document.getElementById('microdose-output'),
    status: document.querySelector('#focusNote') || document.getElementById('microdose-status')
  };

  const weekPanel = {
    grid: document.getElementById('microdose-week-grid'),
    run: document.getElementById('microdose-week-run'),
    output: document.getElementById('weekResult') || document.getElementById('microdose-week-output'),
    status: document.getElementById('microdose-week-status') || document.getElementById('weekMeta'),
    resStrength: document.getElementById('residual-strength'),
    resPower: document.getElementById('residual-power'),
    resPlyo: document.getElementById('residual-plyo'),
    resetBtn: document.getElementById('btnResetResiduals'),
    residualStatus: document.getElementById('residualsStatus'),
    athlete: document.getElementById('athleteName'),
    athleteHint: document.getElementById('athleteStorageKeyHint'),
    loadLastWeekBtn: document.getElementById('btnLoadLastWeek'),
    clearLastWeekBtn: document.getElementById('btnClearLastWeek'),
    lastWeekStatus: document.getElementById('lastWeekStatus'),
    weekStartInput: document.getElementById('weekStartInput'),
    exposureSelect: document.getElementById('exposureSelect'),
    exposureStatus: document.getElementById('exposureStatus')
  };

  const LS_RES_PREFIX = 'microdose_residuals_v1_';
  const LS_WEEK_PREFIX = 'microdose_lastweek_v1_';
  const LS_EXPOSURE_PREFIX = 'microdose_exposure_v1_';

  const dayNames = ['Mán','Þri','Mið','Fim','Fös','Lau','Sun'];
  let weekUserTouched = false;
  let currentPrevSched = null;
  let lastWeekResult = null;
  const dayKeyMap = {
    'mán': 'man',
    'man': 'man',
    'monday': 'man',
    'þri': 'tri',
    'tri': 'tri',
    'mið': 'mid',
    'mid': 'mid',
    'fim': 'fim',
    'fös': 'fos',
    'fos': 'fos',
    'lau': 'lau',
    'sun': 'sun',
    'sunna': 'sun'
  };

function normDayKey(name) {
  const raw = (name || '').toString().trim().toLowerCase();
  const key = raw.replace(/[^a-záðéíóúýþæö]/g, '').slice(0, 3);
  return dayKeyMap[key] || key || 'man';
}
function dayIndexFromKey(name) {
  const key = normDayKey(name);
  const map = { man: 0, tri: 1, mid: 2, fim: 3, fos: 4, lau: 5, sun: 6 };
  return map[key] ?? 0;
}

function playerSlug() {
  const p = document.getElementById('playerSelect');
  return (p?.value || 'default')
    .toLowerCase()
    .replace(/\s+/g, '-');
}

function lastStrengthKey() {
  return `microdose_last_strength_v1_${playerSlug()}`;
}

function setResidualStrengthFromDate(isoDate) {
  const input = document.getElementById('residual-strength');
  if (!input || !isoDate) return;

  const last = new Date(isoDate + 'T00:00:00');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffDays = Math.max(
    0,
    Math.min(21, Math.floor((today - last) / (1000 * 60 * 60 * 24)))
  );
function updateLastStrengthFromWeekSelections() {
  const todayISO = new Date().toISOString().slice(0, 10);

  // NOTAÐU MÁNUDAG NÚVERANDI VIKU sem grunn (einfalt MVP)
  const now = new Date();
  const day = now.getDay(); // Sun=0..Sat=6
  const diffToMon = (day === 0 ? -6 : 1) - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMon);
  monday.setHours(0, 0, 0, 0);
  const weekStartISO = monday.toISOString().slice(0, 10);

  const addDaysISO = (iso, days) => {
    const d = new Date(iso + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  // Finnum alla schedule dropdowns: week-plan-0-schedule ... week-plan-6-schedule
  const selects = [...document.querySelectorAll('select[id^="week-plan-"][id$="-schedule"]')];
  if (!selects.length) return;

  let bestISO = null;

  for (const sel of selects) {
    const m = sel.id.match(/^week-plan-(\d+)-schedule$/);
    if (!m) continue;
    const idx = Number(m[1]);

    const v = (sel.value || '').toLowerCase();

    // Skilgreining STYRK: þú getur fínstillt þetta seinna
    // Hér: ef dropdown value inniheldur "styrk"
    const isStrength = v.includes('styrk');

    if (!isStrength) continue;

    const dayISO = addDaysISO(weekStartISO, idx);

    // teljum bara daga sem eru <= í dag
    if (dayISO <= todayISO) {
      if (!bestISO || dayISO > bestISO) bestISO = dayISO;
    }
  }

  if (!bestISO) return;

  localStorage.setItem(lastStrengthKey(), bestISO);
  setResidualStrengthFromDate(bestISO);
}
function updateLastPowerFromWeekSelections() {
  const todayISO = new Date().toISOString().slice(0, 10);

  const now = new Date();
  const day = now.getDay();
  const diffToMon = (day === 0 ? -6 : 1) - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMon);
  monday.setHours(0, 0, 0, 0);
  const weekStartISO = monday.toISOString().slice(0, 10);

  const addDaysISO = (iso, days) => {
    const d = new Date(iso + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  const selects = [...document.querySelectorAll('select[id^="week-plan-"][id$="-schedule"]')];
  if (!selects.length) return;

  let bestISO = null;

  for (const sel of selects) {
    const m = sel.id.match(/^week-plan-(\d+)-schedule$/);
    if (!m) continue;
    const idx = Number(m[1]);

    const v = (sel.value || '').toLowerCase();

    // Match POWER (you can adjust)
    const isPower = v.includes('power') || v.includes('hröð') || v.includes('hrað') || v.includes('spreng');

    if (!isPower) continue;

    const dayISO = addDaysISO(weekStartISO, idx);
    if (dayISO <= todayISO) {
      if (!bestISO || dayISO > bestISO) bestISO = dayISO;
    }
  }

  if (!bestISO) return;

  localStorage.setItem(lastPowerKey(), bestISO);
  setResidualPowerFromDate(bestISO);
}

function updateLastPlyoFromWeekSelections() {
  const todayISO = new Date().toISOString().slice(0, 10);

  const now = new Date();
  const day = now.getDay();
  const diffToMon = (day === 0 ? -6 : 1) - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMon);
  monday.setHours(0, 0, 0, 0);
  const weekStartISO = monday.toISOString().slice(0, 10);

  const addDaysISO = (iso, days) => {
    const d = new Date(iso + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  const selects = [...document.querySelectorAll('select[id^="week-plan-"][id$="-schedule"]')];
  if (!selects.length) return;

  let bestISO = null;

  for (const sel of selects) {
    const m = sel.id.match(/^week-plan-(\d+)-schedule$/);
    if (!m) continue;
    const idx = Number(m[1]);

    const v = (sel.value || '').toLowerCase();

    // Match PLYO (you can adjust)
    const isPlyo = v.includes('plyo') || v.includes('stökk') || v.includes('hop') || v.includes('sprett');

    if (!isPlyo) continue;

    const dayISO = addDaysISO(weekStartISO, idx);
    if (dayISO <= todayISO) {
      if (!bestISO || dayISO > bestISO) bestISO = dayISO;
    }
  }

  if (!bestISO) return;

  localStorage.setItem(lastPlyoKey(), bestISO);
  setResidualPlyoFromDate(bestISO);
}

  input.value = diffDays;
}
// =========================
// Residuals – Generic engine
// =========================

function playerSlug() {
  const p = document.getElementById('playerSelect');
  return (p?.value || 'default').toLowerCase().trim().replace(/\s+/g, '-');
}

function clamp21(n) {
  return Math.max(0, Math.min(21, n));
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function currentWeekMondayISO() {
  const d = new Date();
  const day = d.getDay(); // Sun=0..Sat=6
  const diff = (day === 0 ? -6 : 1) - day; // to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function addDaysISO(iso, days) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetweenISO(fromISO, toISO) {
  const a = new Date(fromISO + 'T00:00:00');
  const b = new Date(toISO + 'T00:00:00');
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

function setResidualFromDate(inputId, isoDate) {
  const input = document.getElementById(inputId);
  if (!input || !isoDate) return;
  input.value = String(clamp21(daysBetweenISO(isoDate, todayISO())));
}

function lastKey(type) {
  return `microdose_last_${type}_v1_${playerSlug()}`;
}

/**
 * Generic updater:
 * - type: "strength" | "power" | "plyo"
 * - inputId: residual input id
 * - matchFn: (scheduleValue, loadValue) => boolean
 */
function updateLastFromWeekSelections({ type, inputId, matchFn, weekStartISO }) {
  const today = todayISO();
  const start = weekStartISO || currentWeekMondayISO();

  // day selects: week-plan-0-schedule ... week-plan-6-schedule
  const scheduleSelects = [...document.querySelectorAll('select[id^="week-plan-"][id$="-schedule"]')];
  if (!scheduleSelects.length) return;

  let bestISO = null;

  for (const sel of scheduleSelects) {
    const m = sel.id.match(/^week-plan-(\d+)-schedule$/);
    if (!m) continue;
    const idx = Number(m[1]);

    const scheduleVal = (sel.value || sel.options?.[sel.selectedIndex]?.text || '').toLowerCase();

    // Optional load select: week-plan-0-load ...
    const loadEl = document.getElementById(`week-plan-${idx}-load`);
    const loadVal = (loadEl?.value || loadEl?.options?.[loadEl.selectedIndex]?.text || '').toLowerCase();

    if (!matchFn(scheduleVal, loadVal)) continue;

    const dayISO = addDaysISO(start, idx);

    // only count days not in the future
    if (dayISO <= today) {
      if (!bestISO || dayISO > bestISO) bestISO = dayISO;
    }
  }

  if (!bestISO) return;

  localStorage.setItem(lastKey(type), bestISO);
  setResidualFromDate(inputId, bestISO);
}

// ------------ Rules (EDIT HERE if needed) ------------
// IMPORTANT: Choose ONE strategy for identifying STYRK/POWER/PLYO.
// Strategy A (text-based): schedule contains keywords
const RULES = [
  {
    type: 'strength',
    inputId: 'residual-strength',
    matchFn: (schedule, load) => schedule.includes('styrk'),
  },
  {
    type: 'power',
    inputId: 'residual-power',
    matchFn: (schedule, load) =>
      schedule.includes('power') || schedule.includes('hrað') || schedule.includes('hröð') || schedule.includes('spreng'),
  },
  {
    type: 'plyo',
    inputId: 'residual-plyo',
    matchFn: (schedule, load) =>
      schedule.includes('plyo') || schedule.includes('stökk') || schedule.includes('hop'),
  },
];

function updateAllResidualsFromWeek() {
  // if you later add a "week start date" input, plug it in here:
  const weekStartISO = null; // or document.getElementById('weekStartDate')?.value || null
  RULES.forEach(r => updateLastFromWeekSelections({ ...r, weekStartISO }));
}

  function toSlug(name) {
    return (name || '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '') || 'default';
  }

  function getCurrentAthleteKey() {
    const name = weekPanel.athlete ? weekPanel.athlete.value.trim() : '';
    return toSlug(name) || 'default';
  }

  function updateAthleteHint() {
    if (!weekPanel.athleteHint) return;
    const key = `${LS_RES_PREFIX}${getCurrentAthleteKey()}`;
    weekPanel.athleteHint.textContent = `Geymslulykill: ${key}`;
  }

  function ensureWeekCards() {
    if (!weekPanel.grid) return;
    weekPanel.grid.innerHTML = '';
    dayNames.forEach((d, idx) => {
      const card = document.createElement('div');
      card.className = 'week-card';
      card.innerHTML = `
        <strong>${d}</strong>
        <label>Dagskrá
          <select id="week-plan-${idx}-schedule">
            <option value="practice">Æfing</option>
            <option value="skill_session">Tækni</option>
            <option value="game">Leikur</option>
            <option value="off">Frí</option>
          </select>
        </label>
        <label>Álag
          <select id="week-plan-${idx}-load">
            <option>Lágt</option>
            <option>Miðlungs</option>
            <option>Hátt</option>
          </select>
        </label>`;
      weekPanel.grid.appendChild(card);
    });
  }

  function fmt(txt) { return (txt || '').toString().trim(); }

  function lsResKey() {
    return LS_RES_PREFIX + getCurrentAthleteKey();
  }
  function lsWeekKey() {
    return LS_WEEK_PREFIX + getCurrentAthleteKey();
  }
  function lsExposureKey() {
    return LS_EXPOSURE_PREFIX + getCurrentAthleteKey();
  }

  function loadResidualsFromStorage() {
    try {
      const raw = localStorage.getItem(lsResKey());
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function saveResidualsToStorage(residuals) {
    try {
      localStorage.setItem(lsResKey(), JSON.stringify(residuals));
      setResidualStatus(`Residuals vistað fyrir ${weekPanel.athlete?.value || 'default'} ✅`);
    } catch (e) {
      setResidualStatus('Ekki tókst að vista residuals (vafrastillingar).');
    }
  }

  function clearResidualsStorage() {
    try {
      localStorage.removeItem(lsResKey());
      setResidualStatus(`Residuals endurstillt fyrir ${weekPanel.athlete?.value || 'default'}`);
    } catch (e) {
      setResidualStatus('Ekki tókst að endurstilla');
    }
  }

  function loadLastWeekFromStorage() {
    try {
      const raw = localStorage.getItem(lsWeekKey());
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function saveLastWeekToStorage(data) {
    try {
      localStorage.setItem(lsWeekKey(), JSON.stringify({ ...data, saved_at: Date.now() }));
      setLastWeekStatus(`Síðasta vika vistuð fyrir ${weekPanel.athlete?.value || 'default'} ✅`);
    } catch (e) {
      setLastWeekStatus('Ekki tókst að vista síðustu viku');
    }
  }

  function clearLastWeekStorage() {
    try {
      localStorage.removeItem(lsWeekKey());
      setLastWeekStatus('Síðasta vika hreinsuð');
    } catch (e) {
      setLastWeekStatus('Ekki tókst að hreinsa síðustu viku');
    }
  }

  let statusTimer = null;
  function setResidualStatus(msg) {
    if (!weekPanel.residualStatus) return;
    weekPanel.residualStatus.textContent = msg || '';
    if (statusTimer) clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
      if (weekPanel.residualStatus) weekPanel.residualStatus.textContent = '';
    }, 2500);
  }

  let lastWeekTimer = null;
  function setLastWeekStatus(msg) {
    if (!weekPanel.lastWeekStatus) return;
    weekPanel.lastWeekStatus.textContent = msg || '';
    if (lastWeekTimer) clearTimeout(lastWeekTimer);
    lastWeekTimer = setTimeout(() => {
      if (weekPanel.lastWeekStatus) weekPanel.lastWeekStatus.textContent = '';
    }, 2500);
  }

  function setExposureStatus(msg) {
    if (!weekPanel.exposureStatus) return;
    weekPanel.exposureStatus.textContent = msg || '';
    if (statusTimer) clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
      if (weekPanel.exposureStatus) weekPanel.exposureStatus.textContent = '';
    }, 2500);
  }

  function loadExposureFromStorage() {
    try {
      const raw = localStorage.getItem(lsExposureKey());
      if (!raw) return null;
      return raw;
    } catch (e) {
      return null;
    }
  }

  function saveExposureToStorage(value) {
    try {
      localStorage.setItem(lsExposureKey(), value);
      setExposureStatus(`Exposure vistað fyrir ${weekPanel.athlete?.value || 'default'}`);
    } catch (e) {
      setExposureStatus('Ekki tókst að vista exposure');
    }
  }

  function autofillResidualInputs() {
    const saved = loadResidualsFromStorage();
    if (!saved) return;
    const fields = [
      { el: weekPanel.resStrength, val: saved.strength },
      { el: weekPanel.resPower, val: saved.power },
      { el: weekPanel.resPlyo, val: saved.plyo }
    ];
    fields.forEach(({ el, val }) => {
      if (!el) return;
      if (el.value === '' && val !== null && val !== undefined) {
        el.value = val;
      }
    });
    setResidualStatus(`Residuals hlaðið fyrir ${weekPanel.athlete?.value || 'default'}`);
  }

  function applyExposurePrefill() {
    if (!weekPanel.exposureSelect) return;
    const stored = loadExposureFromStorage();
    if (stored) {
      weekPanel.exposureSelect.value = stored;
    } else {
      weekPanel.exposureSelect.value = 'low';
    }
  }

  function mapTypeToDropdown(typeVal) {
    const t = (typeVal || '').toLowerCase();
    if (t === 'practice' || t === 'basketball_practice') return 'practice';
    if (t === 'skill_session') return 'skill_session';
    if (t === 'game') return 'game';
    if (t === 'off') return 'off';
    return 'practice';
  }

  function applyLastWeekToUI(lastWeek) {
    if (!lastWeek || !Array.isArray(lastWeek.week_schedule)) return;
    if (weekPanel.weekStartInput && !weekPanel.weekStartInput.value) {
      weekPanel.weekStartInput.value = lastWeek.week_start || '';
    }
    lastWeek.week_schedule.forEach((item, idx) => {
      const schedSel = document.getElementById(`week-plan-${idx}-schedule`);
      const loadSel = document.getElementById(`week-plan-${idx}-load`);
      if (schedSel) schedSel.value = mapTypeToDropdown(item.type || item.dagskra || 'practice');
      if (loadSel && item.alag) loadSel.value = item.alag;
    });
    setLastWeekStatus('Síðasta vika hlaðin ✅');
  }

  async function runDayPlan() {
    if (!dagPanel.btn) return;
    currentPrevSched = currentPrevSched || null;
    dagPanel.btn.disabled = true;
    dagPanel.btn.textContent = 'Bý til...';
    if (dagPanel.status) dagPanel.status.style.display = 'none';
    if (dagPanel.output) dagPanel.output.textContent = '';
    try {
      const schedule = readWeekScheduleFromUI();
      const dayIdx = dayIndexFromKey(dagPanel.focusDaySelect?.value || dagPanel.dagur?.value || 'Mán');
      const sched = Array.isArray(schedule) ? schedule[dayIdx] : null;
      const dayLabel = (sched && sched.dagur) ? sched.dagur : (dayNames[dayIdx] || 'Mán');
      const weekDay = Array.isArray(lastWeekResult) ? lastWeekResult[dayIdx] : null;
      // If we already have a full plan from the generated Vikuplan, use it directly.
      if (weekDay) {
        const enriched = { ...weekDay, status: weekDay.status || 'ok', dagur: weekDay.dagur || dayLabel };
        renderDayResult(enriched, sched || {}, dayLabel, schedule, dayIdx);
        return;
      }
      const focusVal = fmt(dagPanel.focus?.value || (sched ? `${sched.dagskra || ''} + ${sched.alag || ''}` : 'Hraði + styrkur'));
      const payload = {
        dagur: fmt(dagPanel.dagur?.value || dayLabel),
        readiness: Number(dagPanel.readiness?.value || 7),
        focus: focusVal,
        dagskra: sched?.dagskra || '',
        alag: sched?.alag || '',
        week_schedule: schedule || []
      };
      const res = await fetch('/.netlify/functions/microdose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`Villa frá netlify (${res.status})`);
      const data = await res.json();
      renderDayResult(data, sched || {}, dayLabel, schedule, dayIdx);
    } catch (err) {
      dagPanel.output.innerHTML = `<strong>Villa:</strong> ${err.message || err}`;
    } finally {
      dagPanel.btn.disabled = false;
      dagPanel.btn.textContent = 'Búa til micro-dose plan';
    }
  }

  function renderDayResult(data, sched = {}, dayLabel = '', schedule = [], dayIdx = 0) {
    if (!data || data.status !== 'ok') {
      dagPanel.output.innerHTML = '<strong>Engar niðurstöður.</strong>';
      return;
    }
    const disp = mapDisplayPlan(data, sched, currentPrevSched, getExposureValue());
    if (dagPanel.status) {
      dagPanel.status.textContent = `Ljósakerfi: ${data.traffic?.toUpperCase() || ''} – ${disp.plan}`;
      dagPanel.status.style.display = 'inline-block';
    }
    const prevSched = dayIdx > 0 && Array.isArray(schedule) ? schedule[dayIdx - 1] : null;
    const tpl = getSessionTemplate(
      { ...data, ...sched, dagur: data.dagur || sched.dagur || dayLabel, focus: data.focus || sched.focus },
      { exposure: getExposureValue(), md1: isMDPlus1(prevSched) || ((prevSched?.type || '').toLowerCase() === 'game') }
    );

    const infoBlocks = [
      `<strong>Dagur:</strong> ${data.dagur || sched.dagur || dayLabel || '—'}`,
      `<strong>Fókus:</strong> ${data.focus || dagPanel.focus?.value || '—'}`,
      `<strong>Áætlun:</strong> ${(disp.template || data.stefna || data.template || '—')} (${disp.plan || data.plan || '—'})`,
      `<strong>Tímamörk:</strong> ${disp.time || data.minutur || data.time || data.lota || (tpl.totalMinutes ? `${tpl.totalMinutes} mín` : '—')}`,
      `<strong>Dagskrá:</strong> ${data.dagskra || sched.dagskra || '—'}`,
      `<strong>Álag:</strong> ${data.alag || sched.alag || '—'}`,
      `<strong>Exposure:</strong> ${getExposureValue()}`
    ];
    if (disp.exposureNote) infoBlocks.push(`<strong>Exposure ath.:</strong> ${disp.exposureNote}`);
    if (disp.note) infoBlocks.push(`<strong>Ath:</strong> ${disp.note}`);

    const sessionHtml = tpl && tpl.blocks && tpl.blocks.length
      ? tpl.blocks.map(block => `
          <div class="session-block">
            <div class="session-block-head">
              <span>${block.title}</span>
              ${block.minutes ? `<span>${block.minutes} mín</span>` : ''}
            </div>
            <ul class="session-items">
              ${(block.items || []).map(item => `<li><strong>${item.name}:</strong> ${item.prescription || ''}</li>`).join('')}
            </ul>
          </div>
        `).join('')
      : '<div class="session-block">No session template found for this day type.</div>';

    const notesHtml = tpl.notes && tpl.notes.length
      ? `<div class="session-notes">${tpl.notes.map(n => `<div>${n}</div>`).join('')}</div>`
      : '';

    dagPanel.output.innerHTML = `
      <div class="session-summary">${infoBlocks.map(p => `<div>${p}</div>`).join('')}</div>
      ${sessionHtml}
      ${notesHtml}
    `;
    currentPrevSched = null;
  }

  function mapLoadToReadiness(load) {
    const val = (load || '').toLowerCase();
    if (val.startsWith('h')) return 4;
    if (val.startsWith('m')) return 6;
    return 8;
  }

  function readWeekScheduleFromUI() {
    return dayNames.map((name, idx) => {
      const sched = document.getElementById(`week-plan-${idx}-schedule`);
      const load = document.getElementById(`week-plan-${idx}-load`);
      const rawVal = sched?.value || 'practice';
      let dagskra = 'Æfing';
      if (rawVal === 'skill_session') dagskra = 'Tækni';
      else if (rawVal === 'game') dagskra = 'Leikur';
      else if (rawVal === 'off') dagskra = 'Frí';
      return {
        dagur: name,
        dagskra,
        alag: fmt(load?.value || 'Miðlungs'),
        type: rawVal === 'basketball_practice' ? 'basketball_practice' : rawVal
      };
    });
  }

  async function runWeekPlan() {
    if (!weekPanel.run) return;
    weekPanel.run.disabled = true;
    weekPanel.run.textContent = 'Bý til...';
    if (weekPanel.status) {
      weekPanel.status.style.display = 'none';
    }
    if (weekPanel.output) {
      weekPanel.output.textContent = '';
    }
    const schedule = readWeekScheduleFromUI();
    // Always show the selected schedule immediately so user gets feedback, even offline
    renderWeekFallback(schedule, 'Bý til vikuplan...');
    try {
      saveExposureToStorage(getExposureValue());
      const ctx = {
        last_strength_days: weekPanel.resStrength?.value ? Number(weekPanel.resStrength.value) : null,
        last_power_days: weekPanel.resPower?.value ? Number(weekPanel.resPower.value) : null,
        last_plyo_days: weekPanel.resPlyo?.value ? Number(weekPanel.resPlyo.value) : null
      };
      const weekStart = weekPanel.weekStartInput?.value || 'Þessi vika';
      const payload = { week_start: weekStart, week_schedule: schedule, week_context: ctx };
      // vista strax sem síðustu viku (input)
      saveLastWeekToStorage({ week_start: weekStart, week_schedule: schedule });
      setLastWeekStatus(`Síðasta vika vistuð fyrir ${weekPanel.athlete?.value || 'default'} ✅`);
      const res = await fetch('/.netlify/functions/microdose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`Villa frá netlify (${res.status})`);
      const data = await res.json();
      if (data.residuals_end) {
        saveResidualsToStorage(data.residuals_end);
        if (weekPanel.resStrength) weekPanel.resStrength.value = data.residuals_end.strength ?? '';
        if (weekPanel.resPower) weekPanel.resPower.value = data.residuals_end.power ?? '';
        if (weekPanel.resPlyo) weekPanel.resPlyo.value = data.residuals_end.plyo ?? '';
      }
      renderWeekResult(data, schedule);
    } catch (err) {
      renderWeekFallback(schedule, err?.message || '');

    } finally {
      weekPanel.run.disabled = false;
      weekPanel.run.textContent = 'Búa til vikuplan';
    }
  }

  function renderWeekResult(data, schedule) {
    if (!data || data.status !== 'ok' || !Array.isArray(data.week)) {
      lastWeekResult = null;
      if (weekPanel.output) {
        weekPanel.output.innerHTML = '<strong>Engar niðurstöður.</strong>';
      }
      renderWeekCards(null, schedule);
      return;
    }
    lastWeekResult = Array.isArray(data.week) ? data.week : null;
    if (weekPanel.status) {
      weekPanel.status.textContent = `Vika: ${data.week_start || ''}`;
      weekPanel.status.style.display = 'inline-block';
    }

    if (weekPanel.output) {
      weekPanel.output.innerHTML = `
        <div class="week-result-note">Vikuplan tilbúið.</div>
      `;
    }

    renderWeekCards(lastWeekResult, schedule);
  }

  function applyDayToPanel(dayData, sched) {
    const dayVal = dayData?.dagur || sched?.dagur || 'Mán';
    if (dagPanel.dagur) dagPanel.dagur.value = dayVal;
    if (dagPanel.focusDaySelect) dagPanel.focusDaySelect.value = dayVal;
    if (dagPanel.focus) dagPanel.focus.value = sched?.dagskra ? `${sched.dagskra} + ${sched.alag}` : 'Hraði + styrkur';
    if (dagPanel.status) dagPanel.status.textContent = dayData?.note || '';
    if (dagPanel.readiness) dagPanel.readiness.value = dayData?.readiness || mapLoadToReadiness(sched?.alag);
  }

  function renderWeekFallback(schedule = [], errorText = '') {
    lastWeekResult = null;
    if (weekPanel.output) {
      weekPanel.output.innerHTML = errorText
        ? `<div class="week-error">${errorText}</div>`
        : '';
    }
    renderWeekCards(null, schedule);
  }

  function getRecommendationForDay(dayKey) {
    const schedule = readWeekScheduleFromUI();
    const idx = ['man','tri','mid','fim','fos','lau','sun'].indexOf(normDayKey(dayKey));
    if (idx === -1 || !schedule[idx]) return { focus: '', note: '' };
    const s = schedule[idx];
    const focus = `${s.dagskra || ''} · ${s.alag || ''}`.trim();
    return { focus, note: s.note || '' };
  }

  function openDayInFocusPanel(dayKey){
    const daySelect = dagPanel.focusDaySelect || document.querySelector('#focusDaySelect');
    const focusText = dagPanel.focus || document.querySelector('#focusText');
    const noteEl    = document.querySelector('#focusNote') || dagPanel.status;

    if (!daySelect || !focusText) {
      console.warn('Áherslur dags: vantar #focusDaySelect eða #focusText');
      return;
    }

    const mapToUiValue = {
      man: 'Mán',
      tri: 'Þri',
      mid: 'Mið',
      fim: 'Fim',
      fos: 'Fös',
      lau: 'Lau',
      sun: 'Sun'
    };

    const uiValue = mapToUiValue[dayKey] ?? mapToUiValue[normDayKey(dayKey)] ?? dayKey;
    daySelect.value = uiValue;

    const reco = getRecommendationForDay(dayKey);
    focusText.value = reco.focus || reco.text || '';

    if (noteEl) noteEl.textContent = reco.note || '';

    const panel = document.querySelector('#focusPanel') || focusText.closest('.card') || focusText;
    if (panel?.scrollIntoView) panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function getExposureValue() {
    const val = weekPanel.exposureSelect?.value || 'low';
    if (val === 'high' || val === 'moderate') return val;
    return 'low';
  }

  /* ---------- Session templates for each day ---------- */
  const EX = {
    mobility: [
      { name: '90/90 Hip + Reach', prescription: '2x5/side' },
      { name: 'World’s Greatest', prescription: '2x4/side' }
    ],
    primer: [
      { name: 'A-skips / dribbles', prescription: '2x15–20m' },
      { name: 'Skating hop', prescription: '2x5/side' },
      { name: 'Pogos', prescription: '2x12' }
    ],
    plyo: [
      { name: 'Hurdle hop', prescription: '3x4' },
      { name: 'Medball chest pass', prescription: '3x6' }
    ],
    power: [
      { name: 'Bound or split jump', prescription: '3x5/side' },
      { name: 'MB scoop toss', prescription: '3x6' }
    ],
    strengthLower: [
      { name: 'RDL', prescription: '3x6 @ 7RPE' },
      { name: 'Split squat / lunge', prescription: '3x6/side' }
    ],
    strengthUpper: [
      { name: 'DB Bench / Push-up', prescription: '3x8' },
      { name: 'Row / Pull', prescription: '3x10' }
    ],
    iso: [
      { name: 'Copenhagen / Adductor plank', prescription: '2–3x20–30s/side' },
      { name: 'Hamstring iso (Nordic / Hinge iso)', prescription: '2–3x5–8s' }
    ],
    trunk: [
      { name: 'Pallof / anti-rotation', prescription: '3x10/side' },
      { name: 'Dead bug or plank', prescription: '3x30s' }
    ],
    recovery: [
      { name: 'Easy bike / walk', prescription: '6–10 mín' },
      { name: 'Breath reset', prescription: '2x8 djúpar' }
    ]
  };

  function pick(list, count = 1) {
    if (!Array.isArray(list) || list.length === 0) return [];
    return list.slice(0, Math.max(0, count));
  }

  function getDayCategory(day = {}, context = {}) {
    const src = `${day.stefna || ''} ${day.plan || ''} ${day.template || ''} ${day.type || ''} ${day.focus || ''}`.toLowerCase();
    if (context.md1) return 'primer';
    if (src.includes('primer') || src.includes('rautt')) return 'primer';
    if (src.includes('recovery') || src.includes('off') || (day.dagskra || '').toLowerCase() === 'frí') return 'recovery';
    if (src.includes('anchor')) return 'anchor';
    if (src.includes('maint')) return 'maintenance';
    if (src.includes('power')) return 'power';
    if (src.includes('styrk') || src.includes('strength')) return 'strength';
    return 'maintenance';
  }

  function getSessionTemplate(day = {}, context = {}) {
    const notes = [];
    const exposure = context.exposure || 'low';
    const category = getDayCategory(day, context);

    if (context.md1) notes.push('MD+1: minnka álag, notaðu Primer hugmynd.');
    if (exposure === 'high') notes.push('High exposure: haltu magni lágu.');

    const blocksByCat = {
      primer: () => ({
        totalMinutes: 8,
        blocks: [
          { title: 'Hreyfigeta + öndun', minutes: 3, items: pick(EX.mobility, 2) },
          { title: 'Taugavirkjun', minutes: 3, items: pick(EX.primer, 2) },
          { title: 'Létt plyo / lok', minutes: 2, items: pick(EX.plyo, 1) }
        ]
      }),
      maintenance: () => ({
        totalMinutes: 14,
        blocks: [
          { title: 'Priming / plyo', minutes: 4, items: pick(EX.primer, 2) },
          { title: 'Viðhald styrkur', minutes: 6, items: pick(EX.strengthLower, 1).concat(pick(EX.strengthUpper, 1)) },
          { title: 'Iso + kjarni', minutes: 4, items: pick(EX.iso, 1).concat(pick(EX.trunk, 1)) }
        ]
      }),
      anchor: () => ({
        totalMinutes: 22,
        blocks: [
          { title: 'Aðal blokk', minutes: 10, items: pick(EX.strengthLower, 1).concat(pick(EX.power, 1)) },
          { title: 'Álag + viðhald', minutes: 7, items: pick(EX.strengthUpper, 1).concat(pick(EX.iso, 1)) },
          { title: 'Kjarni / lok', minutes: 5, items: pick(EX.trunk, 1) }
        ]
      }),
      strength: () => ({
        totalMinutes: 24,
        blocks: [
          { title: 'Taugavirkjun', minutes: 4, items: pick(EX.primer, 1).concat(pick(EX.plyo, 1)) },
          { title: 'Styrkur A', minutes: 10, items: pick(EX.strengthLower, 1).concat(pick(EX.strengthUpper, 1)) },
          { title: 'Styrkur B', minutes: 6, items: pick(EX.iso, 1).concat(pick(EX.trunk, 1)) },
          { title: 'Lok', minutes: 4, items: pick(EX.trunk, 1) }
        ]
      }),
      power: () => ({
        totalMinutes: 18,
        blocks: [
          { title: 'Upphitun / footwork', minutes: 4, items: pick(EX.primer, 1) },
          { title: 'Power / plyo', minutes: 7, items: pick(EX.power, 2) },
          { title: 'Iso + kjarni', minutes: 5, items: pick(EX.iso, 1).concat(pick(EX.trunk, 1)) }
        ]
      }),
      recovery: () => ({
        totalMinutes: 8,
        blocks: [
          { title: 'Endurheimt', minutes: 5, items: pick(EX.recovery, 1) },
          { title: 'Mobility', minutes: 3, items: pick(EX.mobility, 1) }
        ]
      })
    };

    const fn = blocksByCat[category];
    if (!fn) {
      return {
        totalMinutes: 0,
        blocks: [],
        notes: ['No session template found for this day type.']
      };
    }
    const tpl = fn();
    return {
      totalMinutes: tpl.totalMinutes,
      blocks: tpl.blocks,
      notes
    };
  }

  function isMDPlus1(prevSched) {
    const t = (prevSched?.type || '').toLowerCase();
    return t === 'game';
  }

  function mapDisplayPlan(day, sched, prevSched, exposureOverride) {
    const traffic = (day.traffic || '').toLowerCase();
    const originalPlan = day.stefna || day.plan || day.template || '';
    const originalTemplate = day.template || originalPlan || '—';
    let displayPlan = originalPlan || originalTemplate || '—';
    let displayTemplate = originalTemplate || '—';
    let displayTime = day.minutur || day.time || day.lota || '—';
    let displayNote = '';
    let exposureNote = '';

    const displayNotes = {
      rautt: 'Rautt: Engin ný þjálfun. Einungis endurheimt/primer.',
      gult: 'Gult: Viðhald/snerting, halda magni lágu.',
      graent: ''
    };

    if (traffic === 'rautt') {
      displayPlan = 'Primer';
      displayTemplate = 'Primer – Recovery';
      displayTime = '6–10 mín';
      displayNote = displayNotes.rautt;
    } else if (traffic === 'gult') {
      displayPlan = 'Maintenance';
      if (originalTemplate === 'Maintenance – Strength Touch' || originalTemplate === 'Maintenance – Power Touch') {
        displayTemplate = originalTemplate;
      } else {
        displayTemplate = 'Maintenance – Isometric Bias';
      }
      displayTime = '10–20 mín';
      displayNote = displayNotes.gult;
    } else if (traffic === 'grænt') {
      displayPlan = originalPlan;
      displayTemplate = originalTemplate;
      displayTime = displayTime || day.lota || '';
      displayNote = displayNotes.graent;
    }

    if (originalPlan === 'Anchor' && traffic !== 'grænt') {
      if (traffic === 'rautt') {
        displayPlan = 'Primer';
        displayTemplate = 'Primer – Recovery';
        displayTime = '6–10 mín';
      } else if (traffic === 'gult') {
        displayPlan = 'Maintenance';
        displayTemplate = 'Maintenance – Isometric Bias';
        displayTime = '10–20 mín';
      }
      displayNote = (displayNote ? displayNote + ' ' : '') + 'Anchor sýnt aðeins á grænum degi.';
    }

    // MD+1 override (UI-only)
    if (isMDPlus1(prevSched)) {
      const exposure = exposureOverride || 'low';
      if (exposure === 'high') {
        displayPlan = 'Primer';
        displayTemplate = 'Primer – Recovery';
        displayTime = '6–10 mín';
        exposureNote = 'MD+1 + High exposure: Primer til að vernda endurheimt.';
      } else if (exposure === 'moderate') {
        displayPlan = 'Maintenance';
        if (!(displayTemplate === 'Maintenance – Strength Touch' || displayTemplate === 'Maintenance – Power Touch')) {
          displayTemplate = 'Maintenance – Isometric Bias';
        }
        displayTime = '10–20 mín';
        exposureNote = 'MD+1 + Moderate exposure: Maintenance (lágt magn).';
      } else {
        displayPlan = originalPlan;
        displayTemplate = originalTemplate;
        displayTime = day.minutur || day.lota || displayTime;
        if (originalPlan === 'Anchor' && traffic !== 'grænt') {
          displayPlan = 'Maintenance';
          displayTemplate = 'Maintenance – Isometric Bias';
          displayTime = '10–20 mín';
        }
        exposureNote = 'MD+1 + Low/No exposure: leyfilegt að nýta glugga (maint/anchor eftir residuals).';
      }
    }

    return { plan: displayPlan, template: displayTemplate, time: displayTime, note: displayNote, exposureNote };
  }

  function resetResiduals() {
    if (weekPanel.resStrength) weekPanel.resStrength.value = '';
    if (weekPanel.resPower) weekPanel.resPower.value = '';
    if (weekPanel.resPlyo) weekPanel.resPlyo.value = '';
    clearResidualsStorage();
  }

  function isWeekUITouched() {
    return weekUserTouched;
  }

  function markWeekTouched() {
    weekUserTouched = true;
  }

  function tryAutoLoadLastWeek() {
    const data = loadLastWeekFromStorage();
    if (!data) {
      setLastWeekStatus('Engin síðasta vika vistuð');
      return;
    }
    // Only auto-load if user hefur ekki snert (tómt)
    if (isWeekUITouched()) return;
    applyLastWeekToUI(data);
    setLastWeekStatus('Síðasta vika endurheimt (auto)');
  }

  function handleAthleteChange() {
    updateAthleteHint();
    autofillResidualInputs();
    applyExposurePrefill();
    weekUserTouched = false;
    const data = loadLastWeekFromStorage();
    if (data) {
      setLastWeekStatus(`Síðasta vika til fyrir ${weekPanel.athlete?.value || 'default'}`);
      if (!isWeekUITouched()) applyLastWeekToUI(data);
    } else {
      setLastWeekStatus('Engin síðasta vika vistuð');
    }
  }

  function handleLoadLastWeek() {
    const data = loadLastWeekFromStorage();
    if (!data) {
      setLastWeekStatus('Engin síðasta vika vistuð');
      return;
    }
    applyLastWeekToUI(data);
  }

  function handleClearLastWeek() {
    clearLastWeekStorage();
  }

  function handleExposureChange() {
    if (!weekPanel.exposureSelect) return;
    const val = weekPanel.exposureSelect.value || 'low';
    saveExposureToStorage(val);
  }

  ensureWeekCards();
  updateAthleteHint();
  autofillResidualInputs();
  applyExposurePrefill();
  tryAutoLoadLastWeek();
  if (typeof populateWeekGrid === 'function') {
    populateWeekGrid();
  }
  renderWeekCards();
  dagPanel.btn?.addEventListener('click', runDayPlan);
  weekPanel.run?.addEventListener('click', runWeekPlan);
  weekPanel.resetBtn?.addEventListener('click', resetResiduals);
  weekPanel.athlete?.addEventListener('change', handleAthleteChange);
  weekPanel.athlete?.addEventListener('blur', handleAthleteChange);
  weekPanel.loadLastWeekBtn?.addEventListener('click', handleLoadLastWeek);
  weekPanel.clearLastWeekBtn?.addEventListener('click', handleClearLastWeek);
  weekPanel.exposureSelect?.addEventListener('change', handleExposureChange);
  weekPanel.exposureSelect?.addEventListener('blur', handleExposureChange);
  weekPanel.weekStartInput?.addEventListener('input', markWeekTouched);
  // Mark touches on selects
  dayNames.forEach((_, idx) => {
    document.getElementById(`week-plan-${idx}-schedule`)?.addEventListener('change', markWeekTouched);
    document.getElementById(`week-plan-${idx}-load`)?.addEventListener('change', markWeekTouched);
  });

  // --- CLICK: Vikuplan -> Áherslur dags ---
  (function wireWeekPlanClicks(){
    const weekRoot =
      document.querySelector('#weekCards') ||
      document.querySelector('#weekPlan') ||
      document.querySelector('.week-days-grid') ||
      document.querySelector('[data-week-root]');

    if (!weekRoot) return;

    weekRoot.addEventListener('click', (e) => {
      const card = e.target.closest('.week-day-card,[data-day]');
      if (!card) return;

      const dayKey = card.getAttribute('data-day');
      if (!dayKey) return;

      openDayInFocusPanel(dayKey);
    });
  })();

  window.microdoseUI = { runDayPlan, runWeekPlan, applyDayToPanel };
})();
// ===============================
// IO (Print / Export / Import / Clear) wiring
// ===============================
const MicrodoseIO = (() => {
  const STORAGE_PREFIXES = ['microdose_']; // bættu við ef þú notar fleiri prefixes

  function setStatus(msg, isError = false) {
    const el = document.querySelector('#ioStatus');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b00020' : '';
  }

  function collectStorage() {
    const out = {
      meta: {
        app: 'microdose-ui',
        exportedAt: new Date().toISOString(),
      },
      localStorage: {},
    };

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const ok = STORAGE_PREFIXES.some(p => key.startsWith(p));
      if (!ok) continue;

      out.localStorage[key] = localStorage.getItem(key);
    }
    return out;
  }

  function exportJSON() {
    try {
      const data = collectStorage();
      const json = JSON.stringify(data, null, 2);

      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      a.href = url;
      a.download = `microdose-backup_${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
      setStatus('Export klárað ✅');
    } catch (e) {
      console.error(e);
      setStatus('Export mistókst ❌', true);
    }
  }

  async function importJSON(file) {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed || typeof parsed !== 'object' || !parsed.localStorage) {
        setStatus('Ógilt JSON (vantar localStorage) ❌', true);
        return;
      }

      Object.entries(parsed.localStorage).forEach(([k, v]) => {
        localStorage.setItem(k, v);
      });

      setStatus('Import klárað ✅ (endurnýjaðu síðuna)');
    } catch (e) {
      console.error(e);
      setStatus('Import mistókst ❌', true);
    }
  }

  function clearStorage() {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (STORAGE_PREFIXES.some(p => k.startsWith(p))) keys.push(k);
      }
      keys.forEach(k => localStorage.removeItem(k));
      setStatus(`Hreinsaði ${keys.length} lykla ✅`);
    } catch (e) {
      console.error(e);
      setStatus('Hreinsun mistókst ❌', true);
    }
  }

  function init() {
    const printBtn = document.querySelector('#printWeekBtn');
    const exportBtn = document.querySelector('#exportBtn');
    const importBtn = document.querySelector('#importBtn');
    const importFile = document.querySelector('#importFile');
    const clearBtn = document.querySelector('#clearStorageBtn');

    if (printBtn) printBtn.addEventListener('click', () => window.print());

    if (exportBtn) exportBtn.addEventListener('click', exportJSON);

    if (importBtn && importFile) {
      importBtn.addEventListener('click', () => importFile.click());
      importFile.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await importJSON(file);
        e.target.value = ''; // leyfa sama file aftur
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        const ok = confirm('Viltu hreinsa öll microdose gögn (localStorage)?');
        if (!ok) return;
        clearStorage();
      });
    }
  }

  return { init };
})();
document.addEventListener('DOMContentLoaded', () => {
  MicrodoseIO.init();
});

// ===============================
// GUARDRAILS (warnings in #ioStatus)
// - Warn if 2+ matches ("Leikur") in week
// - Warn if day after match (MD+1) is set to "Æfing"
// - Optional: exposure-aware warning (High exposure -> MD+1 should not be hard)
// ===============================
const MicrodoseGuardrails = (() => {
  // Textar sem við leitum að í valmöguleikum (match / training)
  const MATCH_LABELS = ['Leikur', 'Match', 'Game'];
  const TRAINING_LABELS = ['Æfing', 'Training', 'Practice'];

  // “OK” valmöguleikar fyrir MD+1 (þú getur bætt við hér)
  const MD1_OK_LABELS = [
    'Hvíld', 'Rest',
    'Recovery', 'Endurheimt',
    'Primer', 'Maintenance', 'Anchor'
  ];

  function setIOStatus(lines = [], isError = false) {
    const el = document.querySelector('#ioStatus');
    if (!el) return;

    if (!lines.length) {
      el.textContent = '';
      el.style.color = '';
      return;
    }

    // sýnum sem 1–3 línur, nett
    el.textContent = lines.join('  •  ');
    el.style.color = isError ? '#b00020' : '';
  }

  function textOfSelected(selectEl) {
    if (!selectEl) return '';
    const opt = selectEl.options?.[selectEl.selectedIndex];
    return (opt?.textContent || selectEl.value || '').trim();
  }

  function includesAny(haystack, needles) {
    const h = (haystack || '').toLowerCase();
    return needles.some(n => h.includes(String(n).toLowerCase()));
  }

  function isMatchDay(label) {
    return includesAny(label, MATCH_LABELS);
  }

  function isTrainingDay(label) {
    return includesAny(label, TRAINING_LABELS);
  }

  function isMd1Ok(label) {
    return includesAny(label, MD1_OK_LABELS);
  }

  // Finnur alla “week day type” selecta á síðunni án þess að treysta á nákvæm ID.
  // Við tökum bara selecta sem hafa valmöguleika sem innihalda “Leikur” eða “Æfing”
  function getWeekTypeSelects() {
    const selects = Array.from(document.querySelectorAll('select'));
    const filtered = selects.filter(sel => {
      const optionsText = Array.from(sel.options || []).map(o => o.textContent || '').join(' | ');
      // Teljum þetta sem “week type select” ef hann hefur “Leikur” eða “Æfing” í option texta
      return includesAny(optionsText, MATCH_LABELS) || includesAny(optionsText, TRAINING_LABELS);
    });

    // Röðun eftir DOM-röð (oft mán → sun)
    return filtered;
  }

  // Exposures (ef þú ert með dropdown #exposureSelect)
  function getExposure() {
    const sel = document.querySelector('#exposureSelect');
    if (!sel) return null;
    const v = (sel.value || '').toLowerCase();
    if (v.includes('high')) return 'high';
    if (v.includes('moderate') || v.includes('medium')) return 'moderate';
    if (v.includes('low')) return 'low';
    return null;
  }

  function runChecks() {
    const selects = getWeekTypeSelects();
    if (!selects.length) {
      // ekkert til að validate-a
      setIOStatus([]);
      return;
    }

    const labels = selects.map(textOfSelected);
    const warnings = [];

    // 1) 2+ matches í viku
    const matchIndices = [];
    labels.forEach((lab, i) => {
      if (isMatchDay(lab)) matchIndices.push(i);
    });

    if (matchIndices.length >= 2) {
      warnings.push(`⚠️ ${matchIndices.length}× “Leikur” í viku (athuga recovery/álag)`);
    }

    // 2) MD+1 á “Æfing”
    // Athugum daginn eftir hvern leik (næsti select í DOM-röð)
    matchIndices.forEach(idx => {
      const next = labels[idx + 1];
      if (!next) return;

      if (isTrainingDay(next)) {
        warnings.push('⚠️ MD+1 er stillt sem “Æfing” (mæli með Primer/Maintenance/Recovery)');
      }
    });

    // 3) Exposure-aware: High exposure -> MD+1 ætti ekki að vera “hard training”
    const exposure = getExposure();
    if (exposure === 'high') {
      matchIndices.forEach(idx => {
        const next = labels[idx + 1];
        if (!next) return;

        // Ef MD+1 er hvorki “ok” né “Leikur” (og er t.d. æfing), þá vara við
        const md1Ok = isMd1Ok(next);
        if (!md1Ok && isTrainingDay(next)) {
          warnings.push('⚠️ High exposure: MD+1 ætti helst að vera Primer/Maintenance/Recovery');
        }
      });
    }

    // Sýna í ioStatus
    if (warnings.length) {
      // fyrstu 3 dugir (forðum texta-flóð)
      setIOStatus(warnings.slice(0, 3), true);
    } else {
      setIOStatus(['✅ Engar guardrail-viðvaranir'], false);
    }
  }

  function wire() {
    // Keyra strax
    runChecks();

    // Endurkeyra þegar selectar breytast
    const selects = getWeekTypeSelects();
    selects.forEach(sel => sel.addEventListener('change', runChecks));

    // Ef exposure dropdown er til
    const exposureSel = document.querySelector('#exposureSelect');
    if (exposureSel) exposureSel.addEventListener('change', runChecks);

    // Endurkeyra þegar ýtt er á “Búa til vikuplan” (hvort sem þú ert með einn eða tvo hnappa)
    const genButtons = Array.from(document.querySelectorAll('button'))
      .filter(b => (b.id === 'generateWeekBtn') || (b.textContent || '').toLowerCase().includes('búa til vikuplan'));
    genButtons.forEach(btn => btn.addEventListener('click', () => {
      // smá delay svo UI hafi tíma til að uppfæra áður en við skoðum
      setTimeout(runChecks, 50);
    }));
  }

  return { wire, runChecks };
})();

// Kveikjum á guardrails þegar DOM er tilbúið
document.addEventListener('DOMContentLoaded', () => {
  MicrodoseGuardrails.wire();
});
// ===============================
// IO STATUS (color-coded)
// levels: ok | warn | error
// ===============================
const IOStatus = (() => {
  const LEVEL_CLASS = {
    ok: 'io-ok',
    warn: 'io-warn',
    error: 'io-error',
  };

  function ensureStyle() {
    if (document.getElementById('ioStatusStyle')) return;
    const style = document.createElement('style');
    style.id = 'ioStatusStyle';
    style.textContent = `
      #ioStatus{
        margin-top: 8px;
        padding: 8px 10px;
        border-radius: 10px;
        font-size: 13px;
        line-height: 1.25;
        opacity: 0.95;
        display: inline-block;
        max-width: 100%;
      }
      #ioStatus:empty{ display:none; }

      #ioStatus.io-ok{
        background: rgba(46, 204, 113, 0.12);
        border: 1px solid rgba(46, 204, 113, 0.35);
        color: rgba(46, 204, 113, 0.95);
      }
      #ioStatus.io-warn{
        background: rgba(241, 196, 15, 0.12);
        border: 1px solid rgba(241, 196, 15, 0.35);
        color: rgba(241, 196, 15, 0.95);
      }
      #ioStatus.io-error{
        background: rgba(231, 76, 60, 0.12);
        border: 1px solid rgba(231, 76, 60, 0.35);
        color: rgba(231, 76, 60, 0.95);
      }
    `;
    document.head.appendChild(style);
  }

  function set(msg, level = 'ok') {
    ensureStyle();
    const el = document.querySelector('#ioStatus');
    if (!el) return;

    // hreinsa fyrri class
    el.classList.remove('io-ok', 'io-warn', 'io-error');

    if (!msg) {
      el.textContent = '';
      return;
    }

    const cls = LEVEL_CLASS[level] || LEVEL_CLASS.ok;
    el.classList.add(cls);
    el.textContent = msg;
  }

  function setList(lines = [], level = 'ok') {
    if (!lines || !lines.length) {
      set('', 'ok');
      return;
    }
    // Nett format: 1–3 línur með •
    set(lines.join('  •  '), level);
  }

  return { set, setList };
})();

document.addEventListener('DOMContentLoaded', () => {
  // Default message (má sleppa ef þú vilt ekki)
  // IOStatus.set('✅ Tilbúið', 'ok');
});
// ===============================
// DEDUPE: "Búa til vikuplan" buttons
// - keeps one as primary
// - converts others into proxies (renamed to "Uppfæra vikuplan")
// ===============================
function dedupeWeekPlanButtons() {
  const normalize = (s) => (s || '').trim().toLowerCase();

  const weekBtns = Array.from(document.querySelectorAll('button'))
    .filter(b => normalize(b.textContent) === 'búa til vikuplan');

  if (weekBtns.length <= 1) return;

  // Primary: prefer #generateWeekBtn if it exists, else first match
  let primary = document.querySelector('#generateWeekBtn');
  if (!primary) {
    primary = weekBtns[0];
    primary.id = 'generateWeekBtn'; // gefum honum id svo annað kóða-vírun virki alltaf
  }

  weekBtns.forEach(btn => {
    if (btn === primary) return;

    // Gerum hinn að "proxy" í stað þess að hafa tvo sem gera sitt hvoru megin
    btn.textContent = 'Uppfæra vikuplan';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      primary.click();
    }, { passive: false });
  });

  // (valfrjálst) sýna info
  if (typeof IOStatus !== 'undefined') {
    IOStatus.set('ℹ️ Sameinaði tvö “Búa til vikuplan” í einn primary hnapp', 'ok');
  }
}

document.addEventListener('DOMContentLoaded', dedupeWeekPlanButtons);
// =======================================================
// B) Guardrails -> Print + Export JSON + CSV export
// (safe patch: no need to edit existing code)
// =======================================================
(function GuardrailsExportPrintCSV() {
  // ---------- helpers ----------
  const $ = (sel) => document.querySelector(sel);

  function getIOText() {
    const el = $('#ioStatus');
    return (el && el.textContent) ? el.textContent.trim() : '';
  }

  // Reuse guardrails if we can (preferred), otherwise fallback to ioStatus text
  function getWarningsList() {
    // If your guardrails module exposes something, use it.
    // Otherwise, we treat ioStatus content as a single warning line.
    const txt = getIOText();
    if (!txt) return [];
    // split on "•" if used
    const parts = txt.split('•').map(s => s.trim()).filter(Boolean);
    return parts.length ? parts : [txt];
  }

  function escapeCSV(val) {
    const s = String(val ?? '');
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  function downloadText(filename, content, mime = 'text/plain') {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // ---------- 1) PRINT: inject warnings into a printable box ----------
  function ensurePrintBox() {
    let box = document.getElementById('printGuardrailsBox');
    if (box) return box;

    box = document.createElement('div');
    box.id = 'printGuardrailsBox';
    box.style.margin = '10px 0 12px 0';
    box.style.padding = '10px 12px';
    box.style.borderRadius = '12px';
    box.style.border = '1px solid rgba(255,255,255,0.15)';
    box.style.background = 'rgba(0,0,0,0.15)';
    box.style.fontSize = '13px';
    box.style.lineHeight = '1.35';

    // Place it right above the actions button row if possible
    const actions = document.querySelector('.actions');
    if (actions && actions.parentElement) {
      actions.parentElement.insertBefore(box, actions);
    } else {
      // fallback: add near top of body
      document.body.insertBefore(box, document.body.firstChild);
    }

    // Print-only CSS
    if (!document.getElementById('printGuardrailsStyle')) {
      const style = document.createElement('style');
      style.id = 'printGuardrailsStyle';
      style.textContent = `
        @media print {
          #printGuardrailsBox { display:block !important; }
        }
        @media screen {
          #printGuardrailsBox { display:none; }
        }
      `;
      document.head.appendChild(style);
    }

    return box;
  }

  function updatePrintBox() {
    const warnings = getWarningsList();
    const box = ensurePrintBox();

    if (!warnings.length) {
      box.textContent = '✅ Engar viðvaranir (guardrails)';
      return;
    }

    // simple formatting
    box.innerHTML = `
      <strong>⚠️ Viðvaranir (guardrails):</strong>
      <ul style="margin:6px 0 0 18px; padding:0;">
        ${warnings.map(w => `<li>${w}</li>`).join('')}
      </ul>
    `;
  }

  // Hook into print button so we refresh just before printing
  function patchPrintButton() {
    const printBtn = $('#printWeekBtn');
    if (!printBtn || printBtn.__guardrails_patched) return;
    printBtn.__guardrails_patched = true;

    printBtn.addEventListener('click', () => {
      updatePrintBox();
      // window.print() is already wired elsewhere – we just ensure content is ready
    }, { capture: true });
  }

  // ---------- 2) EXPORT JSON: add warnings into exported payload ----------
  // We patch the export button click to do a "custom export" including warnings.
  function patchExportButton() {
    const exportBtn = $('#exportBtn');
    if (!exportBtn || exportBtn.__guardrails_patched) return;
    exportBtn.__guardrails_patched = true;

    exportBtn.addEventListener('click', (e) => {
      // stop other handlers so we control the exported file
      e.preventDefault();
      e.stopImmediatePropagation();

      try {
        // Collect microdose_* keys
        const data = {
          meta: {
            app: 'microdose-ui',
            exportedAt: new Date().toISOString(),
          },
          warnings: getWarningsList(),
          localStorage: {},
        };

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key) continue;
          if (!key.startsWith('microdose_')) continue;
          data.localStorage[key] = localStorage.getItem(key);
        }

        const json = JSON.stringify(data, null, 2);
        const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        downloadText(`microdose-backup_${stamp}.json`, json, 'application/json');

        if (typeof IOStatus !== 'undefined') {
          IOStatus.set('Export klárað ✅ (með guardrails)', 'io-ok');
        }
      } catch (err) {
        console.error(err);
        if (typeof IOStatus !== 'undefined') {
          IOStatus.set('Export mistókst ❌', 'io-error');
        }
      }
    }, { capture: true });
  }

  // ---------- 3) CSV export: add a new button + export table ----------
  function addCSVButton() {
    const actions = document.querySelector('.actions');
    if (!actions) return;

    if (document.getElementById('exportCsvBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'exportCsvBtn';
    btn.type = 'button';
    btn.textContent = 'Export CSV';
    actions.appendChild(btn);

    btn.addEventListener('click', () => {
      try {
        // Best effort: collect current "week type" selections in DOM order
        const selects = Array.from(document.querySelectorAll('select'));
        // filter likely week-day type selects (those that include Leikur/Æfing in options)
        const weekSelects = selects.filter(sel => {
          const optText = Array.from(sel.options || []).map(o => o.textContent || '').join(' | ');
          return optText.includes('Leikur') || optText.includes('Æfing');
        });

        const warnings = getWarningsList().join(' | ');

        // Header
        const rows = [];
        rows.push(['Index', 'Val (dagategund)', 'Warnings']);

        weekSelects.forEach((sel, idx) => {
          const val = sel.options?.[sel.selectedIndex]?.textContent || sel.value || '';
          rows.push([String(idx + 1), val.trim(), warnings]);
        });

        // If we didn't find weekSelects, still export warnings only
        if (!weekSelects.length) {
          rows.length = 0;
          rows.push(['Warnings']);
          getWarningsList().forEach(w => rows.push([w]));
        }

        const csv = rows
          .map(r => r.map(escapeCSV).join(','))
          .join('\n');

        const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        downloadText(`microdose-week_${stamp}.csv`, csv, 'text/csv');

        if (typeof IOStatus !== 'undefined') {
          IOStatus.set('CSV export klárað ✅', 'io-ok');
        }
      } catch (err) {
        console.error(err);
        if (typeof IOStatus !== 'undefined') {
          IOStatus.set('CSV export mistókst ❌', 'io-error');
        }
      }
    });
  }

  // ---------- init ----------
  document.addEventListener('DOMContentLoaded', () => {
    patchPrintButton();
    patchExportButton();
    addCSVButton();

    // Update print box whenever ioStatus changes via user actions (lightweight: on clicks)
    const actions = document.querySelector('.actions');
    if (actions) {
      actions.addEventListener('click', () => {
        // Keep print content fresh for next print
        updatePrintBox();
      });
    }
  });
})();
// =======================================================
// Fine-tune guardrails severity: warn vs error
// Rules (you can tweak):
// - WARN: MD+1 = "Æfing"
// - WARN: 2+ "Leikur" in week
// - ERROR: 2+ "Leikur" AND any MD+1 = "Æfing"
// - ERROR: Exposure = High AND any MD+1 = "Æfing"
// =======================================================
(function MicrodoseGuardrailsSeverity() {
  const MATCH_WORDS = ['Leikur', 'Match', 'Game'];
  const TRAIN_WORDS = ['Æfing', 'Training', 'Practice'];

  function norm(s) { return (s || '').toString().trim().toLowerCase(); }
  function includesAny(label, list) {
    const h = norm(label);
    return list.some(x => h.includes(norm(x)));
  }

  function getSelectedText(sel) {
    if (!sel) return '';
    const opt = sel.options?.[sel.selectedIndex];
    return (opt?.textContent || sel.value || '').trim();
  }

  function getWeekTypeSelects() {
    const selects = Array.from(document.querySelectorAll('select'));
    return selects.filter(sel => {
      const optionsText = Array.from(sel.options || [])
        .map(o => o.textContent || '')
        .join(' | ');
      return includesAny(optionsText, MATCH_WORDS) || includesAny(optionsText, TRAIN_WORDS);
    });
  }

  function getExposureLevel() {
    const sel = document.querySelector('#exposureSelect');
    if (!sel) return null;
    const v = norm(sel.value);
    if (v.includes('high')) return 'high';
    if (v.includes('moderate') || v.includes('medium')) return 'moderate';
    if (v.includes('low')) return 'low';
    return null;
  }

  // Works with your existing CSS classes: io-ok / io-warn / io-error
  function setIO(lines, level) {
    const el = document.querySelector('#ioStatus');
    if (!el) return;

    el.classList.remove('io-ok', 'io-warn', 'io-error');

    if (!lines || !lines.length) {
      el.textContent = '';
      return;
    }

    const cls = level === 'error' ? 'io-error' : level === 'warn' ? 'io-warn' : 'io-ok';
    el.classList.add(cls);
    el.textContent = lines.join('  •  ');

    // Also store for export/print if you want later
    window.__microdoseWarnings = { level, lines };
  }

  function evaluate() {
    const selects = getWeekTypeSelects();
    if (!selects.length) return;

    const labels = selects.map(getSelectedText);

    const matchIdx = [];
    labels.forEach((lab, i) => { if (includesAny(lab, MATCH_WORDS)) matchIdx.push(i); });

    const md1TrainingHits = [];
    matchIdx.forEach(i => {
      const next = labels[i + 1];
      if (!next) return;
      if (includesAny(next, TRAIN_WORDS)) md1TrainingHits.push(i);
    });

    const matchCount = matchIdx.length;
    const md1Training = md1TrainingHits.length > 0;

    const exposure = getExposureLevel();

    const lines = [];
    let level = 'ok';

    // Build messages
    if (matchCount >= 2) {
      lines.push(`⚠️ ${matchCount}× “Leikur” í viku`);
    }
    if (md1Training) {
      lines.push('⚠️ MD+1 er stillt sem “Æfing” (mælt með Primer/Maintenance/Recovery)');
    }
    if (exposure === 'high' && md1Training) {
      lines.push('🚨 High exposure + MD+1 “Æfing” (mælt með að létta daginn)');
    }
    if (matchCount >= 2 && md1Training) {
      lines.push('🚨 2× Leikur + MD+1 “Æfing” (mjög líklegt að vera of mikið)');
    }

    // Decide severity
    if ((matchCount >= 2 && md1Training) || (exposure === 'high' && md1Training)) {
      level = 'error';
    } else if (matchCount >= 2 || md1Training) {
      level = 'warn';
    } else {
      level = 'ok';
      lines.push('✅ Engar guardrail-viðvaranir');
    }

    setIO(lines.slice(0, 4), level);
  }

  function wire() {
    evaluate();

    // re-evaluate on changes
    getWeekTypeSelects().forEach(sel => sel.addEventListener('change', evaluate));

    const exp = document.querySelector('#exposureSelect');
    if (exp) exp.addEventListener('change', evaluate);

    // after generating week plan
    const gen = document.querySelector('#generateWeekBtn');
    if (gen) gen.addEventListener('click', () => setTimeout(evaluate, 50));
  }

  document.addEventListener('DOMContentLoaded', wire);
})();
// =======================================================
// CLICK-TO-FIX: "Laga MD+1" (auto-fix based on exposure)
// - Shows a fix button when MD+1 is set to "Æfing" after "Leikur"
// - On click: sets MD+1 to Primer/Maintenance/Anchor (best available option)
// =======================================================
(function MicrodoseClickToFix() {
  const MATCH_WORDS = ['Leikur', 'Match', 'Game'];
  const TRAIN_WORDS = ['Æfing', 'Training', 'Practice'];

  const FIX_TARGETS = {
    high: ['Primer', 'Recovery', 'Endurheimt', 'Hvíld', 'Rest', 'Maintenance'],
    moderate: ['Maintenance', 'Primer', 'Recovery', 'Endurheimt'],
    low: ['Anchor', 'Maintenance', 'Primer'],
    fallback: ['Maintenance', 'Primer', 'Recovery', 'Endurheimt', 'Anchor'],
  };

  const $ = (sel) => document.querySelector(sel);
  const norm = (s) => (s || '').toString().trim().toLowerCase();
  const includesAny = (txt, list) => {
    const t = norm(txt);
    return list.some(w => t.includes(norm(w)));
  };

  function getSelectedText(sel) {
    const opt = sel?.options?.[sel.selectedIndex];
    return (opt?.textContent || sel?.value || '').trim();
  }

  function getWeekTypeSelects() {
    const selects = Array.from(document.querySelectorAll('select'));
    return selects.filter(sel => {
      const optionsText = Array.from(sel.options || []).map(o => o.textContent || '').join(' | ');
      return includesAny(optionsText, MATCH_WORDS) || includesAny(optionsText, TRAIN_WORDS);
    });
  }

  function getExposureLevel() {
    const sel = $('#exposureSelect');
    if (!sel) return null;
    const v = norm(sel.value);
    if (v.includes('high')) return 'high';
    if (v.includes('moderate') || v.includes('medium')) return 'moderate';
    if (v.includes('low')) return 'low';
    return null;
  }

  function findOptionIndexByKeywords(selectEl, keywords) {
    const opts = Array.from(selectEl.options || []);
    for (const key of keywords) {
      const k = norm(key);
      const idx = opts.findIndex(o => norm(o.textContent).includes(k));
      if (idx >= 0) return idx;
    }
    return -1;
  }

  function setSelectToBest(selectEl, preferenceList) {
    if (!selectEl) return { ok: false, reason: 'missing select' };

    // 1) Try preferred list
    let idx = findOptionIndexByKeywords(selectEl, preferenceList);
    // 2) Fallback list
    if (idx < 0) idx = findOptionIndexByKeywords(selectEl, FIX_TARGETS.fallback);

    if (idx < 0) return { ok: false, reason: 'no matching option' };

    selectEl.selectedIndex = idx;
    // Trigger change so guardrails/UI update
    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
    return { ok: true, value: getSelectedText(selectEl) };
  }

  function scanMd1Training() {
    const selects = getWeekTypeSelects();
    const labels = selects.map(getSelectedText);
    const hits = []; // { matchIndex, md1Index, md1Label }

    labels.forEach((lab, i) => {
      if (!includesAny(lab, MATCH_WORDS)) return;
      const nextSel = selects[i + 1];
      if (!nextSel) return;
      const nextLab = labels[i + 1] || getSelectedText(nextSel);
      if (includesAny(nextLab, TRAIN_WORDS)) {
        hits.push({ matchIndex: i, md1Index: i + 1, md1Label: nextLab });
      }
    });

    return { selects, labels, hits };
  }

  // ---------- UI: Fix button next to ioStatus ----------
  function ensureFixUI() {
    let wrap = document.getElementById('mdFixWrap');
    if (wrap) return wrap;

    wrap = document.createElement('div');
    wrap.id = 'mdFixWrap';
    wrap.style.display = 'flex';
    wrap.style.gap = '8px';
    wrap.style.alignItems = 'center';
    wrap.style.marginTop = '8px';

    const btn = document.createElement('button');
    btn.id = 'mdFixBtn';
    btn.type = 'button';
    btn.textContent = 'Laga MD+1';
    btn.style.padding = '8px 12px';
    btn.style.borderRadius = '10px';
    btn.style.border = '1px solid rgba(255,255,255,0.16)';
    btn.style.background = 'rgba(255,255,255,0.08)';
    btn.style.color = 'inherit';
    btn.style.cursor = 'pointer';

    const hint = document.createElement('span');
    hint.id = 'mdFixHint';
    hint.style.opacity = '0.85';
    hint.style.fontSize = '12px';

    wrap.appendChild(btn);
    wrap.appendChild(hint);

    // Place directly after ioStatus if possible, else after actions
    const io = $('#ioStatus');
    if (io && io.parentElement) {
      io.parentElement.insertBefore(wrap, io.nextSibling);
    } else {
      const actions = document.querySelector('.actions');
      if (actions && actions.parentElement) actions.parentElement.appendChild(wrap);
      else document.body.appendChild(wrap);
    }

    return wrap;
  }

  function setFixVisible(isVisible, hintText = '') {
    const wrap = ensureFixUI();
    const btn = $('#mdFixBtn');
    const hint = $('#mdFixHint');

    wrap.style.display = isVisible ? 'flex' : 'none';
    if (hint) hint.textContent = hintText || '';
    if (btn) btn.disabled = !isVisible;
  }

  function setStatusMessage(msg, level /* 'io-ok'|'io-warn'|'io-error' */) {
    // Use your existing IOStatus if available, otherwise write plain to #ioStatus
    if (typeof IOStatus !== 'undefined' && IOStatus.set) {
      // Your current implementation seems to use css classes: io-ok/io-warn/io-error
      IOStatus.set(msg, level || 'io-ok');
      return;
    }
    const el = $('#ioStatus');
    if (!el) return;
    el.textContent = msg;
  }

  // ---------- Action: fix ----------
  function fixMd1() {
    const { selects, hits } = scanMd1Training();
    if (!hits.length) {
      setStatusMessage('✅ Engin MD+1 “Æfing” sem þarf að laga', 'io-ok');
      setFixVisible(false);
      return;
    }

    const exposure = getExposureLevel() || 'moderate';
    const pref = FIX_TARGETS[exposure] || FIX_TARGETS.moderate;

    let fixedCount = 0;
    const results = [];

    hits.forEach(h => {
      const md1Sel = selects[h.md1Index];
      const before = getSelectedText(md1Sel);
      const r = setSelectToBest(md1Sel, pref);
      if (r.ok) {
        fixedCount += 1;
        results.push(`${before} → ${r.value}`);
      }
    });

    if (fixedCount > 0) {
      setStatusMessage(`✅ Lagaði MD+1 (${fixedCount}): ${results.slice(0, 2).join(' | ')}`, 'io-ok');
    } else {
      setStatusMessage('❌ Gat ekki lagað MD+1 (fann ekki Primer/Maintenance/Recovery í valmöguleikum)', 'io-error');
    }

    // Re-scan and update visibility after change
    setTimeout(updateFixVisibility, 50);
  }

  // ---------- When to show button ----------
  function updateFixVisibility() {
    const { hits } = scanMd1Training();
    if (!hits.length) {
      setFixVisible(false);
      return;
    }

    const exposure = getExposureLevel();
    const hint =
      exposure === 'high'
        ? 'High exposure: setur MD+1 í Primer/Recovery'
        : exposure === 'low'
          ? 'Low exposure: setur MD+1 í Anchor/Maintenance'
          : 'Moderate: setur MD+1 í Maintenance';

    setFixVisible(true, hint);
  }

  function wire() {
    ensureFixUI();
    setFixVisible(false);

    // Wire click
    const btn = $('#mdFixBtn');
    if (btn && !btn.__wired) {
      btn.__wired = true;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        fixMd1();
      });
    }

    // Update visibility on dropdown changes
    getWeekTypeSelects().forEach(sel => sel.addEventListener('change', updateFixVisibility));

    const exp = $('#exposureSelect');
    if (exp) exp.addEventListener('change', updateFixVisibility);

    const gen = $('#generateWeekBtn');
    if (gen) gen.addEventListener('click', () => setTimeout(updateFixVisibility, 50));

    // initial
    updateFixVisibility();
  }

  document.addEventListener('DOMContentLoaded', wire);
})();
// =======================================================
// UPGRADE: Make "Laga MD+1" always fix the correct MD+1 select
// and auto-refresh guardrails + ioStatus after fixing.
// =======================================================
(function UpgradeMd1Fix() {
  const MATCH_WORDS = ['Leikur', 'Match', 'Game'];
  const TRAIN_WORDS = ['Æfing', 'Training', 'Practice'];

  const FIX_TARGETS = {
    high: ['Primer', 'Recovery', 'Endurheimt', 'Hvíld', 'Rest', 'Maintenance'],
    moderate: ['Maintenance', 'Primer', 'Recovery', 'Endurheimt'],
    low: ['Anchor', 'Maintenance', 'Primer'],
    fallback: ['Maintenance', 'Primer', 'Recovery', 'Endurheimt', 'Anchor'],
  };

  const $ = (sel) => document.querySelector(sel);
  const norm = (s) => (s || '').toString().trim().toLowerCase();
  const includesAny = (txt, list) => {
    const t = norm(txt);
    return list.some(w => t.includes(norm(w)));
  };
  const selectedText = (sel) => (sel?.options?.[sel.selectedIndex]?.textContent || sel?.value || '').trim();

  function weekTypeSelects() {
    const selects = Array.from(document.querySelectorAll('select'));
    return selects.filter(sel => {
      const optionsText = Array.from(sel.options || []).map(o => o.textContent || '').join(' | ');
      return includesAny(optionsText, MATCH_WORDS) || includesAny(optionsText, TRAIN_WORDS);
    });
  }

  function exposureLevel() {
    const sel = $('#exposureSelect');
    if (!sel) return 'moderate';
    const v = norm(sel.value);
    if (v.includes('high')) return 'high';
    if (v.includes('moderate') || v.includes('medium')) return 'moderate';
    if (v.includes('low')) return 'low';
    return 'moderate';
  }

  function optionIndexByKeywords(selectEl, keywords) {
    const opts = Array.from(selectEl.options || []);
    for (const key of keywords) {
      const k = norm(key);
      const idx = opts.findIndex(o => norm(o.textContent).includes(k));
      if (idx >= 0) return idx;
    }
    return -1;
  }

  function setSelectBest(selectEl, prefList) {
    let idx = optionIndexByKeywords(selectEl, prefList);
    if (idx < 0) idx = optionIndexByKeywords(selectEl, FIX_TARGETS.fallback);
    if (idx < 0) return { ok: false };

    selectEl.selectedIndex = idx;
    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
    return { ok: true, value: selectedText(selectEl) };
  }

  function setIO(msg, level) {
    if (typeof IOStatus !== 'undefined' && IOStatus.set) {
      IOStatus.set(msg, level || 'io-ok');
      return;
    }
    const el = $('#ioStatus');
    if (el) el.textContent = msg;
  }

  function refreshGuardrails() {
    // If you have a guardrails module, run it
    if (window.MicrodoseGuardrails && typeof window.MicrodoseGuardrails.runChecks === 'function') {
      window.MicrodoseGuardrails.runChecks();
      return;
    }
    // Otherwise do nothing (ioStatus will be set by other logic)
  }

  function fixMd1Now() {
    const selects = weekTypeSelects();
    const labels = selects.map(selectedText);

    // find all match days
    const matchIdx = [];
    labels.forEach((lab, i) => { if (includesAny(lab, MATCH_WORDS)) matchIdx.push(i); });

    // find MD+1 that are training
    const md1FixTargets = [];
    matchIdx.forEach(i => {
      const md1Sel = selects[i + 1];
      if (!md1Sel) return;
      const md1Lab = labels[i + 1] || selectedText(md1Sel);
      if (includesAny(md1Lab, TRAIN_WORDS)) {
        md1FixTargets.push({ index: i + 1, before: md1Lab, sel: md1Sel });
      }
    });

    if (!md1FixTargets.length) {
      setIO('✅ Engin MD+1 “Æfing” sem þarf að laga', 'io-ok');
      refreshGuardrails();
      return;
    }

    const exp = exposureLevel();
    const pref = FIX_TARGETS[exp] || FIX_TARGETS.moderate;

    let fixed = 0;
    const changes = [];

    md1FixTargets.forEach(t => {
      const res = setSelectBest(t.sel, pref);
      if (res.ok) {
        fixed += 1;
        changes.push(`${t.before} → ${res.value}`);
      }
    });

    if (fixed) {
      setIO(`✅ Lagaði MD+1 (${fixed}): ${changes.slice(0, 2).join(' | ')}`, 'io-ok');
    } else {
      setIO('❌ Gat ekki lagað MD+1 (fann ekki Primer/Maintenance/Anchor í valmöguleikum)', 'io-error');
    }

    // Re-run guardrails after the DOM has updated
    setTimeout(refreshGuardrails, 50);
  }

  function wire() {
    const btn = $('#mdFixBtn') || Array.from(document.querySelectorAll('button')).find(b => norm(b.textContent) === 'laga md+1');
    if (!btn) return;

    // Ensure our handler runs (and prevents duplicates)
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      fixMd1Now();
    }, { capture: true });
  }

  document.addEventListener('DOMContentLoaded', wire);
})();
// =======================================================
// CLICK-TO-FIX (UI-aligned):
// If MD+1 after "Leikur" is "Æfing" -> set to "Frí"
// =======================================================
(function FixMd1ToRest() {
  const MATCH = 'leikur';
  const TRAIN = 'æfing';
  const REST = 'frí';

  const norm = (s) => (s || '').toString().trim().toLowerCase();
  const getText = (sel) =>
    sel?.options?.[sel.selectedIndex]?.textContent?.trim() || '';

  function getDayTypeSelects() {
    return Array.from(document.querySelectorAll('select')).filter(sel => {
      const opts = Array.from(sel.options || []).map(o => norm(o.textContent));
      return opts.includes(MATCH) && opts.includes(TRAIN);
    });
  }

  function setSelectTo(selectEl, targetText) {
    const opts = Array.from(selectEl.options || []);
    const idx = opts.findIndex(o => norm(o.textContent) === targetText);
    if (idx < 0) return false;
    selectEl.selectedIndex = idx;
    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  function fix() {
    const selects = getDayTypeSelects();
    const labels = selects.map(getText);

    let fixed = 0;

    labels.forEach((lab, i) => {
      if (norm(lab) === MATCH) {
        const md1 = selects[i + 1];
        if (!md1) return;
        if (norm(getText(md1)) === TRAIN) {
          if (setSelectTo(md1, REST)) fixed += 1;
        }
      }
    });

    if (fixed > 0) {
      if (window.IOStatus?.set) {
        IOStatus.set(`✅ Lagaði MD+1 (${fixed}) → sett í „Frí“`, 'io-ok');
      }
    } else {
      if (window.IOStatus?.set) {
        IOStatus.set('ℹ️ Engin MD+1 „Æfing“ fannst til að laga', 'io-warn');
      }
    }
  }

  function wire() {
    const btn = document.getElementById('mdFixBtn')
      || Array.from(document.querySelectorAll('button'))
          .find(b => norm(b.textContent) === 'laga md+1');

    if (!btn) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      fix();
    });
  }

  document.addEventListener('DOMContentLoaded', wire);
})();
// =======================================================
// A) Click-to-fix: MD+1 after "Leikur" -> "Frí" + Álag -> "Lágt"
// Works with your UI taxonomy: Dagskrá = (Æfing/Leikur/Frí) and Álag = (Lágt/Miðlungs/Hátt)
// =======================================================
(function FixMd1ToRestAndLowLoad() {
  const MATCH = 'leikur';
  const TRAIN = 'æfing';
  const REST  = 'frí';

  const LOAD_LOW  = 'lágt';
  const LOAD_MID  = 'miðlungs';
  const LOAD_HIGH = 'hátt';

  const norm = (s) => (s || '').toString().trim().toLowerCase();
  const getText = (sel) => sel?.options?.[sel.selectedIndex]?.textContent?.trim() || '';

  function isDayTypeSelect(sel) {
    const opts = Array.from(sel.options || []).map(o => norm(o.textContent));
    return opts.includes(MATCH) && opts.includes(TRAIN); // indicates Dagskrá select
  }

  function isLoadSelect(sel) {
    const opts = Array.from(sel.options || []).map(o => norm(o.textContent));
    return opts.includes(LOAD_LOW) && (opts.includes(LOAD_MID) || opts.includes(LOAD_HIGH));
  }

  function setSelectExact(selectEl, exactLowerText) {
    const opts = Array.from(selectEl.options || []);
    const idx = opts.findIndex(o => norm(o.textContent) === exactLowerText);
    if (idx < 0) return false;
    selectEl.selectedIndex = idx;
    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  // We assume each day column has two selects in DOM order: Dagskrá (day type) then Álag (load)
  function getDayColumns() {
    const all = Array.from(document.querySelectorAll('select'));
    const dayTypeSelects = all.filter(isDayTypeSelect);

    // For each dayType select, try to find the nearest load select AFTER it
    const columns = dayTypeSelects.map(dt => {
      // scan forward a little for the first load select
      const idx = all.indexOf(dt);
      let loadSel = null;
      for (let i = idx + 1; i < Math.min(all.length, idx + 6); i++) {
        if (isLoadSelect(all[i])) { loadSel = all[i]; break; }
        // stop if we hit another dayType select (next day)
        if (isDayTypeSelect(all[i])) break;
      }
      return { dayType: dt, load: loadSel };
    });

    return columns;
  }

  function fix() {
    const cols = getDayColumns();
    const labels = cols.map(c => getText(c.dayType));

    let fixed = 0;
    let lowLoadSet = 0;

    labels.forEach((lab, i) => {
      if (norm(lab) === MATCH) {
        const md1 = cols[i + 1];
        if (!md1) return;

        const md1Type = norm(getText(md1.dayType));
        if (md1Type === TRAIN) {
          const okRest = setSelectExact(md1.dayType, REST);
          if (okRest) fixed += 1;

          if (md1.load) {
            const okLow = setSelectExact(md1.load, LOAD_LOW);
            if (okLow) lowLoadSet += 1;
          }
        }
      }
    });

    if (window.IOStatus?.set) {
      if (fixed > 0) {
        const extra = (lowLoadSet > 0) ? ` + Álag → „Lágt“ (${lowLoadSet})` : '';
        IOStatus.set(`✅ Lagaði MD+1 (${fixed}) → „Frí“${extra}`, 'io-ok');
      } else {
        IOStatus.set('ℹ️ Engin MD+1 „Æfing“ fannst til að laga', 'io-warn');
      }
    }
  }

  function wire() {
    const btn = document.getElementById('mdFixBtn')
      || Array.from(document.querySelectorAll('button')).find(b => norm(b.textContent) === 'laga md+1');

    if (!btn) return;

    // Avoid stacking multiple handlers if pasted more than once
    if (btn.__mdFixLowLoadWired) return;
    btn.__mdFixLowLoadWired = true;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      fix();
      // If you have guardrails module, refresh it
      if (window.MicrodoseGuardrails?.runChecks) setTimeout(() => MicrodoseGuardrails.runChecks(), 50);
    });
  }

  document.addEventListener('DOMContentLoaded', wire);
})();
// =======================================================
// ONE-CLICK: "Laga ALLT" (week safety fix)
// - For every "Leikur": if MD+1 is "Æfing" -> set to "Frí" + Load "Lágt"
// - Gives summary + severity
// =======================================================
(function AddFixAllButton() {
  const MATCH = 'leikur';
  const TRAIN = 'æfing';
  const REST  = 'frí';

  const LOAD_LOW  = 'lágt';
  const LOAD_MID  = 'miðlungs';
  const LOAD_HIGH = 'hátt';

  const norm = (s) => (s || '').toString().trim().toLowerCase();
  const getText = (sel) => sel?.options?.[sel.selectedIndex]?.textContent?.trim() || '';

  function isDayTypeSelect(sel) {
    const opts = Array.from(sel.options || []).map(o => norm(o.textContent));
    return opts.includes(MATCH) && opts.includes(TRAIN); // Dagskrá select
  }

  function isLoadSelect(sel) {
    const opts = Array.from(sel.options || []).map(o => norm(o.textContent));
    return opts.includes(LOAD_LOW) && (opts.includes(LOAD_MID) || opts.includes(LOAD_HIGH));
  }

  function setSelectExact(selectEl, exactLowerText) {
    const opts = Array.from(selectEl.options || []);
    const idx = opts.findIndex(o => norm(o.textContent) === exactLowerText);
    if (idx < 0) return false;
    selectEl.selectedIndex = idx;
    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  // Build day "columns" = {dayType, load} by scanning DOM order
  function getDayColumns() {
    const all = Array.from(document.querySelectorAll('select'));
    const dayTypeSelects = all.filter(isDayTypeSelect);

    const columns = dayTypeSelects.map(dt => {
      const idx = all.indexOf(dt);
      let loadSel = null;

      for (let i = idx + 1; i < Math.min(all.length, idx + 6); i++) {
        if (isLoadSelect(all[i])) { loadSel = all[i]; break; }
        if (isDayTypeSelect(all[i])) break; // next day starts
      }

      return { dayType: dt, load: loadSel };
    });

    return columns;
  }

  function setIO(msg, level /* io-ok/io-warn/io-error */) {
    if (window.IOStatus?.set) return IOStatus.set(msg, level);
    const el = document.querySelector('#ioStatus');
    if (!el) return;
    el.textContent = msg;
  }

  function fixAll() {
    const cols = getDayColumns();
    const types = cols.map(c => norm(getText(c.dayType)));

    const matchIdx = [];
    types.forEach((t, i) => { if (t === MATCH) matchIdx.push(i); });

    let md1Fixed = 0;
    let lowLoadSet = 0;
    const changes = [];

    matchIdx.forEach(i => {
      const md1 = cols[i + 1];
      if (!md1) return;

      const md1Type = norm(getText(md1.dayType));
      if (md1Type === TRAIN) {
        const beforeType = getText(md1.dayType).trim();
        const beforeLoad = md1.load ? getText(md1.load).trim() : '';

        const okRest = setSelectExact(md1.dayType, REST);
        if (okRest) {
          md1Fixed += 1;
          let loadChanged = false;

          if (md1.load) {
            const okLow = setSelectExact(md1.load, LOAD_LOW);
            if (okLow) {
              lowLoadSet += 1;
              loadChanged = true;
            }
          }

          changes.push(
            `MD+1: ${beforeType}→Frí` + (loadChanged ? `, Álag: ${beforeLoad || '—'}→Lágt` : '')
          );
        }
      }
    });

    // Severity logic
    // - error if 2+ matches AND at least one md1 was training (safety red flag)
    // - warn if any md1Fixed > 0
    // - ok otherwise
    let level = 'io-ok';
    if (matchIdx.length >= 2 && md1Fixed > 0) level = 'io-error';
    else if (md1Fixed > 0 || matchIdx.length >= 2) level = 'io-warn';

    if (md1Fixed > 0) {
      const extra = lowLoadSet ? ` (Álag→Lágt: ${lowLoadSet})` : '';
      setIO(`✅ Lagaði ALLT: MD+1 lagað (${md1Fixed})${extra}`, level);
    } else {
      if (matchIdx.length >= 2) {
        setIO(`⚠️ 2× Leikur í viku — ekkert MD+1 “Æfing” fannst, en fylgstu með recovery`, level);
      } else {
        setIO('✅ Engar breytingar þurfti (engin MD+1 “Æfing” eftir Leik)', 'io-ok');
      }
    }

    // Optionally dump a short summary to console for debugging
    if (changes.length) console.log('[FixAll] changes:', changes);

    // Refresh guardrails if present
    if (window.MicrodoseGuardrails?.runChecks) setTimeout(() => MicrodoseGuardrails.runChecks(), 50);
  }

  function addButton() {
    const actions = document.querySelector('.actions');
    if (!actions) return;

    if (document.getElementById('fixAllBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'fixAllBtn';
    btn.type = 'button';
    btn.textContent = 'Laga ALLT';
    actions.appendChild(btn);

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      fixAll();
    });
  }

  document.addEventListener('DOMContentLoaded', addButton);
})();
// =======================================================
// PRODUCTION CSV EXPORT
// - Day, Dagskrá, Álag, IsMatch, IsMD1AfterMatch, Severity, Warnings
// - Uses your UI taxonomy: Dagskrá = (Æfing/Leikur/Frí), Álag = (Lágt/Miðlungs/Hátt)
// - Patches existing "Export CSV" button if present, otherwise adds one.
// =======================================================
(function ProductionCSVExport() {
  const DAYS = ['Mán', 'Þri', 'Mið', 'Fim', 'Fös', 'Lau', 'Sun'];

  const MATCH = 'leikur';
  const TRAIN = 'æfing';
  const REST  = 'frí';

  const LOAD_LOW  = 'lágt';
  const LOAD_MID  = 'miðlungs';
  const LOAD_HIGH = 'hátt';

  const norm = (s) => (s || '').toString().trim().toLowerCase();
  const getText = (sel) => sel?.options?.[sel.selectedIndex]?.textContent?.trim() || '';

  function escapeCSV(val) {
    const s = String(val ?? '');
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  function downloadText(filename, content, mime = 'text/csv') {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function isDayTypeSelect(sel) {
    const opts = Array.from(sel.options || []).map(o => norm(o.textContent));
    return opts.includes(MATCH) && opts.includes(TRAIN); // Dagskrá select
  }

  function isLoadSelect(sel) {
    const opts = Array.from(sel.options || []).map(o => norm(o.textContent));
    return opts.includes(LOAD_LOW) && (opts.includes(LOAD_MID) || opts.includes(LOAD_HIGH));
  }

  // Build day columns by DOM order: { dayType, load }
  function getDayColumns() {
    const all = Array.from(document.querySelectorAll('select'));
    const dayTypeSelects = all.filter(isDayTypeSelect);

    return dayTypeSelects.map(dt => {
      const idx = all.indexOf(dt);
      let loadSel = null;

      for (let i = idx + 1; i < Math.min(all.length, idx + 6); i++) {
        if (isLoadSelect(all[i])) { loadSel = all[i]; break; }
        if (isDayTypeSelect(all[i])) break; // next day starts
      }

      return { dayType: dt, load: loadSel };
    });
  }

  function getSeverityAndWarnings() {
    const io = document.querySelector('#ioStatus');
    const text = (io?.textContent || '').trim();

    let severity = 'ok';
    if (io?.classList?.contains('io-error')) severity = 'error';
    else if (io?.classList?.contains('io-warn')) severity = 'warn';

    // split on • if present
    const warnings = text
      ? text.split('•').map(s => s.trim()).filter(Boolean).join(' | ')
      : '';

    return { severity, warnings };
  }

  function buildCSV() {
    const cols = getDayColumns();
    const { severity, warnings } = getSeverityAndWarnings();

    // Determine match days + MD+1 flags
    const dayTypeNorm = cols.map(c => norm(getText(c.dayType)));
    const isMatch = dayTypeNorm.map(t => t === MATCH);

    const isMD1AfterMatch = dayTypeNorm.map((_, i) => {
      const prevIsMatch = isMatch[i - 1] === true;
      return prevIsMatch;
    });

    const rows = [];
    rows.push([
      'DayIndex',
      'Day',
      'Dagskrá',
      'Álag',
      'IsMatch',
      'IsMD1AfterMatch',
      'Severity',
      'Warnings'
    ]);

    cols.forEach((c, i) => {
      const day = DAYS[i] || `Dagur${i + 1}`;
      const dagskra = getText(c.dayType) || '';
      const alag = c.load ? (getText(c.load) || '') : '';

      rows.push([
        String(i + 1),
        day,
        dagskra,
        alag,
        isMatch[i] ? 'true' : 'false',
        isMD1AfterMatch[i] ? 'true' : 'false',
        severity,
        warnings
      ]);
    });

    const csv = rows.map(r => r.map(escapeCSV).join(',')).join('\n');
    return csv;
  }

  function exportCSV() {
    try {
      const csv = buildCSV();
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      downloadText(`microdose-week_full_${stamp}.csv`, csv, 'text/csv');

      if (window.IOStatus?.set) IOStatus.set('CSV export (full) klárað ✅', 'io-ok');
    } catch (err) {
      console.error(err);
      if (window.IOStatus?.set) IOStatus.set('CSV export (full) mistókst ❌', 'io-error');
    }
  }

  function wire() {
    // Try to patch existing Export CSV button
    let btn = document.getElementById('exportCsvBtn');

    // If not found, create one in actions row
    if (!btn) {
      const actions = document.querySelector('.actions');
      if (!actions) return;

      btn = document.createElement('button');
      btn.id = 'exportCsvBtn';
      btn.type = 'button';
      btn.textContent = 'Export CSV';
      actions.appendChild(btn);
    }

    // Prevent stacking handlers
    if (btn.__prodCSVWired) return;
    btn.__prodCSVWired = true;

    // Capture so we override any older handler
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      exportCSV();
    }, { capture: true });
  }

  document.addEventListener('DOMContentLoaded', wire);
})();
// =======================================================
// FORCE PATCH: bind Production CSV to ANY button labeled "Export CSV"
// (ensures legacy handler can’t win)
// =======================================================
document.addEventListener('DOMContentLoaded', () => {
  const norm = (s) => (s || '').toString().trim().toLowerCase();

  // Find all buttons that look like Export CSV
  const exportButtons = Array.from(document.querySelectorAll('button'))
    .filter(b => norm(b.textContent) === 'export csv');

  if (!exportButtons.length) return;

  // Build a local reference to the production exporter if it exists in scope.
  // If not, we inline a minimal call by clicking a hidden production button.
  exportButtons.forEach(btn => {
    if (btn.__forceProdCSV) return;
    btn.__forceProdCSV = true;

    // Remove any prior click handlers by cloning
    const clone = btn.cloneNode(true);
    btn.parentNode.replaceChild(clone, btn);

    // Wire: trigger the production button (id: exportCsvBtn) if it exists,
    // otherwise just click the clone (will be handled by prod wire if attached).
    clone.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();

      // If your production code created/uses #exportCsvBtn, trigger it
      const prod = document.getElementById('exportCsvBtn');
      if (prod && prod !== clone) {
        prod.click();
        return;
      }

      // Fallback: if prod is the same button, let it proceed (no-op)
    }, { capture: true });
  });

  if (window.IOStatus?.set) IOStatus.set('✅ Export CSV bundið við Production exporter', 'io-ok');
});
// =======================================================
// BULLETPROOF: Add a NEW button "Export CSV (full)"
// (avoids conflicts with any legacy Export CSV handlers)
// Exports: Day, Dagskrá, Álag, IsMatch, IsMD1AfterMatch, Severity, Warnings
// =======================================================
(function AddExportCSVFullButton() {
  const DAYS = ['Mán', 'Þri', 'Mið', 'Fim', 'Fös', 'Lau', 'Sun'];

  const MATCH = 'leikur';
  const TRAIN = 'æfing';

  const LOAD_LOW  = 'lágt';
  const LOAD_MID  = 'miðlungs';
  const LOAD_HIGH = 'hátt';

  const norm = (s) => (s || '').toString().trim().toLowerCase();
  const getText = (sel) => sel?.options?.[sel.selectedIndex]?.textContent?.trim() || '';

  function escapeCSV(val) {
    const s = String(val ?? '');
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  function downloadText(filename, content) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function isDayTypeSelect(sel) {
    const opts = Array.from(sel.options || []).map(o => norm(o.textContent));
    return opts.includes(MATCH) && opts.includes(TRAIN); // Dagskrá select
  }

  function isLoadSelect(sel) {
    const opts = Array.from(sel.options || []).map(o => norm(o.textContent));
    return opts.includes(LOAD_LOW) && (opts.includes(LOAD_MID) || opts.includes(LOAD_HIGH));
  }

  function getDayColumns() {
    const all = Array.from(document.querySelectorAll('select'));
    const dayTypeSelects = all.filter(isDayTypeSelect);

    return dayTypeSelects.map(dt => {
      const idx = all.indexOf(dt);
      let loadSel = null;

      for (let i = idx + 1; i < Math.min(all.length, idx + 6); i++) {
        if (isLoadSelect(all[i])) { loadSel = all[i]; break; }
        if (isDayTypeSelect(all[i])) break;
      }
      return { dayType: dt, load: loadSel };
    });
  }

  function getSeverityAndWarnings() {
    const io = document.querySelector('#ioStatus');
    const text = (io?.textContent || '').trim();

    let severity = 'ok';
    if (io?.classList?.contains('io-error')) severity = 'error';
    else if (io?.classList?.contains('io-warn')) severity = 'warn';

    const warnings = text
      ? text.split('•').map(s => s.trim()).filter(Boolean).join(' | ')
      : '';

    return { severity, warnings };
  }

  function buildCSV() {
    const cols = getDayColumns();
    const { severity, warnings } = getSeverityAndWarnings();

    const dayTypeNorm = cols.map(c => norm(getText(c.dayType)));
    const isMatch = dayTypeNorm.map(t => t === MATCH);
    const isMD1AfterMatch = dayTypeNorm.map((_, i) => isMatch[i - 1] === true);

    const rows = [];
    rows.push([
      'DayIndex','Day','Dagskrá','Álag','IsMatch','IsMD1AfterMatch','Severity','Warnings'
    ]);

    cols.forEach((c, i) => {
      rows.push([
        String(i + 1),
        DAYS[i] || `Dagur${i + 1}`,
        getText(c.dayType) || '',
        c.load ? (getText(c.load) || '') : '',
        isMatch[i] ? 'true' : 'false',
        isMD1AfterMatch[i] ? 'true' : 'false',
        severity,
        warnings
      ]);
    });

    return rows.map(r => r.map(escapeCSV).join(',')).join('\n');
  }

  function exportFullCSV() {
    try {
      const csv = buildCSV();
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      downloadText(`microdose-week_full_${stamp}.csv`, csv);

      if (window.IOStatus?.set) IOStatus.set('✅ Export CSV (full) klárað', 'io-ok');
      console.log('[Export CSV (full)] OK');
    } catch (err) {
      console.error(err);
      if (window.IOStatus?.set) IOStatus.set('❌ Export CSV (full) mistókst', 'io-error');
    }
  }

  function addButton() {
    const actions = document.querySelector('.actions');
    if (!actions) return;

    if (document.getElementById('exportCsvFullBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'exportCsvFullBtn';
    btn.type = 'button';
    btn.textContent = 'Export CSV (full)';
    actions.appendChild(btn);

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      exportFullCSV();
    });
  }

  document.addEventListener('DOMContentLoaded', addButton);
})();
// =======================================================
// FIX LOG + CSV (FULL) WITH FIXESAPPLIED
// - Captures diffs when clicking "Laga ALLT" (before vs after snapshot)
// - Stores per-day fix log in window.__microdoseFixLog
// - Rewires "Export CSV (full)" to include FixesApplied column
// =======================================================
(function FixLogAndCSVFull() {
  const DAYS = ['Mán', 'Þri', 'Mið', 'Fim', 'Fös', 'Lau', 'Sun'];

  const MATCH = 'leikur';
  const TRAIN = 'æfing';

  const LOAD_LOW  = 'lágt';
  const LOAD_MID  = 'miðlungs';
  const LOAD_HIGH = 'hátt';

  const norm = (s) => (s || '').toString().trim().toLowerCase();
  const getText = (sel) => sel?.options?.[sel.selectedIndex]?.textContent?.trim() || '';

  function isDayTypeSelect(sel) {
    const opts = Array.from(sel.options || []).map(o => norm(o.textContent));
    return opts.includes(MATCH) && opts.includes(TRAIN); // Dagskrá select
  }

  function isLoadSelect(sel) {
    const opts = Array.from(sel.options || []).map(o => norm(o.textContent));
    return opts.includes(LOAD_LOW) && (opts.includes(LOAD_MID) || opts.includes(LOAD_HIGH));
  }

  function getDayColumns() {
    const all = Array.from(document.querySelectorAll('select'));
    const dayTypeSelects = all.filter(isDayTypeSelect);

    return dayTypeSelects.map(dt => {
      const idx = all.indexOf(dt);
      let loadSel = null;

      for (let i = idx + 1; i < Math.min(all.length, idx + 6); i++) {
        if (isLoadSelect(all[i])) { loadSel = all[i]; break; }
        if (isDayTypeSelect(all[i])) break; // next day starts
      }

      return { dayType: dt, load: loadSel };
    });
  }

  function snapshotWeek() {
    const cols = getDayColumns();
    return cols.map((c, i) => ({
      dayIndex: i + 1,
      day: DAYS[i] || `Dagur${i + 1}`,
      dagskra: getText(c.dayType) || '',
      alag: c.load ? (getText(c.load) || '') : '',
    }));
  }

  function computeDiffs(before, after) {
    const perDay = {}; // dayIndex -> [changes]
    let totalChanges = 0;

    for (let i = 0; i < Math.min(before.length, after.length); i++) {
      const b = before[i], a = after[i];
      const changes = [];

      if (b.dagskra !== a.dagskra) changes.push(`Dagskrá: ${b.dagskra}→${a.dagskra}`);
      if (b.alag !== a.alag) changes.push(`Álag: ${b.alag || '—'}→${a.alag || '—'}`);

      if (changes.length) {
        perDay[b.dayIndex] = changes;
        totalChanges += changes.length;
      }
    }

    return { perDay, totalChanges };
  }

  function setIO(msg, level) {
    if (window.IOStatus?.set) return IOStatus.set(msg, level);
    const el = document.querySelector('#ioStatus');
    if (!el) return;
    el.textContent = msg;
  }

  // ---------- Fix Log capture on "Laga ALLT" ----------
  function wireFixAllCapture() {
    const btn = Array.from(document.querySelectorAll('button'))
      .find(b => norm(b.textContent) === 'laga allt');

    if (!btn || btn.__fixLogCaptureWired) return;
    btn.__fixLogCaptureWired = true;

    // Capture BEFORE original handler runs (capture phase)
    btn.addEventListener('click', () => {
      const before = snapshotWeek();

      // Let existing handlers run, then snapshot AFTER
      setTimeout(() => {
        const after = snapshotWeek();
        const { perDay, totalChanges } = computeDiffs(before, after);

        window.__microdoseFixLog = {
          at: new Date().toISOString(),
          perDay,
          totalChanges,
        };

        if (totalChanges > 0) {
          setIO(`✅ Fix log vistað (${totalChanges} breytingar). CSV (full) mun innihalda FixesApplied.`, 'io-ok');
        } else {
          setIO('ℹ️ Fix log: engar breytingar (ekkert breytt við Laga ALLT).', 'io-warn');
        }

        console.log('[FixLog] stored:', window.__microdoseFixLog);
      }, 80);
    }, { capture: true });
  }

  // ---------- CSV helpers ----------
  function escapeCSV(val) {
    const s = String(val ?? '');
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  function downloadText(filename, content) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function getSeverityAndWarnings() {
    const io = document.querySelector('#ioStatus');
    const text = (io?.textContent || '').trim();

    let severity = 'ok';
    if (io?.classList?.contains('io-error')) severity = 'error';
    else if (io?.classList?.contains('io-warn')) severity = 'warn';

    const warnings = text
      ? text.split('•').map(s => s.trim()).filter(Boolean).join(' | ')
      : '';

    return { severity, warnings };
  }

  function buildCSVFullWithFixLog() {
    const cols = getDayColumns();
    const { severity, warnings } = getSeverityAndWarnings();

    const dayTypeNorm = cols.map(c => norm(getText(c.dayType)));
    const isMatch = dayTypeNorm.map(t => t === MATCH);
    const isMD1AfterMatch = dayTypeNorm.map((_, i) => isMatch[i - 1] === true);

    const log = window.__microdoseFixLog?.perDay || {};

    const rows = [];
    rows.push([
      'DayIndex','Day','Dagskrá','Álag','IsMatch','IsMD1AfterMatch','Severity','Warnings','FixesApplied'
    ]);

    cols.forEach((c, i) => {
      const dayIndex = i + 1;
      const fixes = Array.isArray(log[dayIndex]) ? log[dayIndex].join(' | ') : '';

      rows.push([
        String(dayIndex),
        DAYS[i] || `Dagur${dayIndex}`,
        getText(c.dayType) || '',
        c.load ? (getText(c.load) || '') : '',
        isMatch[i] ? 'true' : 'false',
        isMD1AfterMatch[i] ? 'true' : 'false',
        severity,
        warnings,
        fixes
      ]);
    });

    return rows.map(r => r.map(escapeCSV).join(',')).join('\n');
  }

  function exportCSVFullWithFixLog() {
    try {
      const csv = buildCSVFullWithFixLog();
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      downloadText(`microdose-week_full_fixlog_${stamp}.csv`, csv);
      setIO('✅ Export CSV (full + fix log) klárað', 'io-ok');
      console.log('[Export CSV full+fixlog] OK');
    } catch (err) {
      console.error(err);
      setIO('❌ Export CSV (full + fix log) mistókst', 'io-error');
    }
  }

  // ---------- Rewire the existing "Export CSV (full)" button safely ----------
  function wireExportFullFixLog() {
    // Find by exact label first
    let btn = Array.from(document.querySelectorAll('button'))
      .find(b => norm(b.textContent) === 'export csv (full)');

    // If missing, do nothing (user may not have that button)
    if (!btn) return;

    if (btn.__fullFixLogWired) return;
    btn.__fullFixLogWired = true;

    // Clone to remove any existing handlers, then wire ours
    const clone = btn.cloneNode(true);
    btn.parentNode.replaceChild(clone, btn);

    clone.addEventListener('click', (e) => {
      e.preventDefault();
      exportCSVFullWithFixLog();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    wireFixAllCapture();
    wireExportFullFixLog();
  });
})();
// =======================================================
// C) Card-level Click-to-Fix for MD+1 after MATCH
// If a day is "Leikur" and next day is "Æfing", show fix buttons inside next day's card.
// Fix options: Set "Frí", Set "Álag: Lágt", or Both.
// =======================================================
(function CardLevelClickToFix() {
  const DAYS = ['Mán', 'Þri', 'Mið', 'Fim', 'Fös', 'Lau', 'Sun'];

  const MATCH = 'leikur';
  const TRAIN = 'æfing';
  const REST  = 'frí';
  const LOAD_LOW = 'lágt';

  const norm = (s) => (s || '').toString().trim().toLowerCase();
  const getText = (sel) => sel?.options?.[sel.selectedIndex]?.textContent?.trim() || '';

  function isDayTypeSelect(sel) {
    const opts = Array.from(sel.options || []).map(o => norm(o.textContent));
    return opts.includes(MATCH) && opts.includes(TRAIN);
  }

  function isLoadSelect(sel) {
    const opts = Array.from(sel.options || []).map(o => norm(o.textContent));
    return opts.includes(LOAD_LOW);
  }

  function setSelectExact(selectEl, exactLowerText) {
    const opts = Array.from(selectEl.options || []);
    const idx = opts.findIndex(o => norm(o.textContent) === exactLowerText);
    if (idx < 0) return false;
    selectEl.selectedIndex = idx;
    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  // Find a "day card" by looking for a container that contains the day label text
  function findDayCards() {
    // Heuristic: cards are likely the 7 blocks containing the day headings
    // We search for elements that contain a heading with text like "Mán", "Þri", ...
    const all = Array.from(document.querySelectorAll('div, section, article'));
    const cards = [];

    for (const day of DAYS) {
      const d = norm(day);
      const el = all.find(node => {
        // must contain visible day label somewhere
        const txt = norm(node.textContent || '');
        if (!txt.includes(d)) return false;
        // must contain selects (Dagskrá + Álag)
        const sels = node.querySelectorAll('select');
        if (!sels || sels.length < 1) return false;
        // and at least one of the selects looks like dayType
        return Array.from(sels).some(isDayTypeSelect);
      });

      if (el) cards.push({ day, el });
      else cards.push({ day, el: null });
    }

    return cards;
  }

  function getCardSelects(cardEl) {
    const sels = Array.from(cardEl.querySelectorAll('select'));
    const dayType = sels.find(isDayTypeSelect) || null;

    // Try to find load select near dayType inside same card
    let load = null;
    if (dayType) {
      const idx = sels.indexOf(dayType);
      for (let i = idx + 1; i < Math.min(sels.length, idx + 4); i++) {
        if (isLoadSelect(sels[i])) { load = sels[i]; break; }
      }
      if (!load) load = sels.find(isLoadSelect) || null;
    }

    return { dayType, load };
  }

  function ensureMiniStyle() {
    if (document.getElementById('mdFixMiniStyle')) return;
    const style = document.createElement('style');
    style.id = 'mdFixMiniStyle';
    style.textContent = `
      .md-fix-mini {
        margin-top: 10px;
        padding: 10px;
        border-radius: 12px;
        border: 1px solid rgba(231, 76, 60, 0.35);
        background: rgba(231, 76, 60, 0.10);
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      }
      .md-fix-mini .md-fix-label {
        font-size: 12px;
        opacity: 0.95;
        margin-right: 6px;
      }
      .md-fix-mini button {
        padding: 8px 10px;
        border-radius: 10px;
        border: 0;
        cursor: pointer;
        font-weight: 600;
      }
    `;
    document.head.appendChild(style);
  }

  function removeExistingFixBars() {
    document.querySelectorAll('.md-fix-mini').forEach(el => el.remove());
  }

  function addFixBar(targetCardEl, targetDayName, dayTypeSel, loadSel) {
    // Avoid duplicates
    if (targetCardEl.querySelector('.md-fix-mini')) return;

    ensureMiniStyle();

    const wrap = document.createElement('div');
    wrap.className = 'md-fix-mini';

    const label = document.createElement('div');
    label.className = 'md-fix-label';
    label.textContent = `⚠️ MD+1 (${targetDayName}) er “Æfing” eftir Leik — laga:`;
    wrap.appendChild(label);

    const bRest = document.createElement('button');
    bRest.type = 'button';
    bRest.textContent = 'Setja Frí';
    bRest.addEventListener('click', () => {
      if (dayTypeSel) setSelectExact(dayTypeSel, REST);
      if (window.MicrodoseGuardrails?.runChecks) setTimeout(() => MicrodoseGuardrails.runChecks(), 50);
      run();
    });

    const bLow = document.createElement('button');
    bLow.type = 'button';
    bLow.textContent = 'Álag: Lágt';
    bLow.addEventListener('click', () => {
      if (loadSel) setSelectExact(loadSel, LOAD_LOW);
      if (window.MicrodoseGuardrails?.runChecks) setTimeout(() => MicrodoseGuardrails.runChecks(), 50);
      run();
    });

    const bBoth = document.createElement('button');
    bBoth.type = 'button';
    bBoth.textContent = 'Laga (bæði)';
    bBoth.addEventListener('click', () => {
      if (dayTypeSel) setSelectExact(dayTypeSel, REST);
      if (loadSel) setSelectExact(loadSel, LOAD_LOW);
      if (window.MicrodoseGuardrails?.runChecks) setTimeout(() => MicrodoseGuardrails.runChecks(), 50);
      run();
    });

    wrap.appendChild(bRest);
    wrap.appendChild(bLow);
    wrap.appendChild(bBoth);

    // Insert near bottom of card
    targetCardEl.appendChild(wrap);
  }

  function run() {
    const cards = findDayCards();

    // If we couldn't find cards reliably, fall back and do nothing (avoid breaking UI)
    if (cards.some(c => !c.el)) return;

    removeExistingFixBars();

    const dayState = cards.map(c => {
      const { dayType, load } = getCardSelects(c.el);
      return {
        day: c.day,
        el: c.el,
        dayTypeSel: dayType,
        loadSel: load,
        type: dayType ? norm(getText(dayType)) : '',
        load: load ? norm(getText(load)) : ''
      };
    });

    // For each match day, check next day
    dayState.forEach((d, i) => {
      if (d.type === MATCH) {
        const md1 = dayState[i + 1];
        if (!md1) return;
        if (md1.type === TRAIN) {
          addFixBar(md1.el, md1.day, md1.dayTypeSel, md1.loadSel);
        }
      }
    });
  }

  function wire() {
    // Re-run when any select changes (keeps fix bars in sync)
    document.addEventListener('change', (e) => {
      if (e.target && e.target.tagName === 'SELECT') {
        setTimeout(run, 50);
      }
    });

    // Initial
    run();
  }

  document.addEventListener('DOMContentLoaded', wire);
})();
// =======================================================
// SELECT-LEVEL CLICK-TO-FIX (MD+1 after MATCH)
// - Finds the 7 "Dagskrá" selects (those that contain Æfing + Leikur)
// - If day i = Leikur and day i+1 = Æfing, injects a fix bar right under
//   the MD+1 day's Dagskrá select.
// - Buttons: Setja Frí, Álag: Lágt, Laga (bæði)
// =======================================================
(function SelectLevelMD1Fix() {
  const DAYS = ['Mán', 'Þri', 'Mið', 'Fim', 'Fös', 'Lau', 'Sun'];

  const MATCH = 'leikur';
  const TRAIN = 'æfing';
  const REST  = 'frí';
  const LOAD_LOW = 'lágt';

  const norm = (s) => (s || '').toString().trim().toLowerCase();
  const getText = (sel) => sel?.options?.[sel.selectedIndex]?.textContent?.trim() || '';

  function isDayTypeSelect(sel) {
    const opts = Array.from(sel.options || []).map(o => norm(o.textContent));
    return opts.includes(MATCH) && opts.includes(TRAIN);
  }

  function isLoadSelect(sel) {
    const opts = Array.from(sel.options || []).map(o => norm(o.textContent));
    return opts.includes(LOAD_LOW);
  }

  function ensureStyle() {
    if (document.getElementById('md1FixStyle')) return;
    const style = document.createElement('style');
    style.id = 'md1FixStyle';
    style.textContent = `
      .md1-fixbar {
        margin-top: 8px;
        padding: 10px;
        border-radius: 12px;
        border: 1px solid rgba(231, 76, 60, 0.35);
        background: rgba(231, 76, 60, 0.10);
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      }
      .md1-fixbar .label {
        font-size: 12px;
        opacity: 0.95;
        margin-right: 6px;
        white-space: nowrap;
      }
      .md1-fixbar button {
        padding: 8px 10px;
        border-radius: 10px;
        border: 0;
        cursor: pointer;
        font-weight: 700;
      }
    `;
    document.head.appendChild(style);
  }

  function setSelectExact(selectEl, exactLowerText) {
    if (!selectEl) return false;
    const opts = Array.from(selectEl.options || []);
    const idx = opts.findIndex(o => norm(o.textContent) === exactLowerText);
    if (idx < 0) return false;
    selectEl.selectedIndex = idx;
    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  // Get day columns by DOM order: Dagskrá select + nearest Álag select
  function getDayColumns() {
    const all = Array.from(document.querySelectorAll('select'));
    const dayTypeSelects = all.filter(isDayTypeSelect);

    return dayTypeSelects.map(dt => {
      const idx = all.indexOf(dt);
      let loadSel = null;

      // search a little forward; stop when next dayType begins
      for (let i = idx + 1; i < Math.min(all.length, idx + 8); i++) {
        if (isLoadSelect(all[i])) { loadSel = all[i]; break; }
        if (isDayTypeSelect(all[i])) break;
      }

      return { day: null, dayType: dt, load: loadSel };
    });
  }

  function removeAllFixBars() {
    document.querySelectorAll('.md1-fixbar').forEach(el => el.remove());
  }

  function insertFixBarUnderSelect(md1Select, md1DayName, md1LoadSelect) {
    if (!md1Select || md1Select.__md1FixAttached) return;

    // If we re-run, we don't want duplicates
    const existing = md1Select.parentElement?.querySelector('.md1-fixbar');
    if (existing) existing.remove();

    ensureStyle();

    const bar = document.createElement('div');
    bar.className = 'md1-fixbar';

    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = `⚠️ MD+1 (${md1DayName}) er “Æfing” eftir Leik — laga:`;
    bar.appendChild(label);

    const bRest = document.createElement('button');
    bRest.type = 'button';
    bRest.textContent = 'Setja Frí';
    bRest.addEventListener('click', () => {
      setSelectExact(md1Select, REST);
      setTimeout(() => window.MicrodoseGuardrails?.runChecks?.(), 60);
      setTimeout(run, 80);
    });

    const bLow = document.createElement('button');
    bLow.type = 'button';
    bLow.textContent = 'Álag: Lágt';
    bLow.addEventListener('click', () => {
      setSelectExact(md1LoadSelect, LOAD_LOW);
      setTimeout(() => window.MicrodoseGuardrails?.runChecks?.(), 60);
      setTimeout(run, 80);
    });

    const bBoth = document.createElement('button');
    bBoth.type = 'button';
    bBoth.textContent = 'Laga (bæði)';
    bBoth.addEventListener('click', () => {
      setSelectExact(md1Select, REST);
      setSelectExact(md1LoadSelect, LOAD_LOW);
      setTimeout(() => window.MicrodoseGuardrails?.runChecks?.(), 60);
      setTimeout(run, 80);
    });

    bar.appendChild(bRest);
    bar.appendChild(bLow);
    bar.appendChild(bBoth);

    // Insert right after the select (best-effort)
    // If the select is wrapped, put bar after wrapper
    const afterEl = md1Select.closest('.field, .control, .input, .select, .form-group') || md1Select;
    afterEl.insertAdjacentElement('afterend', bar);

    md1Select.__md1FixAttached = true;
  }

  function run() {
    const cols = getDayColumns();
    if (!cols || cols.length < 2) return;

    // assign day names in order
    cols.forEach((c, i) => c.day = DAYS[i] || `Dagur${i + 1}`);

    removeAllFixBars();

    // compute types
    const types = cols.map(c => norm(getText(c.dayType)));

    // inject fixbar for each match->train transition
    for (let i = 0; i < cols.length - 1; i++) {
      const isMatch = types[i] === MATCH;
      const md1IsTrain = types[i + 1] === TRAIN;

      if (isMatch && md1IsTrain) {
        const md1 = cols[i + 1];
        insertFixBarUnderSelect(md1.dayType, md1.day, md1.load);
      }
    }
  }

  function wire() {
    // Re-run whenever any select changes
    document.addEventListener('change', (e) => {
      if (e.target && e.target.tagName === 'SELECT') {
        setTimeout(run, 60);
      }
    });

    // Initial pass
    setTimeout(run, 80);
  }

  document.addEventListener('DOMContentLoaded', wire);
})();
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('togglePG');
  const wrap = document.getElementById('pgWrap');
  if (!btn || !wrap) return;

  // Ensure visible by default
  if (!wrap.style.display) wrap.style.display = 'block';

  btn.addEventListener('click', () => {
    wrap.style.display = (wrap.style.display === 'none') ? 'block' : 'none';
  });
});
// UI override: force week-day cards to be grid + full width (kills inline sizing)
document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('microdose-week-grid');
  if (grid) {
    grid.removeAttribute('style');
    grid.classList.add('force-week-grid');
  }

  const cards = document.querySelectorAll('#microdose-week-grid .week-card');
  cards.forEach(card => {
    card.removeAttribute('style');
    card.classList.add('force-week-card');
  });

  // If the week cards are rendered later (after clicking build), re-apply after clicks
  const buildBtn =
    document.getElementById('buildWeekBtn') ||
    document.querySelector('button[type="submit"]') ||
    document.querySelector('button');

  if (buildBtn) {
    buildBtn.addEventListener('click', () => {
      setTimeout(() => {
        const g = document.getElementById('microdose-week-grid');
        if (g) {
          g.removeAttribute('style');
          g.classList.add('force-week-grid');
        }
        document.querySelectorAll('#microdose-week-grid .week-card').forEach(c => {
          c.removeAttribute('style');
          c.classList.add('force-week-card');
        });
      }, 50);
    });
  }
});
function getPlayerKey() {
  const p = document.getElementById('playerSelect');
  const id = (p?.value || 'default').trim().toLowerCase().replace(/\s+/g, '-');
  return id || 'default';
}

function strengthDaysKey() {
  return `microdose_residual_strength_days_v1_${getPlayerKey()}`;
}

function loadStrengthDays() {
  const el = document.getElementById('strengthDaysInput'); // <- settu rétt ID
  if (!el) return;
  const saved = localStorage.getItem(strengthDaysKey());
  if (saved !== null) el.value = saved;
}

function saveStrengthDays() {
  const el = document.getElementById('strengthDaysInput');
  if (!el) return;
  localStorage.setItem(strengthDaysKey(), el.value ?? '');
}

// Keyra á load + þegar leikmaður breytist
document.addEventListener('DOMContentLoaded', () => {
  loadStrengthDays();
  document.getElementById('playerSelect')?.addEventListener('change', loadStrengthDays);
  document.getElementById('strengthDaysInput')?.addEventListener('input', saveStrengthDays);
});
function slugify(s) {
  return (s || 'default').trim().toLowerCase().replace(/\s+/g, '-');
}
function playerSlug() {
  return slugify(document.getElementById('playerSelect')?.value);
}

function lastStrengthKey() {
  return `microdose_last_strength_date_v1_${playerSlug()}`;
}

function daysBetweenISO(isoDate) {
  if (!isoDate) return null;
  const a = new Date(isoDate + 'T00:00:00');
  const b = new Date();
  const b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  const diff = Math.floor((b0 - a) / (1000 * 60 * 60 * 24));
  return Math.max(0, Math.min(21, diff));
}

function setStrengthDaysFromLastDate() {
  const input = document.getElementById('strengthDaysInput'); // <-- settu rétt ID
  if (!input) return;

  const last = localStorage.getItem(lastStrengthKey());
  const days = daysBetweenISO(last);

  if (days === null) return;        // ekkert vistað enn
  input.value = String(days);
}

function markStrengthToday() {
  localStorage.setItem(lastStrengthKey(), new Date().toISOString().slice(0, 10));
  setStrengthDaysFromLastDate();
}

// On load + player change
document.addEventListener('DOMContentLoaded', () => {
  setStrengthDaysFromLastDate();
  document.getElementById('playerSelect')?.addEventListener('change', setStrengthDaysFromLastDate);
});
// ===== Trigger 3: Auto-set "last strength date" from week/day selections =====

// TODO: set this to the real ID of your STYRK residual input:
const strengthDaysInputId = 'strengthDaysInput'; // <-- change to your actual ID

function slugify(s) {
  return (s || 'default').trim().toLowerCase().replace(/\s+/g, '-');
}
function playerSlug() {
  return slugify(document.getElementById('playerSelect')?.value);
}
function lastStrengthKey() {
  return `microdose_last_strength_date_v1_${playerSlug()}`;
}

// ISO yyyy-mm-dd today
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Get Monday of current week (local time)
function currentWeekMondayISO() {
  const d = new Date();
  const day = d.getDay(); // Sun=0..Sat=6
  const diff = (day === 0 ? -6 : 1) - day; // move to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function addDaysISO(iso, days) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function clamp0to21(n) {
  return Math.max(0, Math.min(21, n));
}

function daysBetweenISO(fromISO, toISO) {
  const a = new Date(fromISO + 'T00:00:00');
  const b = new Date(toISO + 'T00:00:00');
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

function isStrengthValue(v) {
  const s = String(v || '').toLowerCase();
  // Matches "styrk", "styrkur", etc. Adjust if you use a specific enum.
  return s.includes('styrk');
}

/**
 * Trigger 3 core:
 * - scans week-plan-*-schedule selects
 * - finds the most recent day marked as strength that is not in the future
 * - stores last strength date and updates the "days since" input (0–21)
 */
function updateLastStrengthFromWeekSelections() {
  const today = todayISO();
  const weekStart = currentWeekMondayISO(); // if you later add a "weekStartDate" input, use it here

  // All selects like: week-plan-0-schedule ... week-plan-6-schedule
  const scheduleSelects = [...document.querySelectorAll('select[id^="week-plan-"][id$="-schedule"]')];

  if (scheduleSelects.length === 0) return;

  let bestISO = null;

  for (const sel of scheduleSelects) {
    const m = sel.id.match(/^week-plan-(\d+)-schedule$/);
    if (!m) continue;
    const idx = Number(m[1]); // 0..6 expected
    if (!Number.isFinite(idx)) continue;

    const val = sel.value || sel.options?.[sel.selectedIndex]?.text || '';
    if (!isStrengthValue(val)) continue;

    const dayISO = addDaysISO(weekStart, idx);

    // Only count strength days that are today or earlier
    if (dayISO <= today) {
      if (!bestISO || dayISO > bestISO) bestISO = dayISO;
    }
  }

  if (!bestISO) return; // no past/present strength day found

  localStorage.setItem(lastStrengthKey(), bestISO);

  const input = document.getElementById(strengthDaysInputId);
  if (input) {
    const days = clamp0to21(daysBetweenISO(bestISO, today));
    input.value = String(days);
  }
}

// Hook into "build week plan" and also whenever schedule changes
document.addEventListener('DOMContentLoaded', () => {
  // Recompute on schedule change
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t && t.tagName === 'SELECT' && /^week-plan-\d+-schedule$/.test(t.id)) {
      updateLastStrengthFromWeekSelections();
    }
  });

  // Also recompute after clicking your build button (if present)
  const buildBtn = document.getElementById('buildWeekBtn');
  if (buildBtn) {
    buildBtn.addEventListener('click', () => {
      // Wait a tick in case UI is re-rendered
      setTimeout(updateLastStrengthFromWeekSelections, 50);
    });
  }
});
// ===============================
// TRIGGER 3 – auto-update residuals
// when week day schedule changes
// ===============================
document.addEventListener('change', (e) => {
  const t = e.target;
  if (
    t &&
    t.tagName === 'SELECT' &&
    /^week-plan-\d+-schedule$/.test(t.id)
  ) {
    updateLastStrengthFromWeekSelections();
  }
});
// Optional hooks (only if implemented)
if (typeof updateLastStrengthFromWeekSelections === 'function') updateLastStrengthFromWeekSelections();
if (typeof updateLastPowerFromWeekSelections === 'function') updateLastPowerFromWeekSelections();
if (typeof updateLastPlyoFromWeekSelections === 'function') updateLastPlyoFromWeekSelections();


// Guarded refreshLoadSelect wrapper (Netlify console ~3892)
(function ensureRefreshLoadSelectGuard(){
  const prev = typeof window !== 'undefined' ? window.refreshLoadSelect : null;
  window.refreshLoadSelect = function(...args) {
    const loadSelect = document.getElementById('loadProgram');
    if (!loadSelect) {
      console.warn('[microdose] refreshLoadSelect: loadSelect fannst ekki');
      return;
    }
    if (typeof prev === 'function') {
      return prev.apply(this, args);
    }
    // fallback: no-op if there is no previous implementation
  };
})();
function renderWeekCards(resultOverride, scheduleOverride) {
  const root = document.getElementById('weekCards');
  const empty = document.getElementById('weekEmpty');
  if (!root) return;

  let schedule = [];
  try {
    schedule = scheduleOverride && Array.isArray(scheduleOverride)
      ? scheduleOverride
      : (typeof readWeekScheduleFromUI === 'function' ? readWeekScheduleFromUI() : []) || [];
  } catch (e) {
    console.warn('readWeekScheduleFromUI failed', e);
    schedule = [];
  }

  // normalize to 7 items
  if (!Array.isArray(schedule)) schedule = [];
  while (schedule.length < 7) schedule.push({});

  const keys = ['man','tri','mid','fim','fos','lau','sun'];
  const labels = ['Mán','Þri','Mið','Fim','Fös','Lau','Sun'];
  const trafficNotes = {
    rautt: 'Rautt: Engin ný þjálfun. Einungis endurheimt/primer.',
    gult: 'Gult: Viðhald/snerting, halda magni lágu.',
    graent: 'Grænt: Hægt að vinna hraðar eða anchor ef reglur leyfa.'
  };

  const useResult = resultOverride && Array.isArray(resultOverride) ? resultOverride : null;
  const hasAny = useResult
    ? true
    : schedule.some(d => d && ((d.dagskra && d.dagskra !== '-') || (d.alag && d.alag !== '-')));
  if (empty) empty.style.display = hasAny ? 'none' : 'block';

  root.innerHTML = keys.map((k, i) => {
    if (useResult) {
      const day = useResult[i] || {};
      const sched = schedule[i] || {};
      const traffic = (day.traffic || '').toLowerCase();
      const trafficTag = traffic.includes('rau') ? 'rautt' : traffic.includes('græ') ? 'graent' : 'gult';
      const disp = typeof mapDisplayPlan === 'function' ? mapDisplayPlan(day, sched, null, getExposureValue()) : {};
      const template = disp.template || day.stefna || day.template || '—';
      const time = (disp.time && disp.time !== '—') ? disp.time : (day.minutur || day.time || '');
      const lota = day.lota || '';
      const volume = day.volume || '';
      const sett = Array.isArray(day.sett) ? day.sett.filter(Boolean).join(' · ') : (day.sett || '');
      const stod = Array.isArray(day.stod) ? day.stod.filter(Boolean).join(' · ') : (day.stod || '');
      const focus = day.focus || disp.plan || '';
      const noteParts = [];
      if (disp.note) noteParts.push(disp.note);
      const residualNote = day.residual_note || day.note;
      if (residualNote) noteParts.push(residualNote);
      if (!noteParts.length && trafficNotes[trafficTag]) noteParts.push(trafficNotes[trafficTag]);
      const prevSched = i > 0 ? schedule[i - 1] : null;
      const tpl = getSessionTemplate(
        { ...day, dagskra: sched.dagskra, alag: sched.alag, focus: focus || sched.dagskra },
        { exposure: getExposureValue(), md1: isMDPlus1(prevSched) || ((prevSched?.type || '').toLowerCase() === 'game') }
      );
      const blockTitles = Array.isArray(tpl.blocks) ? tpl.blocks.map(b => b.title) : [];
      const previewTitles = blockTitles.slice(0, 3);
      const extraCount = blockTitles.length > 3 ? blockTitles.length - 3 : 0;
      return `
        <button type="button" class="week-day-card week-card" data-day="${k}">
          <div style="display:flex;gap:6px;align-items:center;font-weight:700">
            <span>${labels[i]}</span>
            ${day.traffic ? `<span class="tag traffic-${trafficTag}">${day.traffic}</span>` : ''}
          </div>
          <div style="font-weight:600;margin-top:4px;">${template}${time ? ' · ' + time : ''}</div>
          ${focus ? `<div style="opacity:.9;font-size:13px;">${focus}</div>` : ''}
          ${lota ? `<div style="opacity:.9;font-size:13px;">${lota}</div>` : ''}
          ${volume ? `<div style="opacity:.9;font-size:13px;">Ráðlögð lota: ${volume}</div>` : ''}
          ${sett ? `<div style="opacity:.9;font-size:13px;">Sett: ${sett}</div>` : ''}
          ${stod ? `<div style="opacity:.9;font-size:13px;">Stoð: ${stod}</div>` : ''}
          <div style="opacity:.85;font-size:13px;">Dagskrá: ${sched.dagskra || '–'} · Álag: ${sched.alag || '–'}</div>
          ${tpl && tpl.totalMinutes ? `<div class="week-card-preview"><strong>Total:</strong> ${tpl.totalMinutes} mín</div>` : ''}
          ${previewTitles.length ? `<ul class="week-card-preview">${previewTitles.map(t => `<li>${t}</li>`).join('')}${extraCount ? `<li>+${extraCount} blokk${extraCount>1?'ir':''}</li>` : ''}</ul>` : ''}
          ${noteParts.length ? `<div style="opacity:.8;font-size:12px;margin-top:4px;">${noteParts.join(' ')}</div>` : ''}
        </button>
      `;
    }

    const d = schedule[i] || {};
    const dagskra = d.dagskra ?? d.schedule ?? d.type ?? '–';
    const alag = d.alag ?? d.load ?? '–';
    return `
      <button type="button" class="week-day-card week-card" data-day="${k}">
        <div style="font-weight:700">${labels[i]}</div>
        <div style="opacity:.85;font-size:13px">${dagskra} · ${alag}</div>
      </button>
    `;
  }).join('');
}

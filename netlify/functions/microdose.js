function isPracticeType(type) {
  const t = (type || '').toLowerCase();
  return t === 'practice' || t === 'basketball_practice';
}

const DAY_TYPE_PROFILES = {
  "Restart": { category: "practice", defaultLoad: "Low", allowedLoads: ["Low", "Moderate"] },
  "Mechanical": { category: "practice", defaultLoad: "Moderate", allowedLoads: ["Moderate", "High"] },
  "Locomotive": { category: "practice", defaultLoad: "Moderate", allowedLoads: ["Moderate", "High"] },
  "Top-Up": { category: "practice", defaultLoad: "Low", allowedLoads: ["Low", "Moderate"] },
  "Game Preparation": { category: "practice", defaultLoad: "Low", allowedLoads: ["Low"], constraints: { disallowHeavy: true, disallowHighPlyo: true } },
  "Recovery": { category: "recovery", defaultLoad: "Low", allowedLoads: ["Low"] },
  "Game": { category: "game", defaultLoad: "High", allowedLoads: ["High"] },
  "Day-Off": { category: "off", defaultLoad: "Low", allowedLoads: ["Low"] }
};

function normalizeDayType(value) {
  const map = {
    "Æfing": "Mechanical",
    "Leikur": "Game",
    "Frí": "Day-Off",
    "Endurheimt": "Recovery",
    "Ferð": "Day-Off"
  };
  if (!value) return "";
  return map[value] || value;
}

function enforceLoad(dayType, load) {
  const profile = DAY_TYPE_PROFILES[normalizeDayType(dayType)] || DAY_TYPE_PROFILES["Mechanical"];
  const allowed = profile.allowedLoads || [];
  const fixed = allowed.includes(load) ? load : profile.defaultLoad;
  return { profile, load: fixed };
}

function mapLoadToReadiness(load) {
  const l = (load || '').toLowerCase();
  if (l.startsWith('h')) return 4;
  if (l.startsWith('m')) return 6;
  return 8;
}

function baseTraffic(readiness) {
  if (readiness >= 8) return 'grænt';
  if (readiness <= 4) return 'rautt';
  return 'gult';
}

function baseStefnaFromTraffic(traffic) {
  if (traffic === 'grænt') return 'Primer';
  if (traffic === 'gult') return 'Maintenance';
  return 'Primer';
}

function computeDayPlan(input) {
  const dagur = (input.dagur || 'Mán').trim();
  const readiness = Number(input.readiness || 7);
  const focus = (input.focus || 'Hraði + styrkur').trim();
  const typeRaw = normalizeDayType(input.type || input.dagskra || 'Mechanical');
  const { profile, load } = enforceLoad(typeRaw, input.alag || input.load || 'Low');
  const isPractice = profile.category === 'practice';
  const traffic = baseTraffic(readiness);
  const stefna = baseStefnaFromTraffic(traffic);

  const lota = stefna === 'Primer'
    ? '5–6 micro-lotur, 1–2 æf./lota, langt hvíld (90–150s)'
    : stefna === 'Maintenance'
      ? '4–5 micro-lotur, 1–2 æf./lota, hvíld 60–120s'
      : '3–4 micro-lotur, 1 æf./lota, hvíld 90–180s (létt)';

  const volume = stefna === 'Primer' ? '6–9 sett samtals' : stefna === 'Maintenance' ? '5–7 sett samtals' : '3–5 sett samtals';

  const primerSet = [
    'A: Þungt tækni-sett (1–2 reps @ ~80%) + Explosive (3–5 reps)'
  ];
  const maintSet = [
    'A: 1 þungt sett (2–3 reps) + 1 hraðasett (3–5 reps)'
  ];
  const anchorSet = [
    'A: Létt velocity-sett (3–4 reps) eða líkamsþyngd',
  ];

  const sett = stefna === 'Primer' ? primerSet : stefna === 'Maintenance' ? maintSet : anchorSet;

  const stod = [
    'Hamstring iso eða Nordic (3–5 endurtekningar eða 20–30s hold)',
    'Copenhagen (2 sett x 6–8/side)',
    'Kjarni: anti-extension, anti-rotation, lateral (3 æfingar x 2 sett)'
  ];

  return { status: 'ok', dagur, readiness, focus, traffic, stefna, lota, volume, sett, stod, type: isPractice ? 'practice' : profile.category, load: load, dayType: typeRaw };
}

function isStrengthExposure(stefna) {
  return stefna === 'Anchor' || stefna === 'Maintenance';
}
function isPowerExposure(stefna) {
  return stefna === 'Primer' || stefna === 'Maintenance' || stefna === 'Anchor';
}
function isPlyoExposure(stefna) {
  return stefna === 'Primer' || stefna === 'Maintenance';
}

function applyWeeklyRules(weekSchedule, context) {
  const rulesLog = ['Anchor bannað á rauðum dögum', 'Anchor bannað á leik/frí', 'Að hámarki 1 anchor á viku'];
  const residualLog = [];
  let anchorCount = 0;
  let hasGreen = false;
  const gamesThisWeek = weekSchedule.filter(d => normalizeDayType(d.dagskra || d.type || '') === 'Game').length;
  const maintenanceBaseCap = gamesThisWeek === 0 ? 3 : gamesThisWeek === 1 ? 2 : 1;
  rulesLog.push(`Viku-cap: max ${maintenanceBaseCap} Maintenance`); 
  rulesLog.push('Auto-rest days virkjaðir');

  let lastStrength = typeof context.last_strength_days === 'number' ? context.last_strength_days : null;
  let lastPower = typeof context.last_power_days === 'number' ? context.last_power_days : null;
  let lastPlyo = typeof context.last_plyo_days === 'number' ? context.last_plyo_days : null;

  let maintenanceCount = 0;
  let primerCount = 0;

  const week = weekSchedule.map((d) => {
    const readiness = Number.isFinite(d.readiness) ? d.readiness : mapLoadToReadiness(d.alag);
    const focus = d.dagskra ? `${d.dagskra} + ${d.alag || ''}` : 'Hraði + styrkur';
    const type = (d.type || d.event_type || '').toLowerCase();
    const sched = (d.dagskra || '').trim();
    const dayPlan = computeDayPlan({ dagur: d.dagur, readiness, focus, type });
    const traffic = dayPlan.traffic;
    if (traffic === 'grænt') hasGreen = true;

    let stefna = dayPlan.stefna;
    let note = null;

    const allowedForAnchor = (normalizeDayType(sched) === 'Mechanical') && traffic === 'grænt';
    const needStrengthMaint = lastStrength !== null && lastStrength >= 7;
    const needStrengthAnchor = lastStrength !== null && lastStrength >= 10;
    const needPowerTouch = lastPower !== null && lastPower >= 5;
    const needPowerHigh = lastPower !== null && lastPower >= 7;
    const needPlyo = lastPlyo !== null && lastPlyo >= 7;
    let weeklyMaintenanceCap = maintenanceBaseCap;
    if (needStrengthMaint || needStrengthAnchor) weeklyMaintenanceCap = Math.min(maintenanceBaseCap + 1, 4);
    if (gamesThisWeek >= 2 && weeklyMaintenanceCap > 2) weeklyMaintenanceCap = 2;

    // Hard constraints
    const schedNorm = normalizeDayType(sched);
    if (traffic === 'rautt') {
      stefna = 'Primer';
      if (schedNorm === 'Game' || schedNorm === 'Day-Off') stefna = '—';
    } else if (schedNorm === 'Game' || schedNorm === 'Day-Off') {
      stefna = schedNorm === 'Day-Off' ? '—' : 'Primer';
    } else if (schedNorm === 'Game Preparation') {
      stefna = 'Primer';
    } else if (traffic === 'gult') {
      stefna = 'Maintenance';
    } else if (traffic === 'grænt') {
      stefna = 'Maintenance';
      if (allowedForAnchor && anchorCount === 0) {
        stefna = 'Anchor';
      }
    }

    // Residual overrides for strength
    if (needStrengthAnchor && allowedForAnchor && anchorCount === 0) {
      stefna = 'Anchor';
      note = 'Anchor: 10+ dagar frá styrk';
      residualLog.push('Styrkur: 10+ dagar → Anchor');
    } else if (needStrengthMaint && stefna !== 'Anchor' && traffic !== 'rautt' && sched !== 'Leikur' && sched !== 'Frí') {
      stefna = 'Maintenance';
      note = note || 'Viðhald: 7+ dagar frá styrk';
      residualLog.push('Styrkur: 7+ dagar → Maintenance touch');
    }

    // Residual overrides for power
    if (needPowerHigh && traffic !== 'rautt' && sched !== 'Leikur' && sched !== 'Frí') {
      if (stefna === 'Maintenance' || stefna === 'Primer' || stefna === 'Anchor') {
        note = note || 'Power touch: 7+ dagar';
        residualLog.push('Power: 7+ dagar → touch');
      }
    } else if (needPowerTouch && traffic !== 'rautt' && sched !== 'Leikur' && sched !== 'Frí') {
      if (stefna === 'Maintenance' || stefna === 'Primer') {
        note = note || 'Power touch: 5+ dagar';
        residualLog.push('Power: 5+ dagar → touch');
      }
    }

    // Plyo touch
    if (needPlyo && (stefna === 'Primer' || stefna === 'Maintenance') && traffic !== 'rautt') {
      note = note || 'Plyo touch: 7+ dagar';
      residualLog.push('Plyo: 7+ dagar → touch');
    }

    // Anchor hard limits
    if (!hasGreen && stefna === 'Anchor') {
      stefna = 'Maintenance';
      note = note || 'Enginn grænn dagur: enginn anchor';
    }
    if (stefna === 'Anchor' && (!allowedForAnchor)) {
      stefna = 'Maintenance';
      note = note || 'Regla: Anchor aðeins á grænum Æfing/Tækni';
    }
    if (stefna === 'Anchor' && anchorCount >= 1) {
      stefna = 'Maintenance';
      note = note || 'Regla: max 1 anchor';
    }

    // Minutes
    let minutur = '';
    if (stefna === 'Primer') minutur = '12–18 mín';
    else if (stefna === 'Maintenance') minutur = '10–15 mín';
    else if (stefna === 'Anchor') minutur = gamesThisWeek >= 2 ? '15–20 mín (létt anchor)' : '20–25 mín';

    // Weekly caps enforcement
    if (stefna === 'Anchor' && anchorCount + 1 > 1) {
      stefna = 'Maintenance';
      note = note || 'Viku-cap: aðeins 1 Anchor';
    }
    if (stefna === 'Maintenance' && maintenanceCount + 1 > weeklyMaintenanceCap) {
      stefna = '—';
      minutur = '';
      note = note || 'Viku-cap náð (maintenance limit)';
    }
    if (stefna === 'Primer' && primerCount + 1 > 2) {
      stefna = '—';
      minutur = '';
      note = note || 'Viku-cap náð (primer limit)';
    }

    // Update counts after final decision
    if (stefna === 'Anchor') anchorCount += 1;
    if (stefna === 'Maintenance') maintenanceCount += 1;
    if (stefna === 'Primer') primerCount += 1;

    // Update residual counters
    const strengthHit = isStrengthExposure(stefna);
    const powerHit = isPowerExposure(stefna);
    const plyoHit = isPlyoExposure(stefna);

    if (lastStrength !== null) lastStrength = strengthHit ? 0 : lastStrength + 1;
    if (lastPower !== null) lastPower = powerHit ? 0 : lastPower + 1;
    if (lastPlyo !== null) lastPlyo = plyoHit ? 0 : lastPlyo + 1;

    return { ...dayPlan, stefna, minutur, residual_note: note };
  });

  if (!hasGreen) rulesLog.push('Enginn grænn dagur: enginn anchor');

  return {
    week,
    rulesLog,
    residualLog,
    residuals: {
      start: {
        strength: context.last_strength_days ?? null,
        power: context.last_power_days ?? null,
        plyo: context.last_plyo_days ?? null
      },
      end: {
        strength: lastStrength ?? null,
        power: lastPower ?? null,
        plyo: lastPlyo ?? null
      }
    }
  };
}

exports.handler = async (event) => {
  if (event.httpMethod && event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ status: 'error', message: 'Nota POST' }) };
  }

  let body = {};
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ status: 'error', message: 'Ógilt JSON' }) };
  }

  if (Array.isArray(body.week_schedule)) {
    const context = body.week_context || {};
    const { week, rulesLog, residualLog, residuals } = applyWeeklyRules(body.week_schedule, context);
    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'ok', week_start: body.week_start || 'Þessi vika', week, rules_log: rulesLog, residuals_log: residualLog, residuals_start: residuals.start, residuals_end: residuals.end })
    };
  }

  const result = computeDayPlan(body);
  return { statusCode: 200, body: JSON.stringify(result) };
};

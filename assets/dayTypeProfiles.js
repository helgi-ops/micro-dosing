export const DAY_TYPE_OPTIONS = [
  "Restart",
  "Mechanical",
  "Locomotive",
  "Top-Up",
  "Game Preparation",
  "Recovery",
  "Game",
  "Day-Off"
];

export const DAY_TYPE_MAP_LEGACY = {
  "Æfing": "Mechanical",
  "Leikur": "Game",
  "Frí": "Day-Off",
  "Endurheimt": "Recovery",
  "Ferð": "Day-Off"
};

export const DAY_TYPE_PROFILES = {
  "Restart": {
    category: "practice",
    defaultLoad: "Low",
    allowedLoads: ["Low", "Moderate"],
    exposure: { mechanical: "Low", locomotive: "Low", plyo: "None" },
    constraints: { maxIntensity: "Moderate" }
  },
  "Mechanical": {
    category: "practice",
    defaultLoad: "Moderate",
    allowedLoads: ["Moderate", "High"],
    exposure: { mechanical: "High", locomotive: "Low", plyo: "Low" }
  },
  "Locomotive": {
    category: "practice",
    defaultLoad: "Moderate",
    allowedLoads: ["Moderate", "High"],
    exposure: { mechanical: "Low", locomotive: "High", plyo: "Low" }
  },
  "Top-Up": {
    category: "practice",
    defaultLoad: "Low",
    allowedLoads: ["Low", "Moderate"],
    exposure: { mechanical: "Low", locomotive: "Low", plyo: "Low" }
  },
  "Game Preparation": {
    category: "practice",
    defaultLoad: "Low",
    allowedLoads: ["Low"],
    exposure: { mechanical: "Low", locomotive: "Low", plyo: "None" },
    constraints: { maxIntensity: "Low", disallowHeavy: true, disallowHighPlyo: true }
  },
  "Recovery": {
    category: "recovery",
    defaultLoad: "Low",
    allowedLoads: ["Low"],
    exposure: { mechanical: "None", locomotive: "None", plyo: "None" }
  },
  "Game": {
    category: "game",
    defaultLoad: "High",
    allowedLoads: ["High"],
    exposure: { mechanical: "High", locomotive: "High", plyo: "Moderate" }
  },
  "Day-Off": {
    category: "off",
    defaultLoad: "Low",
    allowedLoads: ["Low"],
    exposure: { mechanical: "None", locomotive: "None", plyo: "None" }
  }
};

export function normalizeDayType(value) {
  if (!value) return "";
  return DAY_TYPE_MAP_LEGACY[value] || value;
}

export function getDayTypeProfile(dayType) {
  const norm = normalizeDayType(dayType);
  return DAY_TYPE_PROFILES[norm] || DAY_TYPE_PROFILES["Mechanical"];
}

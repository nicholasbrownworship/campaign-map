// ====== CONFIG ======

// Storage keys
const STORAGE_KEY = "bastiorMapState_v2";
const LOG_STORAGE_KEY = "bastiorMapLog_v2";
const CAMPAIGN_KEY = "bastiorCampaignState_v1";

// Victory condition baselines (tweak as you like)
const VICTORY_CONFIG = {
  fullControlWorlds: 4,
  strategicTarget: 12,
};

// Territories with adjacency and effects
const TERRITORIES = [
  {
    id: "bastior-prime",
    name: "Bastior Prime",
    region: "Core Bastior Cluster",
    x: 50,
    y: 40,
    strategicValue: 5,
    neighbors: ["kalluron", "gryphus", "dornspire"],
    effect75: "Defending faction gains a minor logistics bonus.",
    effect100: "Defending faction unlocks a major command buff.",
  },
  {
    id: "kalluron",
    name: "Kalluron",
    region: "Core Bastior Cluster",
    x: 34,
    y: 28,
    strategicValue: 4,
    neighbors: ["bastior-prime", "vyrdos", "serephon"],
    effect75: "Improved reserves on nearby worlds.",
    effect100: "Air superiority in adjacent battles.",
  },
  {
    id: "vyrdos",
    name: "Vyrdos",
    region: "Outer Bastior Rim",
    x: 70,
    y: 28,
    strategicValue: 3,
    neighbors: ["bastior-prime", "kalluron", "marrowfall"],
    effect75: "Extra CP when attacking from this world.",
    effect100: "Deep-strike incursions are more reliable.",
  },
  {
    id: "serephon",
    name: "Serephon",
    region: "Outer Bastior Rim",
    x: 22,
    y: 52,
    strategicValue: 2,
    neighbors: ["kalluron", "dornspire", "hallowdeep"],
    effect75: "Defenders gain re-roll support on the flank.",
    effect100: "Flank is considered heavily fortified.",
  },
  {
    id: "marrowfall",
    name: "Marrowfall Reach",
    region: "Siege Line Worlds",
    x: 78,
    y: 58,
    strategicValue: 4,
    neighbors: ["vyrdos", "gryphus", "voidmere"],
    effect75: "Improved attrition rolls in siege missions.",
    effect100: "Siege lines become nearly unbreakable.",
  },
  {
    id: "gryphus",
    name: "Gryphus Gate",
    region: "Siege Line Worlds",
    x: 58,
    y: 66,
    strategicValue: 3,
    neighbors: ["bastior-prime", "marrowfall", "dornspire", "voidmere"],
    effect75: "Bonus to strategic reserves.",
    effect100: "Controls a critical warp corridor.",
  },
  {
    id: "dornspire",
    name: "Dornspire",
    region: "Fortress Satellites",
    x: 40,
    y: 63,
    strategicValue: 3,
    neighbors: ["bastior-prime", "serephon", "gryphus", "hallowdeep"],
    effect75: "Garrison units gain hardened cover.",
    effect100: "Counts as a bastion for victory conditions.",
  },
  {
    id: "hallowdeep",
    name: "Hallowdeep",
    region: "Shadow Bastions",
    x: 16,
    y: 75,
    strategicValue: 2,
    neighbors: ["serephon", "dornspire"],
    effect75: "Ambush attacks are more effective.",
    effect100: "Shadow forces spread into nearby sectors.",
  },
  {
    id: "voidmere",
    name: "Voidmere",
    region: "Shadow Bastions",
    x: 83,
    y: 78,
    strategicValue: 1,
    neighbors: ["marrowfall", "gryphus"],
    effect75: "Naval interdiction hampers enemy movement.",
    effect100: "Host faction dominates nearby void lanes.",
  },
];

const CONTROL_STEPS = [0, 25, 75, 100];

const FACTIONS = {
  unclaimed: "Unclaimed",
  defenders: "Defenders",
  attackers: "Attackers",
  raiders: "Raiders",
};

// ====== STATE ======

/**
 * mapState[territoryId] = {
 *   faction: "defenders" | "attackers" | "raiders" | "unclaimed",
 *   control: 0 | 25 | 75 | 100,
 *   safe: boolean,
 *   lockedThisTurn: boolean
 * }
 */
let mapState = {};
let logEntries = [];
let campaignState = { turn: 1 };
let selectedId = null;

// ====== DOM ======

const mapEl = document.getElementById("map");
const showNamesToggle = document.getElementById("showNamesToggle");
const targetFactionSelect = document.getElementById("targetFactionSelect");

const noSelectionEl = document.getElementById("noSelection");
const selectionPanelEl = document.getElementById("selectionPanel");
const territoryNameEl = document.getElementById("territoryName");
const territoryRegionEl = document.getElementById("territoryRegion");
const territoryValueEl = document.getElementById("territoryValue");
const factionSelectEl = document.getElementById("factionSelect");
const controlPercentEl = document.getElementById("controlPercent");
const controlLabelEl = document.getElementById("controlLabel");
const effect75El = document.getElementById("effect75");
const effect100El = document.getElementById("effect100");
const effect75TextEl = effect75El.querySelector(".effect-text");
const effect100TextEl = effect100El.querySelector(".effect-text");
const safeToggleEl = document.getElementById("safeToggle");
const lockedThisTurnToggleEl = document.getElementById("lockedThisTurnToggle");

const decreaseControlBtn = document.getElementById("decreaseControlBtn");
const increaseControlBtn = document.getElementById("increaseControlBtn");
const cycleControlBtn = document.getElementById("cycleControlBtn");

const battleAttackerSelectEl = document.getElementById("battleAttackerSelect");
const battleDefenderSelectEl = document.getElementById("battleDefenderSelect");
const battleNameInputEl = document.getElementById("battleNameInput");
const battlePointsInputEl = document.getElementById("battlePointsInput");
const attackerWinBtn = document.getElementById("attackerWinBtn");
const defenderWinBtn = document.getElementById("defenderWinBtn");

const resetMapBtn = document.getElementById("resetMapBtn");
const clearLogBtn = document.getElementById("clearLogBtn");
const logListEl = document.getElementById("logList");
const turnLabelEl = document.getElementById("turnLabel");
const nextTurnBtn = document.getElementById("nextTurnBtn");
const victoryBannerEl = document.getElementById("victoryBanner");
const factionOverviewEl = document.getElementById("factionOverview");

// ====== INIT ======

init();

function init() {
  loadState();
  renderMap();
  hookEvents();
  renderLog();
  updateTurnLabel();
  updateCampaignMeta();
}

// ====== STATE LOAD/SAVE ======

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      mapState = JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to parse map state:", e);
  }

  TERRITORIES.forEach((t) => {
    if (!mapState[t.id]) {
      mapState[t.id] = {
        faction: "unclaimed",
        control: 0,
        safe: false,
        lockedThisTurn: false,
      };
    } else {
      // Ensure new fields exist
      if (typeof mapState[t.id].safe === "undefined") {
        mapState[t.id].safe = false;
      }
      if (typeof mapState[t.id].lockedThisTurn === "undefined") {
        mapState[t.id].lockedThisTurn = false;
      }
    }
  });

  try {
    const logRaw = localStorage.getItem(LOG_STORAGE_KEY);
    if (logRaw) {
      logEntries = JSON.parse(logRaw);
    }
  } catch (e) {
    console.error("Failed to parse log:", e);
  }

  try {
    const campaignRaw = localStorage.getItem(CAMPAIGN_KEY);
    if (campaignRaw) {
      campaignState = JSON.parse(campaignRaw);
    }
  } catch (e) {
    console.error("Failed to parse campaign state:", e);
  }

  if (!campaignState || typeof campaignState.turn !== "number") {
    campaignState = { turn: 1 };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mapState));
}

function saveLog() {
  localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logEntries));
}

function saveCampaign() {
  localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(campaignState));
}

// ====== MAP RENDERING ======

function renderMap() {
  mapEl.innerHTML = "";

  TERRITORIES.forEach((t) => {
    const state = mapState[t.id];

    const node = document.createElement("button");
    node.className = "territory-node";
    node.dataset.id = t.id;
    node.style.left = `${t.x}%`;
    node.style.top = `${t.y}%`;

    const core = document.createElement("div");
    core.className = "node-core";
    node.appendChild(core);

    const label = document.createElement("div");
    label.className = "territory-label";
    label.textContent = t.name;
    node.appendChild(label);

    applyNodeClasses(node, state);

    node.addEventListener("click", () => {
      onSelectTerritory(t.id);
    });

    mapEl.appendChild(node);
  });

  updateLabelVisibility();
  updateTargetHighlighting();
}

function applyNodeClasses(node, state) {
  node.className = "territory-node";

  // Faction
  node.classList.add(`faction-${state.faction}`);

  // Control
  node.classList.add(`control-${state.control}`);

  // Safe
  if (state.safe) {
    node.classList.add("safe");
  }

  // Locked this turn
  if (state.lockedThisTurn) {
    node.classList.add("locked-turn");
  }

  // Selection
  if (node.dataset.id === selectedId) {
    node.classList.add("selected");
  }

  // Target highlighting will be applied separately
}

function updateLabelVisibility() {
  const show = showNamesToggle.checked;
  mapEl.querySelectorAll(".territory-label").forEach((label) => {
    label.style.display = show ? "block" : "none";
  });
}

// ====== SELECTION & SIDEBAR ======

function onSelectTerritory(id) {
  selectedId = id;

  mapEl.querySelectorAll(".territory-node").forEach((node) => {
    node.classList.toggle("selected", node.dataset.id === id);
  });

  const t = TERRITORIES.find((x) => x.id === id);
  const state = mapState[id];

  noSelectionEl.classList.add("hidden");
  selectionPanelEl.classList.remove("hidden");

  territoryNameEl.textContent = t.name;
  territoryRegionEl.textContent = t.region;
  territoryValueEl.textContent = `${t.strategicValue}`;

  factionSelectEl.value = state.faction;
  controlPercentEl.textContent = `${state.control}%`;
  updateControlLabel(state.control);

  effect75TextEl.textContent = t.effect75 || "No special rule defined.";
  effect100TextEl.textContent = t.effect100 || "No special rule defined.";
  updateEffectHighlight(state.control);

  safeToggleEl.checked = state.safe;
  lockedThisTurnToggleEl.checked = state.lockedThisTurn;

  // Clear battle helper inputs
  battleNameInputEl.value = "";
  battlePointsInputEl.value = "";
}

function updateControlLabel(control) {
  controlLabelEl.classList.remove("pill-high", "pill-critical");
  controlLabelEl.classList.add("pill-neutral");

  if (control === 0) {
    controlLabelEl.textContent = "Contested / Unheld";
  } else if (control === 25) {
    controlLabelEl.textContent = "Foothold";
  } else if (control === 75) {
    controlLabelEl.textContent = "Dominant Presence";
    controlLabelEl.classList.remove("pill-neutral");
    controlLabelEl.classList.add("pill-high");
  } else if (control === 100) {
    controlLabelEl.textContent = "Total Control";
    controlLabelEl.classList.remove("pill-neutral");
    controlLabelEl.classList.add("pill-critical");
  } else {
    controlLabelEl.textContent = "Unknown";
  }
}

function updateEffectHighlight(control) {
  effect75El.classList.remove("active");
  effect100El.classList.remove("active");

  if (control === 75) {
    effect75El.classList.add("active");
  } else if (control === 100) {
    effect100El.classList.add("active");
  }
}

// ====== EVENT HOOKS ======

function hookEvents() {
  showNamesToggle.addEventListener("change", updateLabelVisibility);
  targetFactionSelect.addEventListener("change", updateTargetHighlighting);

  factionSelectEl.addEventListener("change", () => {
    if (!selectedId) return;
    const t = TERRITORIES.find((x) => x.id === selectedId);
    const state = mapState[selectedId];
    const oldFaction = state.faction;
    state.faction = factionSelectEl.value;
    saveState();

    const node = mapEl.querySelector(`.territory-node[data-id="${selectedId}"]`);
    if (node) applyNodeClasses(node, state);

    log(`${t.name}: controlling faction set to ${FACTIONS[state.faction]} (was ${FACTIONS[oldFaction]}).`);
    updateCampaignMeta();
  });

  decreaseControlBtn.addEventListener("click", () => adjustControl(-1));
  increaseControlBtn.addEventListener("click", () => adjustControl(1));
  cycleControlBtn.addEventListener("click", () => cycleControl());

  safeToggleEl.addEventListener("change", () => {
    if (!selectedId) return;
    const t = TERRITORIES.find((x) => x.id === selectedId);
    const state = mapState[selectedId];
    state.safe = safeToggleEl.checked;
    saveState();

    const node = mapEl.querySelector(`.territory-node[data-id="${selectedId}"]`);
    if (node) applyNodeClasses(node, state);

    log(`${t.name}: marked as ${state.safe ? "SAFE (locked from attack)" : "no longer safe"}.`);
    updateCampaignMeta();
  });

  lockedThisTurnToggleEl.addEventListener("change", () => {
    if (!selectedId) return;
    const t = TERRITORIES.find((x) => x.id === selectedId);
    const state = mapState[selectedId];
    state.lockedThisTurn = lockedThisTurnToggleEl.checked;
    saveState();

    const node = mapEl.querySelector(`.territory-node[data-id="${selectedId}"]`);
    if (node) applyNodeClasses(node, state);

    log(`${t.name}: battle slot for this turn ${state.lockedThisTurn ? "used" : "cleared"}.`);
    updateCampaignMeta();
  });

  attackerWinBtn.addEventListener("click", () => {
    resolveBattle("attacker");
  });
  defenderWinBtn.addEventListener("click", () => {
    resolveBattle("defender");
  });

  resetMapBtn.addEventListener("click", () => {
    const sure = confirm(
      "Reset all territories to Unclaimed / 0% control and clear safe/lock flags? This does not reset the campaign turn or log."
    );
    if (!sure) return;

    TERRITORIES.forEach((t) => {
      mapState[t.id] = {
        faction: "unclaimed",
        control: 0,
        safe: false,
        lockedThisTurn: false,
      };
    });
    saveState();
    renderMap();
    selectedId = null;
    selectionPanelEl.classList.add("hidden");
    noSelectionEl.classList.remove("hidden");
    log("Global reset: all territories set to Unclaimed / 0% control.");
    updateCampaignMeta();
  });

  clearLogBtn.addEventListener("click", () => {
    const sure = confirm("Clear the campaign log? This cannot be undone.");
    if (!sure) return;
    logEntries = [];
    saveLog();
    renderLog();
  });

  nextTurnBtn.addEventListener("click", () => {
    campaignState.turn += 1;
    saveCampaign();
    updateTurnLabel();

    // Clear per-turn locks
    TERRITORIES.forEach((t) => {
      mapState[t.id].lockedThisTurn = false;
    });
    saveState();
    renderMap();

    log(`=== Campaign Turn ${campaignState.turn} begins. Per-turn locks cleared. ===`);
    updateCampaignMeta();
  });
}

// ====== CONTROL HELPERS ======

function adjustControl(direction) {
  if (!selectedId) return;

  const stepDelta = direction > 0 ? 1 : -1;
  const state = mapState[selectedId];
  const currentIndex = CONTROL_STEPS.indexOf(state.control);
  if (currentIndex === -1) return;

  let newIndex = currentIndex + stepDelta;
  if (newIndex < 0) newIndex = 0;
  if (newIndex >= CONTROL_STEPS.length) newIndex = CONTROL_STEPS.length - 1;

  const newControl = CONTROL_STEPS[newIndex];
  if (newControl === state.control) return;

  const t = TERRITORIES.find((x) => x.id === selectedId);
  const oldControl = state.control;
  state.control = newControl;
  saveState();

  controlPercentEl.textContent = `${newControl}%`;
  updateControlLabel(newControl);
  updateEffectHighlight(newControl);

  const node = mapEl.querySelector(`.territory-node[data-id="${selectedId}"]`);
  if (node) applyNodeClasses(node, state);

  log(`${t.name}: control changed from ${oldControl}% to ${newControl}%.`);
  updateCampaignMeta();
}

function cycleControl() {
  if (!selectedId) return;
  const state = mapState[selectedId];
  const currentIndex = CONTROL_STEPS.indexOf(state.control);
  const nextIndex = (currentIndex + 1) % CONTROL_STEPS.length;
  const newControl = CONTROL_STEPS[nextIndex];

  const t = TERRITORIES.find((x) => x.id === selectedId);
  const oldControl = state.control;
  state.control = newControl;
  saveState();

  controlPercentEl.textContent = `${newControl}%`;
  updateControlLabel(newControl);
  updateEffectHighlight(newControl);

  const node = mapEl.querySelector(`.territory-node[data-id="${selectedId}"]`);
  if (node) applyNodeClasses(node, state);

  log(`${t.name}: control cycled from ${oldControl}% to ${newControl}%.`);
  updateCampaignMeta();
}

// ====== BATTLE RESOLUTION ======

function resolveBattle(winner) {
  if (!selectedId) return;

  const attackerFaction = battleAttackerSelectEl.value;
  const defenderFaction = battleDefenderSelectEl.value;

  if (!attackerFaction || !defenderFaction) {
    alert("Select both attacker and defender factions before resolving the battle.");
    return;
  }
  if (attackerFaction === defenderFaction) {
    alert("Attacker and defender cannot be the same faction.");
    return;
  }

  const t = TERRITORIES.find((x) => x.id === selectedId);
  const state = mapState[selectedId];

  const preFaction = state.faction;
  const preControl = state.control;

  // Simple approximation of your described rules:
  // - Attackers: 0 → 25 → 75 → 100
  // - Defenders: if defending faction already holds the world at 75% and wins again,
  //   they jump to 100% and the world becomes safe.

  if (winner === "attacker") {
    // Attacker wins
    state.faction = attackerFaction;

    const idx = CONTROL_STEPS.indexOf(state.control);
    const newIdx = Math.min(CONTROL_STEPS.length - 1, idx + 1);
    state.control = CONTROL_STEPS[newIdx];
    state.safe = false; // newly captured worlds aren't auto-safe
  } else {
    // Defender wins
    state.faction = defenderFaction;

    if (preFaction === defenderFaction && preControl === 75) {
      // “Second win” case: defender goes to 100 and world is safe
      state.control = 100;
      state.safe = true;
    } else if (preFaction === defenderFaction && preControl < 75) {
      // Defender consolidates from a lower level
      state.control = 75;
      state.safe = false;
    } else if (preFaction !== defenderFaction && preControl > 0) {
      // World was held by someone else; reset them and give defender 75%
      state.control = 75;
      state.safe = false;
    } else if (preFaction === defenderFaction && preControl === 100) {
      // Already maxed
      state.control = 100;
    } else {
      // Default: give defender a strong hold
      state.control = 75;
    }
  }

  // Mark the world as "used" this turn
  state.lockedThisTurn = true;

  saveState();

  // Update UI
  controlPercentEl.textContent = `${state.control}%`;
  updateControlLabel(state.control);
  updateEffectHighlight(state.control);
  safeToggleEl.checked = state.safe;
  lockedThisTurnToggleEl.checked = state.lockedThisTurn;

  const node = mapEl.querySelector(`.territory-node[data-id="${selectedId}"]`);
  if (node) applyNodeClasses(node, state);

  // Build log message
  const battleName = battleNameInputEl.value.trim();
  const battlePoints = battlePointsInputEl.value.trim();

  const winnerFactionName =
    winner === "attacker" ? FACTIONS[attackerFaction] : FACTIONS[defenderFaction];
  const loserFactionName =
    winner === "attacker" ? FACTIONS[defenderFaction] : FACTIONS[attackerFaction];

  let msg = `Turn ${campaignState.turn}: ${t.name} – ${winnerFactionName} victory over ${loserFactionName}. `;
  msg += `Control now ${FACTIONS[state.faction]} @ ${state.control}%.`;
  if (state.safe) msg += " Marked SAFE.";

  if (battleName) msg += ` Mission: ${battleName}.`;
  if (battlePoints) msg += ` Points: ${battlePoints}.`;

  log(msg);

  // Clear helper fields for next battle
  battleNameInputEl.value = "";
  battlePointsInputEl.value = "";

  updateCampaignMeta();
}

// ====== TARGETING & ADJACENCY ======

function updateTargetHighlighting() {
  const attackingFaction = targetFactionSelect.value;

  mapEl.querySelectorAll(".territory-node").forEach((node) => {
    const id = node.dataset.id;
    const state = mapState[id];

    node.classList.remove("target-legal", "target-illegal");

    if (!attackingFaction) {
      // No highlighting
      return;
    }

    if (isAttackable(id, attackingFaction)) {
      node.classList.add("target-legal");
    } else {
      node.classList.add("target-illegal");
    }
  });
}

function isAttackable(territoryId, attackingFaction) {
  const state = mapState[territoryId];

  // Cannot attack if safe or already used this turn
  if (state.safe || state.lockedThisTurn) return false;

  // Cannot attack if already yours
  if (state.faction === attackingFaction) return false;

  // Unclaimed worlds adjacent to your holdings are valid
  const territory = TERRITORIES.find((t) => t.id === territoryId);
  if (!territory) return false;

  // Check adjacency
  const neighbors = territory.neighbors || [];
  const hasAdjacentWorld = neighbors.some((nid) => {
    const ns = mapState[nid];
    return ns && ns.faction === attackingFaction;
  });

  // If you have an adjacent world or it's unclaimed anywhere, it's attackable
  if (hasAdjacentWorld) return true;

  // Optionally, allow attacking unclaimed worlds from anywhere
  if (state.faction === "unclaimed") return true;

  return false;
}

// ====== TURN HANDLING ======

function updateTurnLabel() {
  turnLabelEl.textContent = `Turn ${campaignState.turn}`;
}

// ====== CAMPAIGN META: OVERVIEW & VICTORY ======

function updateCampaignMeta() {
  renderFactionOverview();
  checkVictoryConditions();
  updateTargetHighlighting();
}

function renderFactionOverview() {
  const factions = ["defenders", "attackers", "raiders"];
  const stats = {
    defenders: { worlds100: 0, worlds75: 0, worlds25: 0, strategic100: 0, buffs: [] },
    attackers: { worlds100: 0, worlds75: 0, worlds25: 0, strategic100: 0, buffs: [] },
    raiders: { worlds100: 0, worlds75: 0, worlds25: 0, strategic100: 0, buffs: [] },
  };

  TERRITORIES.forEach((t) => {
    const s = mapState[t.id];
    if (!s) return;
    if (s.faction === "unclaimed") return;

    const bucket = stats[s.faction];
    if (!bucket) return;

    if (s.control === 100) {
      bucket.worlds100 += 1;
      bucket.strategic100 += t.strategicValue;
      if (t.effect100) {
        bucket.buffs.push(`${t.name}: ${t.effect100}`);
      }
    } else if (s.control === 75) {
      bucket.worlds75 += 1;
      if (t.effect75) {
        bucket.buffs.push(`${t.name}: ${t.effect75}`);
      }
    } else if (s.control === 25) {
      bucket.worlds25 += 1;
    }
  });

  factionOverviewEl.innerHTML = "";

  factions.forEach((key) => {
    const data = stats[key];

    const card = document.createElement("div");
    card.className = "faction-card";

    const header = document.createElement("div");
    header.className = "faction-card-header";

    const nameEl = document.createElement("div");
    nameEl.className = "faction-name";
    const dot = document.createElement("span");
    dot.className = `faction-dot ${key}`;
    const label = document.createElement("span");
    label.textContent = FACTIONS[key];

    nameEl.appendChild(dot);
    nameEl.appendChild(label);

    const scoreEl = document.createElement("div");
    scoreEl.className = "faction-score";
    scoreEl.textContent = `100% worlds: ${data.worlds100} · Strategic: ${data.strategic100}`;

    header.appendChild(nameEl);
    header.appendChild(scoreEl);

    const progressBar = document.createElement("div");
    progressBar.className = "faction-progress-bar";
    const progressFill = document.createElement("div");
    progressFill.className = "faction-progress-fill";

    const progressRatio = Math.min(
      1,
      Math.max(
        data.worlds100 / VICTORY_CONFIG.fullControlWorlds,
        data.strategic100 / VICTORY_CONFIG.strategicTarget
      )
    );
    progressFill.style.width = `${Math.round(progressRatio * 100)}%`;

    progressBar.appendChild(progressFill);

    const buffsEl = document.createElement("div");
    buffsEl.className = "faction-buffs";
    if (data.buffs.length === 0) {
      buffsEl.textContent = "No active buffs from territories.";
    } else {
      buffsEl.innerHTML =
        "<strong>Active buffs:</strong> " + data.buffs.join(" · ");
    }

    card.appendChild(header);
    card.appendChild(progressBar);
    card.appendChild(buffsEl);

    factionOverviewEl.appendChild(card);
  });
}

function checkVictoryConditions() {
  const factions = ["defenders", "attackers", "raiders"];
  const stats = {};

  TERRITORIES.forEach((t) => {
    const s = mapState[t.id];
    if (!s || s.faction === "unclaimed") return;

    const key = s.faction;
    if (!stats[key]) {
      stats[key] = { worlds100: 0, strategic100: 0 };
    }
    if (s.control === 100) {
      stats[key].worlds100 += 1;
      stats[key].strategic100 += t.strategicValue;
    }
  });

  let leading = null;

  factions.forEach((key) => {
    const s = stats[key];
    if (!s) return;
    const meetsWorlds = s.worlds100 >= VICTORY_CONFIG.fullControlWorlds;
    const meetsStrategic = s.strategic100 >= VICTORY_CONFIG.strategicTarget;
    if (meetsWorlds && meetsStrategic) {
      leading = {
        faction: key,
        worlds: s.worlds100,
        strategic: s.strategic100,
      };
    }
  });

  if (leading) {
    victoryBannerEl.classList.remove("hidden");
    victoryBannerEl.textContent = `${FACTIONS[leading.faction]} are in a winning position – ${leading.worlds} fully controlled worlds and ${leading.strategic} strategic value.`;
  } else {
    victoryBannerEl.classList.add("hidden");
    victoryBannerEl.textContent = "";
  }
}

// ====== LOGGING ======

function log(message) {
  const entry = {
    timestamp: Date.now(),
    message,
  };
  logEntries.unshift(entry);
  saveLog();
  renderLog();
}

function renderLog() {
  logListEl.innerHTML = "";

  logEntries.forEach((entry) => {
    const li = document.createElement("li");
    li.className = "log-item";

    const timeSpan = document.createElement("span");
    timeSpan.className = "time";
    timeSpan.textContent = formatTime(entry.timestamp);

    const dotSpan = document.createElement("span");
    dotSpan.className = "dot";
    dotSpan.textContent = "•";

    const msgSpan = document.createElement("span");
    msgSpan.textContent = entry.message;

    li.appendChild(timeSpan);
    li.appendChild(dotSpan);
    li.appendChild(msgSpan);
    logListEl.appendChild(li);
  });
}

function formatTime(ts) {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

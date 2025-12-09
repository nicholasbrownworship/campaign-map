// ====== CONFIG ======

const STORAGE_KEY = "bastiorMapState_v1";
const LOG_STORAGE_KEY = "bastiorMapLog_v1";

// Territories: tweak these however you like.
// x/y are percentages for positioning in the map container.
const TERRITORIES = [
  {
    id: "bastior-prime",
    name: "Bastior Prime",
    region: "Core Bastior Cluster",
    x: 50,
    y: 40,
    strategicValue: 5,
  },
  {
    id: "kalluron",
    name: "Kalluron",
    region: "Core Bastior Cluster",
    x: 34,
    y: 28,
    strategicValue: 4,
  },
  {
    id: "vyrdos",
    name: "Vyrdos",
    region: "Outer Bastior Rim",
    x: 70,
    y: 28,
    strategicValue: 3,
  },
  {
    id: "serephon",
    name: "Serephon",
    region: "Outer Bastior Rim",
    x: 22,
    y: 52,
    strategicValue: 2,
  },
  {
    id: "marrowfall",
    name: "Marrowfall Reach",
    region: "Siege Line Worlds",
    x: 78,
    y: 58,
    strategicValue: 4,
  },
  {
    id: "gryphus",
    name: "Gryphus Gate",
    region: "Siege Line Worlds",
    x: 58,
    y: 66,
    strategicValue: 3,
  },
  {
    id: "dornspire",
    name: "Dornspire",
    region: "Fortress Satellites",
    x: 40,
    y: 63,
    strategicValue: 3,
  },
  {
    id: "hallowdeep",
    name: "Hallowdeep",
    region: "Shadow Bastions",
    x: 16,
    y: 75,
    strategicValue: 2,
  },
  {
    id: "voidmere",
    name: "Voidmere",
    region: "Shadow Bastions",
    x: 83,
    y: 78,
    strategicValue: 1,
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

let mapState = {}; // { [territoryId]: { faction, control, safe } }
let logEntries = []; // [{ timestamp, message }]
let selectedId = null;

// ====== DOM ======

const mapEl = document.getElementById("map");
const showNamesToggle = document.getElementById("showNamesToggle");

const noSelectionEl = document.getElementById("noSelection");
const selectionPanelEl = document.getElementById("selectionPanel");
const territoryNameEl = document.getElementById("territoryName");
const territoryRegionEl = document.getElementById("territoryRegion");
const territoryValueEl = document.getElementById("territoryValue");
const factionSelectEl = document.getElementById("factionSelect");
const controlPercentEl = document.getElementById("controlPercent");
const controlLabelEl = document.getElementById("controlLabel");
const decreaseControlBtn = document.getElementById("decreaseControlBtn");
const increaseControlBtn = document.getElementById("increaseControlBtn");
const cycleControlBtn = document.getElementById("cycleControlBtn");
const safeToggleEl = document.getElementById("safeToggle");
const resetMapBtn = document.getElementById("resetMapBtn");

const logListEl = document.getElementById("logList");
const clearLogBtn = document.getElementById("clearLogBtn");

// ====== INIT ======

init();

function init() {
  loadState();
  renderMap();
  hookEvents();
  renderLog();
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

  // Ensure every territory has state
  TERRITORIES.forEach((t) => {
    if (!mapState[t.id]) {
      mapState[t.id] = {
        faction: "unclaimed",
        control: 0,
        safe: false,
      };
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
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mapState));
}

function saveLog() {
  localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logEntries));
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
}

function applyNodeClasses(node, state) {
  node.classList.remove(
    "faction-defenders",
    "faction-attackers",
    "faction-raiders",
    "faction-unclaimed",
    "control-0",
    "control-25",
    "control-75",
    "control-100",
    "safe"
  );

  node.classList.add(`faction-${state.faction}`);
  node.classList.add(`control-${state.control}`);

  if (state.safe) {
    node.classList.add("safe");
  }

  if (node.dataset.id === selectedId) {
    node.classList.add("selected");
  } else {
    node.classList.remove("selected");
  }
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

  // update node selected state
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
  safeToggleEl.checked = state.safe;
}

// Interpret control level to a label badge
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

// ====== EVENT HOOKS ======

function hookEvents() {
  showNamesToggle.addEventListener("change", updateLabelVisibility);

  factionSelectEl.addEventListener("change", () => {
    if (!selectedId) return;
    const territory = TERRITORIES.find((t) => t.id === selectedId);
    const state = mapState[selectedId];
    const oldFaction = state.faction;
    state.faction = factionSelectEl.value;
    saveState();

    const node = mapEl.querySelector(
      `.territory-node[data-id="${selectedId}"]`
    );
    if (node) applyNodeClasses(node, state);

    log(
      `${territory.name}: faction changed from ${FACTIONS[oldFaction]} to ${
        FACTIONS[state.faction]
      }.`
    );
  });

  decreaseControlBtn.addEventListener("click", () => adjustControl(-1));
  increaseControlBtn.addEventListener("click", () => adjustControl(1));
  cycleControlBtn.addEventListener("click", () => cycleControl());

  safeToggleEl.addEventListener("change", () => {
    if (!selectedId) return;
    const territory = TERRITORIES.find((t) => t.id === selectedId);
    const state = mapState[selectedId];
    state.safe = safeToggleEl.checked;
    saveState();

    const node = mapEl.querySelector(
      `.territory-node[data-id="${selectedId}"]`
    );
    if (node) applyNodeClasses(node, state);

    log(
      `${territory.name}: marked as ${
        state.safe ? "SAFE (locked)" : "no longer safe"
      }.`
    );
  });

  resetMapBtn.addEventListener("click", () => {
    const sure = confirm(
      "Reset all territories to Unclaimed / 0% control and clear ‘safe’ flags?"
    );
    if (!sure) return;

    TERRITORIES.forEach((t) => {
      mapState[t.id] = {
        faction: "unclaimed",
        control: 0,
        safe: false,
      };
    });
    saveState();
    renderMap();
    selectedId = null;
    selectionPanelEl.classList.add("hidden");
    noSelectionEl.classList.remove("hidden");
    log("Global reset: all territories set to Unclaimed / 0% control.");
  });

  clearLogBtn.addEventListener("click", () => {
    const sure = confirm("Clear the campaign log? This cannot be undone.");
    if (!sure) return;
    logEntries = [];
    saveLog();
    renderLog();
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

  const territory = TERRITORIES.find((t) => t.id === selectedId);
  const oldControl = state.control;
  state.control = newControl;
  saveState();

  controlPercentEl.textContent = `${newControl}%`;
  updateControlLabel(newControl);

  const node = mapEl.querySelector(
    `.territory-node[data-id="${selectedId}"]`
  );
  if (node) applyNodeClasses(node, state);

  log(
    `${territory.name}: control changed from ${oldControl}% to ${newControl}%.`
  );
}

function cycleControl() {
  if (!selectedId) return;
  const state = mapState[selectedId];
  const currentIndex = CONTROL_STEPS.indexOf(state.control);
  const nextIndex = (currentIndex + 1) % CONTROL_STEPS.length;
  const newControl = CONTROL_STEPS[nextIndex];

  const territory = TERRITORIES.find((t) => t.id === selectedId);
  const oldControl = state.control;
  state.control = newControl;
  saveState();

  controlPercentEl.textContent = `${newControl}%`;
  updateControlLabel(newControl);

  const node = mapEl.querySelector(
    `.territory-node[data-id="${selectedId}"]`
  );
  if (node) applyNodeClasses(node, state);

  log(
    `${territory.name}: control cycled from ${oldControl}% to ${newControl}%.`
  );
}

// ====== LOGGING ======

function log(message) {
  const entry = {
    timestamp: Date.now(),
    message,
  };
  logEntries.unshift(entry); // newest first
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

// ---------- CONFIG / DATA ----------

const STORAGE_KEY = "bastior_crusade_map_v1";

const TERRITORIES = [
  // === DEFENDERS HOME REGION – "Bastior Reach" (top) ===
  { id: "bastior_prime",   name: "Bastior Prime",   x: 50, y: 82, z: 40 },
  { id: "trinaxis_minor",  name: "Trinaxis Minor",  x: 42, y: 88, z: 55 },
  { id: "aurum_refuge",    name: "Aurum Refuge",    x: 58, y: 90, z: 60 },

  // === RAIDERS HOME REGION – "Harkanis Fringe" (bottom-left) ===
  { id: "harkanis",        name: "Harkanis",        x: 22, y: 18, z: -45 },
  { id: "emberhold",       name: "Emberhold",       x: 30, y: 16, z: -35 },
  { id: "magnus_relay",    name: "Magnus Relay",    x: 26, y: 26, z: -20 },

  // === ATTACKERS HOME REGION – "Karst Expanse" (bottom-right) ===
  { id: "karst_forge",     name: "Karst Forge",     x: 78, y: 18, z: 35 },
  { id: "veldras_gate",    name: "Veldras Gate",    x: 86, y: 24, z: 10 },
  { id: "kethrax_deep",    name: "Kethrax Deep",    x: 74, y: 26, z: 55 },

  // === WILD SPACE – central contested region (9 worlds) ===
  { id: "voryn_crossing",  name: "Voryn Crossing",  x: 50, y: 60, z: 0 },
  { id: "osiron_spur",     name: "Osiron Spur",     x: 38, y: 60, z: -10 },
  { id: "duskfall_watch",  name: "Duskfall Watch",  x: 62, y: 64, z: 15 },
  { id: "vorun_halo",      name: "Vorun Halo",      x: 70, y: 52, z: 25 },
  { id: "cinder_wake",     name: "Cinder Wake",     x: 60, y: 44, z: -5 },
  { id: "silas_gate",      name: "Silas Gate",      x: 40, y: 44, z: -15 },
  { id: "threnos_void",    name: "Threnos Void",    x: 32, y: 52, z: 5 },
  { id: "helios_spine",    name: "Helios Spine",    x: 54, y: 34, z: -25 },
  { id: "nadir_outpost",   name: "Nadir Outpost",   x: 46, y: 40, z: -30 }
];

const WARP_LANES = [
  // === DEFENDER HOME – Bastior Reach (triangle) ===
  ["bastior_prime",  "trinaxis_minor"],
  ["trinaxis_minor", "aurum_refuge"],
  ["aurum_refuge",   "bastior_prime"],

  // === RAIDER HOME – Harkanis Fringe (triangle) ===
  ["harkanis",       "emberhold"],
  ["emberhold",      "magnus_relay"],
  ["magnus_relay",   "harkanis"],

  // === ATTACKER HOME – Karst Expanse (triangle) ===
  ["karst_forge",    "veldras_gate"],
  ["veldras_gate",   "kethrax_deep"],
  ["kethrax_deep",   "karst_forge"],

  // === Home → Wild connections (multiple paths for each team) ===
  // Defenders into wild space
  ["bastior_prime",  "voryn_crossing"],
  ["trinaxis_minor", "osiron_spur"],
  ["aurum_refuge",   "duskfall_watch"],

  // Raiders into wild space
  ["harkanis",       "threnos_void"],
  ["magnus_relay",   "silas_gate"],
  ["emberhold",      "nadir_outpost"],

  // Attackers into wild space
  ["karst_forge",    "vorun_halo"],
  ["veldras_gate",   "duskfall_watch"],
  ["kethrax_deep",   "cinder_wake"],

  // === Wild-space web (central contested region) ===
  // Large ring:
  ["voryn_crossing", "duskfall_watch"],
  ["duskfall_watch", "vorun_halo"],
  ["vorun_halo",     "cinder_wake"],
  ["cinder_wake",    "helios_spine"],
  ["helios_spine",   "silas_gate"],
  ["silas_gate",     "threnos_void"],
  ["threnos_void",   "osiron_spur"],
  ["osiron_spur",    "voryn_crossing"],

  // Extra links so it's not a single loop:
  ["nadir_outpost",  "helios_spine"],
  ["nadir_outpost",  "osiron_spur"],
  ["voryn_crossing", "nadir_outpost"],
  ["cinder_wake",    "silas_gate"]
];

// Base planet colors (no pure black)
const PLANET_BASE_COLORS = {
  bastior_prime:  0xf5d87a,
  trinaxis_minor: 0x7ac0f5,
  aurum_refuge:   0xe6f2c2,

  harkanis:       0x8c2f2f,
  emberhold:      0xff9b4d,
  magnus_relay:   0xc0c4cc,

  karst_forge:    0xffb347,
  veldras_gate:   0xa79cff,
  kethrax_deep:   0x5fd3a0,

  voryn_crossing: 0xd8d8ff,
  osiron_spur:    0xa7b4c4,
  duskfall_watch: 0x5a6791,
  vorun_halo:     0xf5f3ff,
  cinder_wake:    0x5a4a3a,
  silas_gate:     0xb7e6ff,
  threnos_void:   0x283044,
  helios_spine:   0xffebbb,
  nadir_outpost:  0x8a96a5
};


// ---------- STATE ----------

let turnNumber = 1;
let mapState = {}; // id -> { faction, control, safe, lockedUntilTurn }
let logEntries = [];
let selectedId = null;

// 3D
let scene, camera, renderer;
let territoryMeshes = {}; // id -> THREE.Mesh
let animationFrameId = null;
let mapViewportEl, canvasEl;
let raycaster, pointer;
let warpLaneGroup;

// camera / orbit
const DEFAULT_ZOOM = 0.7; // fairly zoomed out by default
let zoomFactor = DEFAULT_ZOOM;
const MIN_ZOOM = 0.45;
const MAX_ZOOM = 2.0;
const cameraBaseDistance = 520; // higher = farther away => more map visible

let orbitPhi = Math.PI / 3; // vertical angle
let orbitTheta = Math.PI / 6; // horizontal angle
let orbitTarget = new THREE.Vector3(0, 0, 0);

let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

// depth scaling
const Z_DEPTH_FACTOR = 4;

// UI elements
let turnLabelEl, zoomLabelEl;
let noSelectionEl, selectionEl;
let territoryNameEl, territoryMetaEl;
let factionSelectEl, controlPercentEl;
let safeToggleEl;
let defenderFactionSelectEl, attackerFactionSelectEl;
let logListEl;


// ---------- INIT ----------

document.addEventListener("DOMContentLoaded", () => {
  cacheDom();
  loadState();
  init3DScene();
  hookEvents();
  renderAll();
});

function cacheDom() {
  mapViewportEl = document.getElementById("mapViewport");
  canvasEl = document.getElementById("galaxyCanvas");

  turnLabelEl = document.getElementById("turnLabel");
  zoomLabelEl = document.getElementById("zoomLabel");

  noSelectionEl = document.getElementById("noSelectionState");
  selectionEl = document.getElementById("selectionState");

  territoryNameEl = document.getElementById("territoryName");
  territoryMetaEl = document.getElementById("territoryMeta");

  factionSelectEl = document.getElementById("factionSelect");
  controlPercentEl = document.getElementById("controlPercent");
  safeToggleEl = document.getElementById("safeToggle");

  defenderFactionSelectEl = document.getElementById("defenderFactionSelect");
  attackerFactionSelectEl = document.getElementById("attackerFactionSelect");

  logListEl = document.getElementById("logList");
}


// ---------- STATE LOAD/SAVE ----------

function getDefaultState() {
  const state = {};
  TERRITORIES.forEach((t) => {
    state[t.id] = {
      id: t.id,
      faction: "unclaimed",
      control: 0,
      safe: false,
      lockedUntilTurn: 0
    };
  });
  return {
    turnNumber: 1,
    mapState: state,
    logEntries: []
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const def = getDefaultState();
      turnNumber = def.turnNumber;
      mapState = def.mapState;
      logEntries = def.logEntries;
      return;
    }
    const data = JSON.parse(raw);
    turnNumber = data.turnNumber ?? 1;
    mapState = data.mapState ?? getDefaultState().mapState;
    logEntries = data.logEntries ?? [];
  } catch (e) {
    console.error("Failed to load state", e);
    const def = getDefaultState();
    turnNumber = def.turnNumber;
    mapState = def.mapState;
    logEntries = def.logEntries;
  }
}

function saveState() {
  const payload = {
    turnNumber,
    mapState,
    logEntries
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}


// ---------- 3D SETUP ----------

function init3DScene() {
  const width = mapViewportEl.clientWidth || 400;
  const height = mapViewportEl.clientHeight || 300;

  scene = new THREE.Scene();
  // no explicit background; let CSS show through

  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 3000);
  updateCameraPosition();

  renderer = new THREE.WebGLRenderer({
    canvas: canvasEl,
    antialias: true,
    alpha: true // transparent background so CSS starmap is visible
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(80, 120, 100);
  scene.add(dirLight);

  // Starfield (3D points around everything)
  const starsGeometry = new THREE.BufferGeometry();
  const starCount = 2600;
  const positions = new Float32Array(starCount * 3);
  const radius = 1100;

  for (let i = 0; i < starCount; i++) {
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = 2 * Math.PI * Math.random();
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }

  starsGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );

  const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1.7,
    sizeAttenuation: true,
    opacity: 0.85,
    transparent: true
  });

  const starField = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(starField);

  // Territory spheres
  const baseRadius = 6;
  const spread = 3.8; // how far apart points are in world units
  TERRITORIES.forEach((t) => {
    const x = (t.x - 50) * spread;
    const y = (t.y - 50) * -spread;
    const z = (t.z || 0) * Z_DEPTH_FACTOR;

    const geom = new THREE.SphereGeometry(baseRadius, 32, 32);
    const mat = new THREE.MeshPhongMaterial({
      color: 0x9ca3af,
      shininess: 40,
      specular: 0x555555,
      emissive: 0x050712 // small emissive so nothing is ever fully black
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    mesh.userData.id = t.id;

    scene.add(mesh);
    territoryMeshes[t.id] = mesh;

    applyTerritoryVisuals(t.id);
  });

  // Warp lanes between planets
  buildWarpLanes();

  // Raycaster
  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();

  // Mouse events for orbit + picking
  canvasEl.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  canvasEl.addEventListener("wheel", onWheel, { passive: false });

  window.addEventListener("resize", onWindowResize);

  animate();
}

function buildWarpLanes() {
  if (warpLaneGroup) {
    scene.remove(warpLaneGroup);
  }
  warpLaneGroup = new THREE.Group();

  const material = new THREE.LineBasicMaterial({
    color: 0x64748b,
    transparent: true,
    opacity: 0.75
  });

  WARP_LANES.forEach(([aId, bId]) => {
    const aMesh = territoryMeshes[aId];
    const bMesh = territoryMeshes[bId];
    if (!aMesh || !bMesh) return;

    const points = [aMesh.position.clone(), bMesh.position.clone()];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    warpLaneGroup.add(line);
  });

  scene.add(warpLaneGroup);
}

function animate() {
  animationFrameId = requestAnimationFrame(animate);

  Object.values(territoryMeshes).forEach((mesh) => {
    mesh.rotation.y += 0.003;
  });

  renderer.render(scene, camera);
}


// ---------- CAMERA ORBIT / ZOOM ----------

function updateCameraPosition() {
  const r = cameraBaseDistance / zoomFactor;

  const dirX = Math.sin(orbitPhi) * Math.cos(orbitTheta);
  const dirY = Math.cos(orbitPhi);
  const dirZ = Math.sin(orbitPhi) * Math.sin(orbitTheta);

  camera.position.set(
    orbitTarget.x + dirX * r,
    orbitTarget.y + dirY * r,
    orbitTarget.z + dirZ * r
  );
  camera.lookAt(orbitTarget);
  camera.updateProjectionMatrix();

  if (zoomLabelEl) {
    zoomLabelEl.textContent = `${Math.round(zoomFactor * 100)}%`;
  }
}

function onWheel(e) {
  e.preventDefault();
  if (e.deltaY < 0) {
    zoomFactor = Math.min(MAX_ZOOM, zoomFactor * 1.1);
  } else {
    zoomFactor = Math.max(MIN_ZOOM, zoomFactor / 1.1);
  }
  updateCameraPosition();
}

function onPointerDown(e) {
  const rect = canvasEl.getBoundingClientRect();
  const inside =
    e.clientX >= rect.left &&
    e.clientX <= rect.right &&
    e.clientY >= rect.top &&
    e.clientY <= rect.bottom;

  if (!inside) return;

  if (e.button === 0) {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    handlePick(e.clientX, e.clientY, rect);
  }
}

function onPointerMove(e) {
  if (!isDragging) return;

  const dx = e.clientX - lastMouseX;
  const dy = e.clientY - lastMouseY;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;

  const ROT_SPEED = 0.005;
  orbitTheta -= dx * ROT_SPEED;
  orbitPhi -= dy * ROT_SPEED;

  const EPS = 0.12;
  orbitPhi = Math.max(EPS, Math.min(Math.PI - EPS, orbitPhi));

  updateCameraPosition();
}

function onPointerUp() {
  isDragging = false;
}

function handlePick(clientX, clientY, rect) {
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(
    Object.values(territoryMeshes),
    false
  );

  if (intersects.length > 0) {
    const mesh = intersects[0].object;
    const id = mesh.userData.id;
    if (id) onSelectTerritory(id);
  }
}

function onWindowResize() {
  const width = mapViewportEl.clientWidth || 400;
  const height = mapViewportEl.clientHeight || 300;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}


// ---------- VISUALS ----------

// Ensure color never gets too dark to see
function ensureMinBrightness(color, minL = 0.4) {
  const hsl = {};
  color.getHSL(hsl);
  if (hsl.l < minL) {
    color.setHSL(hsl.h, hsl.s, minL);
  }
  return color;
}

function applyTerritoryVisuals(id) {
  const mesh = territoryMeshes[id];
  if (!mesh) return;
  const state = mapState[id];
  if (!state) return;

  const planetBase = new THREE.Color(
    PLANET_BASE_COLORS[id] !== undefined ? PLANET_BASE_COLORS[id] : 0x9ca3af
  );

  let factionColor;
  switch (state.faction) {
    case "defenders":
      factionColor = new THREE.Color(0x4ade80);
      break;
    case "attackers":
      factionColor = new THREE.Color(0xfb7185);
      break;
    case "raiders":
      factionColor = new THREE.Color(0xa855f7);
      break;
    default:
      factionColor = null;
  }

  let baseColor;
  if (!factionColor) {
    baseColor = planetBase;
  } else {
    baseColor = planetBase.clone().lerp(factionColor, 0.5);
  }

  const control = state.control || 0;
  let intensity = 0.9;
  if (control === 25) intensity = 1.0;
  if (control === 75) intensity = 1.15;
  if (control === 100) intensity = 1.3;

  const color = baseColor.clone().multiplyScalar(intensity);
  ensureMinBrightness(color, 0.4);
  mesh.material.color.copy(color);

  let scale = 1.0;
  if (control === 25) scale = 1.1;
  if (control === 75) scale = 1.25;
  if (control === 100) scale = 1.4;
  mesh.scale.set(scale, scale, scale);

  let emissive = new THREE.Color(0x050712);
  if (selectedId === id) {
    emissive = emissive.add(color.clone().multiplyScalar(0.35));
  }
  if (state.safe) {
    emissive = emissive.add(new THREE.Color(0x38bdf8).multiplyScalar(0.4));
  }
  mesh.material.emissive.copy(emissive);
}

// Center and zoom on a specific territory
function focusOnTerritory(id) {
  const mesh = territoryMeshes[id];
  if (!mesh) return;

  orbitTarget.copy(mesh.position);
  zoomFactor = Math.min(MAX_ZOOM, 1.9);
  updateCameraPosition();
}


// ---------- UI / EVENTS ----------

function hookEvents() {
  document
    .getElementById("zoomInBtn")
    .addEventListener("click", () => {
      zoomFactor = Math.min(MAX_ZOOM, zoomFactor * 1.15);
      updateCameraPosition();
    });

  document
    .getElementById("zoomOutBtn")
    .addEventListener("click", () => {
      zoomFactor = Math.max(MIN_ZOOM, zoomFactor / 1.15);
      updateCameraPosition();
    });

  document
    .getElementById("advanceTurnBtn")
    .addEventListener("click", advanceTurn);

  document
    .getElementById("resetStateBtn")
    .addEventListener("click", resetState);

  factionSelectEl.addEventListener("change", () => {
    if (!selectedId) return;
    const state = mapState[selectedId];
    state.faction = factionSelectEl.value;
    state.safe = false;
    saveState();
    applyTerritoryVisuals(selectedId);
    updateFactionOverview();
    log(
      `Control of ${getTerritoryName(selectedId)} set to ${state.faction}.`
    );
    renderLog();
  });

  safeToggleEl.addEventListener("change", () => {
    if (!selectedId) return;
    const state = mapState[selectedId];
    state.safe = safeToggleEl.checked;
    if (state.safe) {
      state.lockedUntilTurn = turnNumber + 1;
      log(
        `${getTerritoryName(
          selectedId
        )} marked Safe until turn ${state.lockedUntilTurn}.`
      );
    } else {
      state.lockedUntilTurn = 0;
      log(`${getTerritoryName(selectedId)} no longer marked Safe.`);
    }
    saveState();
    applyTerritoryVisuals(selectedId);
    renderLog();
  });

  document
    .querySelectorAll(".control-row .btn[data-control]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!selectedId) return;
        const value = parseInt(btn.getAttribute("data-control"), 10);
        const state = mapState[selectedId];
        state.control = value;
        saveState();
        applyTerritoryVisuals(selectedId);
        renderSelection();
        updateFactionOverview();
        log(
          `Control of ${getTerritoryName(selectedId)} manually set to ${value}%.`
        );
        renderLog();
      });
    });

  document
    .getElementById("defenderWinBtn")
    .addEventListener("click", () => {
      if (!selectedId) return;
      const defender = defenderFactionSelectEl.value;
      const attacker = attackerFactionSelectEl.value;
      resolveBattle(selectedId, defender, attacker, "defender");
    });

  document
    .getElementById("attackerWinBtn")
    .addEventListener("click", () => {
      if (!selectedId) return;
      const defender = defenderFactionSelectEl.value;
      const attacker = attackerFactionSelectEl.value;
      resolveBattle(selectedId, defender, attacker, "attacker");
    });
}


// ---------- RENDERING ----------

function renderAll() {
  renderTurn();
  renderSelection();
  updateFactionOverview();
  renderLog();
}

function renderTurn() {
  turnLabelEl.textContent = String(turnNumber);
  updateCameraPosition();
}

function renderSelection() {
  if (!selectedId) {
    noSelectionEl.classList.remove("hidden");
    selectionEl.classList.add("hidden");
    return;
  }

  const t = TERRITORIES.find((t) => t.id === selectedId);
  const state = mapState[selectedId];

  noSelectionEl.classList.add("hidden");
  selectionEl.classList.remove("hidden");

  territoryNameEl.textContent = t ? t.name : selectedId;
  territoryMetaEl.textContent = "Bastior Sub-Sector · Strategic World";

  factionSelectEl.value = state.faction;
  controlPercentEl.textContent = `${state.control}%`;
  safeToggleEl.checked = !!state.safe;
}

function updateFactionOverview() {
  const totals = {
    defenders: { worlds: 0, influence: 0 },
    attackers: { worlds: 0, influence: 0 },
    raiders: { worlds: 0, influence: 0 },
    unclaimed: { worlds: 0, influence: 0 }
  };

  TERRITORIES.forEach((t) => {
    const s = mapState[t.id];
    const faction = s.faction || "unclaimed";
    totals[faction].worlds += 1;
    totals[faction].influence += s.control || 0;
  });

  const factions = ["defenders", "attackers", "raiders"];
  let totalInfluence = 0;
  factions.forEach((f) => {
    totalInfluence += totals[f].influence;
  });
  if (totalInfluence === 0) totalInfluence = 1;

  updateFactionCard(
    "defenders",
    totals.defenders.worlds,
    totals.defenders.influence,
    totalInfluence
  );
  updateFactionCard(
    "attackers",
    totals.attackers.worlds,
    totals.attackers.influence,
    totalInfluence
  );
  updateFactionCard(
    "raiders",
    totals.raiders.worlds,
    totals.raiders.influence,
    totalInfluence
  );

  const unclaimedSummary = document.getElementById("unclaimedSummary");
  unclaimedSummary.textContent = `${totals.unclaimed.worlds} worlds unclaimed`;
}

function updateFactionCard(faction, worlds, influence, totalInfluence) {
  const pct = Math.round((influence / totalInfluence) * 100);
  const summaryEl = document.getElementById(`${faction}Summary`);
  const progressEl = document.getElementById(`${faction}Progress`);

  summaryEl.textContent = `${worlds} world${
    worlds === 1 ? "" : "s"
  } · ${pct}% influence`;
  progressEl.style.width = `${pct}%`;
}

function renderLog() {
  logListEl.innerHTML = "";
  logEntries
    .slice()
    .reverse()
    .forEach((entry) => {
      const li = document.createElement("li");
      li.className = "log-item";
      const time = document.createElement("span");
      time.className = "time";
      time.textContent = `[T${entry.turn}]`;
      const dot = document.createElement("span");
      dot.className = "dot";
      dot.textContent = "•";
      const msg = document.createElement("span");
      msg.textContent = entry.text;
      li.appendChild(time);
      li.appendChild(dot);
      li.appendChild(msg);
      logListEl.appendChild(li);
    });
}

function log(text) {
  logEntries.push({
    turn: turnNumber,
    text,
    ts: Date.now()
  });
  saveState();
}


// ---------- LOGIC ----------

function onSelectTerritory(id) {
  selectedId = id;
  TERRITORIES.forEach((t) => applyTerritoryVisuals(t.id));
  renderSelection();
  focusOnTerritory(id);
}

function getTerritoryName(id) {
  const t = TERRITORIES.find((t) => t.id === id);
  return t ? t.name : id;
}

function resolveBattle(territoryId, defenderFaction, attackerFaction, winner) {
  const state = mapState[territoryId];
  const worldName = getTerritoryName(territoryId);

  const currentOwner = state.faction;
  const control = state.control;
  const winningFaction =
    winner === "defender" ? defenderFaction : attackerFaction;

  if (!["defenders", "attackers", "raiders"].includes(winningFaction)) return;

  if (currentOwner === winningFaction) {
    if (control === 0) state.control = 25;
    else if (control === 25) state.control = 75;
    else if (control === 75) state.control = 100;
  } else {
    if (control <= 25 || currentOwner === "unclaimed") {
      state.faction = winningFaction;
      state.control = 75;
    } else {
      state.faction = winningFaction;
      state.control = 25;
    }
  }

  if (
    winner === "defender" &&
    state.faction === defenderFaction &&
    state.control === 100
  ) {
    state.safe = true;
    state.lockedUntilTurn = turnNumber + 1;
  } else {
    state.safe = false;
    state.lockedUntilTurn = 0;
  }

  saveState();
  applyTerritoryVisuals(territoryId);
  renderSelection();
  updateFactionOverview();

  log(
    `${
      winner === "defender" ? "Defender" : "Attacker"
    } victory at ${worldName} – new owner: ${
      state.faction
    } (${state.control}%).`
  );
  renderLog();
}

function advanceTurn() {
  turnNumber += 1;

  TERRITORIES.forEach((t) => {
    const state = mapState[t.id];
    if (state.safe && state.lockedUntilTurn <= turnNumber) {
      state.safe = false;
      state.lockedUntilTurn = 0;
      log(`${getTerritoryName(t.id)} is no longer Safe.`);
    }
  });

  saveState();
  renderTurn();
  TERRITORIES.forEach((t) => applyTerritoryVisuals(t.id));
  renderLog();
}

function resetState() {
  if (!confirm("Reset entire crusade map? This cannot be undone.")) return;
  const def = getDefaultState();
  turnNumber = def.turnNumber;
  mapState = def.mapState;
  logEntries = [];
  selectedId = null;
  saveState();
  TERRITORIES.forEach((t) => applyTerritoryVisuals(t.id));

  orbitTarget.set(0, 0, 0);
  zoomFactor = DEFAULT_ZOOM;
  updateCameraPosition();

  renderAll();
}

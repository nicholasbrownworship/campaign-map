// ---------- CONFIG / DATA ----------

const STORAGE_KEY = "bastior_crusade_map_v1";

const TERRITORIES = [
  // === DEFENDERS HOME REGION – "Bastior Reach"
  // Centered roughly above the core (angle ~90°, radius ≈ 260)
  { id: "bastior_prime",   name: "Bastior Prime",   x:   0,  y: 260, z: -70 },
  { id: "trinaxis_minor",  name: "Trinaxis Minor",  x: -55, y: 230, z: -40 },
  { id: "aurum_refuge",    name: "Aurum Refuge",    x:  50, y: 295, z: -20 },

  // === RAIDERS HOME REGION – "Harkanis Fringe"
  // Bottom-left, in front (angle ~210°, radius ≈ 260)
  { id: "harkanis",        name: "Harkanis",        x: -225, y: -130, z:  70 },
  { id: "emberhold",       name: "Emberhold",       x: -260, y: -190, z: 100 },
  { id: "magnus_relay",    name: "Magnus Relay",    x: -190, y:  -80, z:  40 },

  // === ATTACKERS HOME REGION – "Karst Expanse"
  // Bottom-right, slightly back (angle ~330°, radius ≈ 260)
  { id: "karst_forge",     name: "Karst Forge",     x:  225, y: -130, z: -10 },
  { id: "veldras_gate",    name: "Veldras Gate",    x:  275, y: -170, z:  20 },
  { id: "kethrax_deep",    name: "Kethrax Deep",    x:  190, y:  -80, z: -40 },

  // === WILD SPACE – central contested region ===
  // One at the exact origin, others with components roughly 20–110 apart
  { id: "voryn_crossing",  name: "Voryn Crossing",  x:   0,  y:   0,  z:   0 },
  { id: "osiron_spur",     name: "Osiron Spur",     x:  60, y:  30, z:  40 },
  { id: "duskfall_watch",  name: "Duskfall Watch",  x: -70, y:  25, z: -35 },
  { id: "vorun_halo",      name: "Vorun Halo",      x:  40, y: -80, z:  -6000 },
  { id: "cinder_wake",     name: "Cinder Wake",     x: -55, y: -60, z: -45 },
  { id: "silas_gate",      name: "Silas Gate",      x:  80, y:  50, z: -20 },
  { id: "threnos_void",    name: "Threnos Void",    x: -90, y:  40, z:  70 },
  { id: "helios_spine",    name: "Helios Spine",    x:  10, y: -110, z: -40 },
  { id: "nadir_outpost",   name: "Nadir Outpost",   x: -40, y:  20, z: -80 }
];

// Warp lanes reworked to match these positions and keep the graph readable.
const WARP_LANES = [
  // === DEFENDER HOME – Bastior Reach (tight triangle) ===
  ["bastior_prime",  "trinaxis_minor"],
  ["trinaxis_minor", "aurum_refuge"],
  ["aurum_refuge",   "bastior_prime"],

  // === RAIDER HOME – Harkanis Fringe (tight triangle) ===
  ["harkanis",       "emberhold"],
  ["emberhold",      "magnus_relay"],
  ["magnus_relay",   "harkanis"],

  // === ATTACKER HOME – Karst Expanse (tight triangle) ===
  ["karst_forge",    "veldras_gate"],
  ["veldras_gate",   "kethrax_deep"],
  ["kethrax_deep",   "karst_forge"],

  // === Home → Wild-space connections (each region has multiple gates) ===
  // Defenders into wild space (top down toward the core)
  ["bastior_prime",  "voryn_crossing"],
  ["trinaxis_minor", "duskfall_watch"],
  ["aurum_refuge",   "silas_gate"],

  // Raiders into wild space (bottom-left up toward the core)
  ["harkanis",       "threnos_void"],
  ["magnus_relay",   "cinder_wake"],
  ["emberhold",      "nadir_outpost"],

  // Attackers into wild space (bottom-right up toward the core)
  ["karst_forge",    "vorun_halo"],
  ["veldras_gate",   "duskfall_watch"],
  ["kethrax_deep",   "silas_gate"],

  // === Wild-space web – based on nearest neighbors so the routes feel natural ===
  ["voryn_crossing", "osiron_spur"],
  ["voryn_crossing", "duskfall_watch"],
  ["voryn_crossing", "nadir_outpost"],
  ["voryn_crossing", "silas_gate"],

  ["osiron_spur",    "silas_gate"],
  ["osiron_spur",    "threnos_void"],

  ["duskfall_watch", "nadir_outpost"],
  ["duskfall_watch", "cinder_wake"],

  ["cinder_wake",    "helios_spine"],
  ["cinder_wake",    "nadir_outpost"],

  ["silas_gate",     "voryn_crossing"],

  ["vorun_halo",     "helios_spine"],

  ["helios_spine",   "cinder_wake"],

  ["threnos_void",   "duskfall_watch"],
  ["threnos_void",   "voryn_crossing"]
];


// Distinct planet base colors (identity)
const PLANET_BASE_COLORS = {
  bastior_prime:  0xffe08a,
  trinaxis_minor: 0x7ad0ff,
  aurum_refuge:   0xcfff8a,

  harkanis:       0xff6b6b,
  emberhold:      0xff9b4d,
  magnus_relay:   0x9aa5ff,

  karst_forge:    0xffc857,
  veldras_gate:   0xb57aff,
  kethrax_deep:   0x3ee6a3,

  voryn_crossing: 0xfaf3ff,
  osiron_spur:    0x8fb5ff,
  duskfall_watch: 0x5c6cff,
  vorun_halo:     0xfff2b3,
  cinder_wake:    0xd47a52,
  silas_gate:     0x7ff5e3,
  threnos_void:   0x394b7a,
  helios_spine:   0xffdd9e,
  nadir_outpost:  0xa3b4c8
};

// Planet size factors (relative to base radius)
const PLANET_SIZE_FACTORS = {
  bastior_prime:  1.7,
  trinaxis_minor: 1.4,
  aurum_refuge:   1.4,

  harkanis:       1.6,
  emberhold:      1.3,
  magnus_relay:   1.3,

  karst_forge:    1.6,
  veldras_gate:   1.4,
  kethrax_deep:   1.4,

  voryn_crossing: 1.3,
  osiron_spur:    1.2,
  duskfall_watch: 1.2,
  vorun_halo:     1.2,
  cinder_wake:    1.1,
  silas_gate:     1.1,
  threnos_void:   1.1,
  helios_spine:   1.2,
  nadir_outpost:  1.1
};


// ---------- STATE ----------

let turnNumber = 1;
let mapState = {}; // id -> { faction, control, safe, lockedUntilTurn }
let logEntries = [];
let selectedId = null;

// 3D
let scene, camera, renderer;
let territoryMeshes = {};      // id -> planet mesh
let factionRingMeshes = {};    // id -> ring mesh
let warpLaneGroup;
let animationFrameId = null;
let mapViewportEl, canvasEl;
let raycaster, pointer;

// camera / orbit
const DEFAULT_ZOOM = 1.0;         // overview by default
let zoomFactor = DEFAULT_ZOOM;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;
const cameraBaseDistance = 1350;

// Slightly off-axis so you see the triangle of regions & depth
let orbitPhi = Math.PI / 3;       // ~60° down from "north"
let orbitTheta = Math.PI / 4;     // 45° around Y axis
let orbitTarget = new THREE.Vector3(0, 40, 0);

let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

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

  camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 6000);
  updateCameraPosition();

  renderer = new THREE.WebGLRenderer({
    canvas: canvasEl,
    antialias: true,
    alpha: true
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
  dirLight.position.set(220, 260, 200);
  scene.add(dirLight);

  // Starfield
  const starsGeometry = new THREE.BufferGeometry();
  const starCount = 2600;
  const positions = new Float32Array(starCount * 3);
  const radius = 2200;

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

  // Territory planets + faction rings
  const baseRadius = 14; // bigger for readability

  TERRITORIES.forEach((t) => {
    const sizeFactor = PLANET_SIZE_FACTORS[t.id] || 1.0;
    const planetRadius = baseRadius * sizeFactor;

    const geom = new THREE.SphereGeometry(planetRadius, 32, 32);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.15,
      roughness: 0.6,
      emissive: 0x050712
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(t.x, t.y, t.z);
    mesh.userData.id = t.id;

    // Faction ring (ownership color only)
    const ringGeom = new THREE.TorusGeometry(
      planetRadius * 1.3,
      planetRadius * 0.22,
      18,
      60
    );
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.0
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 2;
    mesh.add(ring);

    scene.add(mesh);
    territoryMeshes[t.id] = mesh;
    factionRingMeshes[t.id] = ring;

    applyTerritoryVisuals(t.id);
  });

  // Warp lanes
  buildWarpLanes();

  // Raycaster
  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();

  // Mouse events
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

  // Bright and clearly visible warp lanes
  const material = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.95,
    linewidth: 3 // note: linewidth is mostly ignored in WebGL but we keep it for intent
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
    zoomFactor = Math.min(MAX_ZOOM, zoomFactor * 1.07);
  } else {
    zoomFactor = Math.max(MIN_ZOOM, zoomFactor / 1.07);
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

  const ROT_SPEED = 0.003;
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

function makeVibrant(color, minL = 0.45, minS = 0.5) {
  const hsl = {};
  color.getHSL(hsl);
  if (hsl.l < minL) hsl.l = minL;
  if (hsl.s < minS) hsl.s = minS;
  color.setHSL(hsl.h, hsl.s, hsl.l);
  return color;
}

function applyTerritoryVisuals(id) {
  const mesh = territoryMeshes[id];
  if (!mesh) return;
  const state = mapState[id];
  if (!state) return;

  const ring = factionRingMeshes[id];

  const planetBase = new THREE.Color(
    PLANET_BASE_COLORS[id] !== undefined ? PLANET_BASE_COLORS[id] : 0x9ca3af
  );

  const control = state.control || 0;

  // Planet: fixed identity color (ownership is ring)
  const color = planetBase.clone();
  makeVibrant(color);
  mesh.material.color.copy(color);

  // Scale with control level
  let scale = 1.0;
  if (control === 25) scale = 1.1;
  if (control === 75) scale = 1.25;
  if (control === 100) scale = 1.4;
  mesh.scale.set(scale, scale, scale);

  // Faction ring = ownership color
  let ringColorHex = null;
  switch (state.faction) {
    case "defenders":
      ringColorHex = 0x4ade80;
      break;
    case "attackers":
      ringColorHex = 0xfb7185;
      break;
    case "raiders":
      ringColorHex = 0xa855f7;
      break;
    default:
      ringColorHex = null;
  }

  if (ring) {
    if (!ringColorHex) {
      ring.material.opacity = 0.0;
    } else {
      ring.material.color.setHex(ringColorHex);
      ring.material.opacity = 0.95;
    }
  }

  // Emissive = subtle + selection/safe glow
  let emissive = new THREE.Color(0x050712);
  if (selectedId === id) {
    emissive = emissive.add(color.clone().multiplyScalar(0.25));
  }
  if (state.safe) {
    emissive = emissive.add(new THREE.Color(0x38bdf8).multiplyScalar(0.4));
  }
  mesh.material.emissive.copy(emissive);
}


// ---------- UI / EVENTS ----------

function hookEvents() {
  document
    .getElementById("zoomInBtn")
    .addEventListener("click", () => {
      zoomFactor = Math.min(MAX_ZOOM, zoomFactor * 1.07);
      updateCameraPosition();
    });

  document
    .getElementById("zoomOutBtn")
    .addEventListener("click", () => {
      zoomFactor = Math.max(MIN_ZOOM, zoomFactor / 1.07);
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
  // intentionally NO auto-zoom here
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

  orbitTarget.set(0, 40, 0);
  zoomFactor = DEFAULT_ZOOM;
  updateCameraPosition();

  renderAll();
}

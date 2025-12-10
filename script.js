// ---------- CONFIG / DATA ----------

const STORAGE_KEY = "bastior_crusade_map_v1";

const TERRITORIES = [
  { id: "bastior_prime", name: "Bastior Prime", x: 50, y: 48, z: 0 },
  { id: "harkanis", name: "Harkanis", x: 30, y: 30, z: -10 },
  { id: "karst_forge", name: "Karst Forge", x: 68, y: 26, z: 12 },
  { id: "veldras_gate", name: "Veldras Gate", x: 75, y: 60, z: -15 },
  { id: "trinaxis_minor", name: "Trinaxis Minor", x: 40, y: 70, z: 8 },
  { id: "osiron_spur", name: "Osiron Spur", x: 18, y: 55, z: -20 },
  { id: "kethrax_deep", name: "Kethrax Deep", x: 60, y: 82, z: 15 },
  { id: "magnus_relay", name: "Magnus Relay", x: 15, y: 15, z: 5 }
];

// Simple warp-lane graph between worlds
const WARP_LANES = [
  ["bastior_prime", "harkanis"],
  ["bastior_prime", "karst_forge"],
  ["bastior_prime", "veldras_gate"],
  ["bastior_prime", "trinaxis_minor"],
  ["harkanis", "osiron_spur"],
  ["osiron_spur", "magnus_relay"],
  ["karst_forge", "veldras_gate"],
  ["veldras_gate", "kethrax_deep"],
  ["trinaxis_minor", "kethrax_deep"]
];

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

// manual orbit / zoom
let zoomFactor = 1; // >1 = closer, <1 = farther
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const cameraBaseDistance = 260;
let orbitPhi = Math.PI / 3; // vertical angle
let orbitTheta = Math.PI / 6; // horizontal angle
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
  scene.background = new THREE.Color(0x020617);

  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 3000);
  updateCameraPosition();

  renderer = new THREE.WebGLRenderer({
    canvas: canvasEl,
    antialias: true
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(80, 120, 100);
  scene.add(dirLight);

  // Starfield (make it brighter / more obvious)
  const starsGeometry = new THREE.BufferGeometry();
  const starCount = 2500;
  const positions = new Float32Array(starCount * 3);
  const radius = 1000;

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
    size: 2.0,
    sizeAttenuation: true,
    opacity: 0.8,
    transparent: true
  });

  const starField = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(starField);

  // Territory spheres (bigger + more spaced out)
  const baseRadius = 8;
  const spread = 5.5; // higher = more distance between nodes
  TERRITORIES.forEach((t) => {
    const x = (t.x - 50) * spread;
    const y = (t.y - 50) * -spread;
    const z = (t.z || 0) * 3; // amplify depth

    const geom = new THREE.SphereGeometry(baseRadius, 32, 32);
    const mat = new THREE.MeshPhongMaterial({
      color: 0x9ca3af,
      shininess: 40,
      specular: 0x555555
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
    color: 0x4b5563,
    transparent: true,
    opacity: 0.9
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

  // slow spin on planets to feel alive
  Object.values(territoryMeshes).forEach((mesh) => {
    mesh.rotation.y += 0.003;
  });

  renderer.render(scene, camera);
}

// ---------- CAMERA ORBIT / ZOOM ----------

function updateCameraPosition() {
  const r = cameraBaseDistance / zoomFactor; // zoomFactor up => closer
  const x = r * Math.sin(orbitPhi) * Math.cos(orbitTheta);
  const y = r * Math.cos(orbitPhi);
  const z = r * Math.sin(orbitPhi) * Math.sin(orbitTheta);

  camera.position.set(x, y, z);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

  if (zoomLabelEl) {
    zoomLabelEl.textContent = `${Math.round(zoomFactor * 100)}%`;
  }
}

function onWheel(e) {
  e.preventDefault();
  // scroll up (negative deltaY) => zoom in
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

    // Also do pick on click
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

function applyTerritoryVisuals(id) {
  const mesh = territoryMeshes[id];
  if (!mesh) return;
  const state = mapState[id];
  if (!state) return;

  // Base colors by faction
  let baseColor;
  switch (state.faction) {
    case "defenders":
      baseColor = new THREE.Color(0x4ade80); // green
      break;
    case "attackers":
      baseColor = new THREE.Color(0xfb7185); // red
      break;
    case "raiders":
      baseColor = new THREE.Color(0xa855f7); // purple
      break;
    default:
      baseColor = new THREE.Color(0x9ca3af); // gray
  }

  const control = state.control || 0;
  let intensity = 0.8;
  if (control === 25) intensity = 1.0;
  if (control === 75) intensity = 1.2;
  if (control === 100) intensity = 1.4;

  const color = baseColor.clone().multiplyScalar(intensity);
  mesh.material.color.copy(color);

  // Scale by control
  let scale = 1.1;
  if (control === 25) scale = 1.2;
  if (control === 75) scale = 1.35;
  if (control === 100) scale = 1.5;
  mesh.scale.set(scale, scale, scale);

  // Emissive glow for selected + safe
  let emissive = new THREE.Color(0x000000);
  if (selectedId === id) {
    emissive = emissive.add(color.clone().multiplyScalar(0.4));
  }
  if (state.safe) {
    emissive = emissive.add(new THREE.Color(0x38bdf8).multiplyScalar(0.4));
  }
  mesh.material.emissive = emissive;
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
    `${winner === "defender" ? "Defender" : "Attacker"} victory at ${worldName} – new owner: ${
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
  renderAll();
}

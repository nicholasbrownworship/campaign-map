// ------- CONFIG / DATA -------

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

// ------- STATE -------

let turnNumber = 1;
let mapState = {}; // id -> { faction, control, safe, lockedUntilTurn }
let logEntries = [];
let selectedId = null;

// 3D scene globals
let scene, camera, renderer, controls, raycaster, pointer;
let territoryMeshes = {}; // id -> THREE.Mesh
let animationFrameId = null;
let cameraBaseDistance = 200;
let zoomFactor = 1;

// ------- DOM ELEMENTS -------

let mapViewportEl, canvasEl;
let turnLabelEl, zoomLabelEl;
let noSelectionEl, selectionEl;
let territoryNameEl, territoryMetaEl;
let factionSelectEl, controlPercentEl;
let safeToggleEl;
let defenderFactionSelectEl, attackerFactionSelectEl;
let logListEl;

// ------- INIT -------

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

  defenderFactionSelectEl = document.getElementById(
    "defenderFactionSelect"
  );
  attackerFactionSelectEl = document.getElementById(
    "attackerFactionSelect"
  );

  logListEl = document.getElementById("logList");
}

// ------- STATE LOAD / SAVE -------

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
  } catch (err) {
    console.error("Failed to load state", err);
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

// ------- 3D SCENE SETUP -------

function init3DScene() {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020617);

  // Camera
  const width = mapViewportEl.clientWidth;
  const height = mapViewportEl.clientHeight;
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
  camera.position.set(0, 0, cameraBaseDistance);

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvasEl,
    antialias: true
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.6;
  controls.zoomSpeed = 0.8;
  controls.minDistance = 80;
  controls.maxDistance = 400;

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(50, 100, 80);
  scene.add(dirLight);

  // Starfield
  const starsGeometry = new THREE.BufferGeometry();
  const starCount = 1500;
  const positions = new Float32Array(starCount * 3);
  const radius = 600;

  for (let i = 0; i < starCount; i++) {
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = 2 * Math.PI * Math.random();
    const r = radius;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }

  starsGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );

  const starsMaterial = new THREE.PointsMaterial({
    color: 0x9ca3af,
    size: 1.2,
    sizeAttenuation: true
  });

  const starField = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(starField);

  // Territory spheres
  const baseRadius = 4;

  TERRITORIES.forEach((t) => {
    const x = (t.x - 50) * 2.5;
    const y = (t.y - 50) * -2.5;
    const z = t.z || 0;

    const geom = new THREE.SphereGeometry(baseRadius, 32, 32);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x9ca3af,
      roughness: 0.4,
      metalness: 0.3
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    mesh.userData.id = t.id;

    scene.add(mesh);
    territoryMeshes[t.id] = mesh;

    applyTerritoryVisuals(t.id);
  });

  // Picking
  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();
  canvasEl.addEventListener("pointerdown", onPointerDown);

  // Resize
  window.addEventListener("resize", onWindowResize);

  // Start loop
  animate();
}

function animate() {
  animationFrameId = requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function onWindowResize() {
  const width = mapViewportEl.clientWidth;
  const height = mapViewportEl.clientHeight || 1;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

// ------- 3D INTERACTION -------

function onPointerDown(event) {
  const rect = canvasEl.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(
    Object.values(territoryMeshes),
    false
  );

  if (intersects.length > 0) {
    const mesh = intersects[0].object;
    const id = mesh.userData.id;
    if (id) {
      onSelectTerritory(id);
    }
  }
}

// ------- VISUALS -------

function applyTerritoryVisuals(id) {
  const mesh = territoryMeshes[id];
  if (!mesh) return;
  const state = mapState[id];
  if (!state) return;

  // Base colors
  let baseColor;
  switch (state.faction) {
    case "defenders":
      baseColor = new THREE.Color(0x4ade80);
      break;
    case "attackers":
      baseColor = new THREE.Color(0xfb7185);
      break;
    case "raiders":
      baseColor = new THREE.Color(0xa855f7);
      break;
    default:
      baseColor = new THREE.Color(0x9ca3af);
  }

  const control = state.control || 0;

  let intensity = 0.7;
  if (control === 25) intensity = 0.9;
  if (control === 75) intensity = 1.1;
  if (control === 100) intensity = 1.3;

  const color = baseColor.clone().multiplyScalar(intensity);
  mesh.material.color.copy(color);

  // Scale by control
  let scale = 1;
  if (control === 25) scale = 1.05;
  if (control === 75) scale = 1.15;
  if (control === 100) scale = 1.25;
  mesh.scale.set(scale, scale, scale);

  // Emissive for selected + safe
  let emissive = new THREE.Color(0x000000);
  if (selectedId === id) {
    emissive = emissive.add(color.clone().multiplyScalar(0.4));
  }
  if (state.safe) {
    emissive = emissive.add(new THREE.Color(0x38bdf8).multiplyScalar(0.35));
  }
  mesh.material.emissive = emissive;
}

// ------- UI / EVENTS -------

function hookEvents() {
  document
    .getElementById("zoomInBtn")
    .addEventListener("click", () => adjustZoom(0.15));
  document
    .getElementById("zoomOutBtn")
    .addEventListener("click", () => adjustZoom(-0.15));

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

  // Control buttons
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

function adjustZoom(delta) {
  zoomFactor = Math.min(2, Math.max(0.5, zoomFactor + delta));
  zoomLabelEl.textContent = `${Math.round(zoomFactor * 100)}%`;

  const dir = camera.position.clone().normalize();
  const distance = cameraBaseDistance * zoomFactor;
  camera.position.copy(dir.multiplyScalar(distance));
  camera.updateProjectionMatrix();
}

// ------- RENDERING -------

function renderAll() {
  renderTurn();
  renderSelection();
  updateFactionOverview();
  renderLog();
}

function renderTurn() {
  turnLabelEl.textContent = String(turnNumber);
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

  // Defenders
  updateFactionCard(
    "defenders",
    totals.defenders.worlds,
    totals.defenders.influence,
    totalInfluence
  );
  // Attackers
  updateFactionCard(
    "attackers",
    totals.attackers.worlds,
    totals.attackers.influence,
    totalInfluence
  );
  // Raiders
  updateFactionCard(
    "raiders",
    totals.raiders.worlds,
    totals.raiders.influence,
    totalInfluence
  );

  // Unclaimed
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
  logEntries.slice().reverse().forEach((entry) => {
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

// ------- CAMPAIGN LOGIC -------

function onSelectTerritory(id) {
  selectedId = id;
  TERRITORIES.forEach((t) => applyTerritoryVisuals(t.id));
  renderSelection();
}

function getTerritoryName(id) {
  const t = TERRITORIES.find((t) => t.id === id);
  return t ? t.name : id;
}

// Very simplified 0–25–75–100 resolver
function resolveBattle(territoryId, defenderFaction, attackerFaction, winner) {
  const state = mapState[territoryId];
  const worldName = getTerritoryName(territoryId);

  const currentOwner = state.faction;
  const control = state.control;

  let winningFaction =
    winner === "defender" ? defenderFaction : attackerFaction;

  // If winner was not one of the factions, bail
  if (!["defenders", "attackers", "raiders"].includes(winningFaction)) {
    return;
  }

  if (currentOwner === winningFaction) {
    // Already owns it: step up control
    if (control === 0) state.control = 25;
    else if (control === 25) state.control = 75;
    else if (control === 75) state.control = 100;
    // 100 stays 100
  } else {
    // Different owner: either gain a foothold or flip hard
    if (control <= 25 || currentOwner === "unclaimed") {
      // Early control: steal the world and bump to 75
      state.faction = winningFaction;
      state.control = 75;
    } else {
      // Well-held world: flip but at 25% (costly win)
      state.faction = winningFaction;
      state.control = 25;
    }
  }

  // Safe worlds: if defender wins on their own world at 100%,
  // they become safe next turn.
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

  // Unlock safe worlds whose lock has expired
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

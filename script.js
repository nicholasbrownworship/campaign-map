// ---------- CONFIG / DATA ----------

const STORAGE_KEY = "bastior_crusade_map_v1";

const TERRITORIES = [
  // === DEFENDERS HOME REGION – "Bastior Reach"
  // Main world at 0° around the origin, far “back”
  { id: "bastior_prime",   name: "Bastior Prime",   x:  780, y:    0, z: -820 },
  { id: "trinaxis_minor",  name: "Trinaxis Minor",  x:  855, y:  -86, z: -719 },
  { id: "aurum_refuge",    name: "Aurum Refuge",    x:  922, y: -107, z: -815 },

  // === RAIDERS HOME REGION – "Harkanis Fringe"
  // Main world at 120°, far “front”
  { id: "harkanis",        name: "Harkanis",        x: -390, y:  676, z:  820 },
  { id: "emberhold",       name: "Emberhold",       x: -229, y:  598, z:  838 },
  { id: "magnus_relay",    name: "Magnus Relay",    x: -348, y:  857, z:  978 },

  // === ATTACKERS HOME REGION – "Karst Expanse"
  // Main world at 240°, same radius as the others, back/low
  { id: "karst_forge",     name: "Karst Forge",     x: -390, y: -676, z: -820 },
  { id: "veldras_gate",    name: "Veldras Gate",    x: -285, y: -715, z: -726 },
  { id: "kethrax_deep",    name: "Kethrax Deep",    x: -306, y: -563, z: -666 },

  // === WILD SPACE – central contested region (proper 3D cloud) ===
  { id: "voryn_crossing",  name: "Voryn Crossing",  x:    0, y:    0, z:  -60 },
  { id: "osiron_spur",     name: "Osiron Spur",     x: -137, y: -281, z:  132 },
  { id: "duskfall_watch",  name: "Duskfall Watch",  x:  486, y:  128, z: -414 },
  { id: "vorun_halo",      name: "Vorun Halo",      x: -389, y:  167, z:   78 },
  { id: "cinder_wake",     name: "Cinder Wake",     x: -214, y:  218, z: -405 },
  { id: "silas_gate",      name: "Silas Gate",      x:  185, y:  376, z: -237 },
  { id: "threnos_void",    name: "Threnos Void",    x: -230, y: -211, z: -438 },
  { id: "helios_spine",    name: "Helios Spine",    x: -432, y: -542, z:  108 },
  { id: "nadir_outpost",   name: "Nadir Outpost",   x:  299, y:  637, z:  375 }
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

  // === MAJOR HYPERLANES BETWEEN STARTER REGIONS ===
  ["bastior_prime",  "harkanis"],
  ["harkanis",       "karst_forge"],
  ["karst_forge",    "bastior_prime"],

  // === Home → Wild-space connections (primary gates) ===

  // Defenders drop into wild space via the “upper/back” side
  ["bastior_prime",  "duskfall_watch"],
  ["trinaxis_minor", "silas_gate"],
  ["aurum_refuge",   "voryn_crossing"],

  // Raiders come down into the wild cluster near the high-Y worlds
  ["harkanis",       "nadir_outpost"],
  ["emberhold",      "nadir_outpost"],
  ["magnus_relay",   "silas_gate"],

  // Attackers rise into wild space via the low-Y side
  ["karst_forge",    "helios_spine"],
  ["veldras_gate",   "osiron_spur"],
  ["kethrax_deep",   "threnos_void"],

  // === Wild-space web – 3D routes around the core ===

  // Core hub around Voryn
  ["voryn_crossing", "osiron_spur"],
  ["voryn_crossing", "duskfall_watch"],
  ["voryn_crossing", "cinder_wake"],

  // Lower wild cluster
  ["osiron_spur",    "threnos_void"],
  ["osiron_spur",    "helios_spine"],
  ["helios_spine",   "cinder_wake"],

  // Mid / upper wild cluster
  ["duskfall_watch", "silas_gate"],
  ["duskfall_watch", "cinder_wake"],
  ["silas_gate",     "nadir_outpost"],
  ["cinder_wake",    "threnos_void"],

  // Side / deep wild links
  ["vorun_halo",     "osiron_spur"],
  ["vorun_halo",     "cinder_wake"],
  ["threnos_void",   "vorun_halo"],
  ["threnos_void",   "voryn_crossing"],

  // High-Y wild outpost (and extra hook back to Raiders)
  ["nadir_outpost",  "silas_gate"],
  ["nadir_outpost",  "harkanis"]
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
  // Bastior Reach – Defenders (home largest)
  bastior_prime:  2.4,
  trinaxis_minor: 1.4,
  aurum_refuge:   1.8,

  // Harkanis Fringe – Raiders (home largest)
  harkanis:       2.2,
  emberhold:      1.3,
  magnus_relay:   1.0,

  // Karst Expanse – Attackers (home largest)
  karst_forge:    2.3,
  veldras_gate:   1.5,
  kethrax_deep:   1.7,

  // Wild space – big variance, some giants
  voryn_crossing: 3.0, // massive central hub
  osiron_spur:    1.6,
  duskfall_watch: 2.6, // big forward wild-space anchor
  vorun_halo:     1.9,
  cinder_wake:    1.2,
  silas_gate:     1.7,
  threnos_void:   2.0,
  helios_spine:   3.2, // huge “spine” world
  nadir_outpost:  1.1  // small high-Y outpost
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
let laneMeshes = [];           // all lane meshes
let lanesByPlanet = {};        // id -> lane meshes touching that planet

let planetLabelSprites = {};   // id -> label sprite above each planet

let animationFrameId = null;
let mapViewportEl, canvasEl;
let raycaster, pointer;

// camera / orbit
const DEFAULT_ZOOM = 1.0;
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
  const baseRadius = 22;

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

  // Warp lanes (ghosted by default)
  buildWarpLanes();

  // Planet labels
  createPlanetLabels();

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
  laneMeshes = [];
  lanesByPlanet = {};

  const baseColor = 0x38bdf8;

  WARP_LANES.forEach(([aId, bId]) => {
    const aMesh = territoryMeshes[aId];
    const bMesh = territoryMeshes[bId];
    if (!aMesh || !bMesh) return;

    const points = [aMesh.position.clone(), bMesh.position.clone()];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    // individual material so we can tweak opacity/color per lane
    const material = new THREE.LineBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.08 // very faint by default
    });

    const line = new THREE.Line(geometry, material);
    line.userData = { fromId: aId, toId: bId };

    warpLaneGroup.add(line);
    laneMeshes.push(line);

    if (!lanesByPlanet[aId]) lanesByPlanet[aId] = [];
    if (!lanesByPlanet[bId]) lanesByPlanet[bId] = [];
    lanesByPlanet[aId].push(line);
    lanesByPlanet[bId].push(line);
  });

  scene.add(warpLaneGroup);
}

function createPlanetLabels() {
  TERRITORIES.forEach((t) => {
    const mesh = territoryMeshes[t.id];
    if (!mesh) return;

    const radius =
      (mesh.geometry && mesh.geometry.parameters && mesh.geometry.parameters.radius) ||
      20;

    const sprite = createLabelSprite(t.name, radius);
    sprite.position.set(0, radius + 8, 0);
    mesh.add(sprite);

    planetLabelSprites[t.id] = sprite;
  });

  updateLabelHighlights(null);
}

function createLabelSprite(text, radius = 20) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const paddingX = 24;
  const paddingY = 12;

  ctx.font = "32px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const boxWidth = textWidth + paddingX * 2;
  const boxHeight = 56;

  const x = (canvas.width - boxWidth) / 2;
  const y = (canvas.height - boxHeight) / 2;

  // background
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  const r = 16;
  roundedRect(ctx, x, y, boxWidth, boxHeight, r);
  ctx.fill();

  // text
  ctx.fillStyle = "#f5f5f5";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    opacity: 0.3 // faint by default; selection will bump this
  });

  const sprite = new THREE.Sprite(material);

  // Scale label relative to planet size
  const scaleFactor = radius / 20;
  sprite.scale.set(80 * scaleFactor, 20 * scaleFactor, 1);

  return sprite;
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height
  );
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
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
  } else {
    // clicked empty space: clear selection
    selectedId = null;
    TERRITORIES.forEach((t) => applyTerritoryVisuals(t.id));
    highlightConnections(null);
    updateLabelHighlights(null);
    renderSelection();
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

function highlightConnections(planetId) {
  // Reset all lanes to ghosted
  laneMeshes.forEach((lane) => {
    lane.material.color.setHex(0x38bdf8);
    lane.material.opacity = 0.08;
  });

  if (!planetId || !lanesByPlanet[planetId]) return;

  const connectedLanes = lanesByPlanet[planetId];

  connectedLanes.forEach((lane) => {
    lane.material.color.setHex(0x00ffff);
    lane.material.opacity = 0.9;
  });
}

function updateLabelHighlights(selectedPlanetId) {
  // Faint labels by default
  Object.values(planetLabelSprites).forEach((sprite) => {
    sprite.material.opacity = 0.25;
  });

  if (!selectedPlanetId) return;

  // Selected planet label fully visible
  const selectedSprite = planetLabelSprites[selectedPlanetId];
  if (selectedSprite) {
    selectedSprite.material.opacity = 1.0;
  }

  // Neighbor labels mostly visible
  const connectedLanes = lanesByPlanet[selectedPlanetId] || [];
  connectedLanes.forEach((lane) => {
    const { fromId, toId } = lane.userData;
    const otherId = fromId === selectedPlanetId ? toId : fromId;
    const otherSprite = planetLabelSprites[otherId];
    if (otherSprite) {
      otherSprite.material.opacity = 0.9;
    }
  });
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
  highlightConnections(id);
  updateLabelHighlights(id);
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
  highlightConnections(territoryId);
  updateLabelHighlights(territoryId);
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
  highlightConnections(selectedId);
  updateLabelHighlights(selectedId);
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

  highlightConnections(null);
  updateLabelHighlights(null);

  renderAll();
}

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { installKasthamandap } from "./temple-kasthamandap.js";
import { installShivaParvati } from "./temple-shivaparvati.js";
import { installHouseModels } from "./houses200/place.js";
import { edgeFrames } from "./edge.js";
import { floorAt, wallHit } from "./collide.js";
import { makeAvatar } from "./avatar.js";

const canvas = document.getElementById("view");
const hud = document.getElementById("hud");
const gate = document.getElementById("gate");
const opts = window.__avatar || { skin: "#c68642", hair: "#2a211c", shirt: "#8c3b2a", height: 1.68 };

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x9ec4de, 1);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xb7c6cf, 80, 420);
const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.08, 800);
scene.add(new THREE.HemisphereLight(0xfff4e5, 0x6a6258, 1.15));
const sun = new THREE.DirectionalLight(0xfff1d6, 1.35);
sun.position.set(40, 80, 20);
scene.add(sun);

const P = { x: 18, z: -8, y: 0, yaw: 0.4, pitch: 0.28 };
const keys = new Set();
const stick = { x: 0, y: 0, on: false };
let lookOn = false;
let buildings = [];

function resize() {
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);

function ground(data) {
  let minX = -80, maxX = 80, minZ = -80, maxZ = 80;
  for (const b of data.buildings) {
    for (const p of b.poly) {
      minX = Math.min(minX, p[0]);
      maxX = Math.max(maxX, p[0]);
      minZ = Math.min(minZ, p[1]);
      maxZ = Math.max(maxZ, p[1]);
    }
  }
  const pad = 30;
  const w = maxX - minX + pad * 2;
  const d = maxZ - minZ + pad * 2;
  const geo = new THREE.PlaneGeometry(w, d);
  geo.rotateX(-Math.PI / 2);
  const tex = new THREE.TextureLoader().load(new URL("../assets/tex/cobblestone_pavement_Diffuse.jpg", import.meta.url).href);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(w / 4, d / 4);
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }));
  mesh.position.set((minX + maxX) / 2, 0, (minZ + maxZ) / 2);
  mesh.receiveShadow = true;
  scene.add(mesh);
}

function blocked(x, z, y) {
  const r = 0.28;
  const pts = [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]];
  for (const [dx, dz] of pts) {
    if (wallHit(buildings, x + dx, z + dz, y)) return true;
  }
  return false;
}

function moveTo(x, z) {
  const y = floorAt(buildings, x, z, P.y + 0.55);
  if (Math.abs(y - P.y) > 0.7) return;
  if (blocked(x, z, y)) return;
  P.x = x;
  P.z = z;
  P.y = y;
}

function placeCamera() {
  const dist = 4.6;
  const lookY = P.y + opts.height * 0.72;
  const cp = Math.cos(P.pitch);
  camera.position.set(
    P.x - Math.sin(P.yaw) * dist * cp,
    lookY + Math.sin(P.pitch) * dist * 0.85,
    P.z - Math.cos(P.yaw) * dist * cp,
  );
  camera.lookAt(P.x, lookY, P.z);
}

const avatar = makeAvatar(THREE, opts);
scene.add(avatar);

function syncAvatar() {
  avatar.position.set(P.x, P.y, 0);
  avatar.position.z = P.z;
  avatar.rotation.y = P.yaw;
}

async function loadCatalog(data) {
  let catalog = { homes: [], features: [], attacks: [] };
  try {
    catalog = await (await fetch(new URL("../world/catalog.json", import.meta.url))).json();
  } catch (err) {
    console.error(err);
  }
  const loader = new GLTFLoader();
  const origin = data.origin;
  const m = data.metresPerDeg;
  for (const name of catalog.homes || []) {
    if (String(name).startsWith("_")) continue;
    try {
      const base = new URL("../homes/" + name + "/", import.meta.url);
      const home = await (await fetch(new URL("home.json", base))).json();
      const gltf = await loader.loadAsync(new URL(home.model || "model.glb", base).href);
      const root = gltf.scene;
      const x = (home.lon - origin.lon) * m.lon;
      const z = (origin.lat - home.lat) * m.lat;
      root.position.set(x, 0, z);
      scene.add(root);
    } catch (err) {
      console.error("home", name, err);
    }
  }
}

const data = await (await fetch(new URL("../data/square.json", import.meta.url))).json();
buildings = data.buildings;
ground(data);
const holds = [];
installKasthamandap(scene, data, buildings, holds);
installShivaParvati(scene, data, buildings, holds);
const placed = installHouseModels(scene, buildings, holds, edgeFrames);
await loadCatalog(data);

if (blocked(P.x, P.z, 0)) {
  for (let r = 2; r < 40 && blocked(P.x, P.z, P.y); r += 2) {
    P.x = 18 + r;
    P.z = -8;
    P.y = floorAt(buildings, P.x, P.z, 0.4);
  }
} else {
  P.y = floorAt(buildings, P.x, P.z, 0.4);
}
syncAvatar();
placeCamera();
gate.hidden = true;
hud.textContent = "Walk. Click the view to look. Shift runs.";

window.addEventListener("keydown", (e) => {
  keys.add(e.code);
  if (e.code === "Tab") e.preventDefault();
});
window.addEventListener("keyup", (e) => keys.delete(e.code));

canvas.addEventListener("click", () => {
  if (matchMedia("(pointer: coarse)").matches) return;
  canvas.requestPointerLock();
});
document.addEventListener("pointerlockchange", () => {
  lookOn = document.pointerLockElement === canvas;
});
document.addEventListener("mousemove", (e) => {
  if (!lookOn) return;
  P.yaw -= e.movementX * 0.0022;
  P.pitch = Math.max(-0.4, Math.min(1.05, P.pitch + e.movementY * 0.002));
});

const nub = document.getElementById("nub");
const stickEl = document.getElementById("stick");
function setStick(cx, cy, on) {
  const rect = stickEl.getBoundingClientRect();
  const dx = cx - (rect.left + rect.width / 2);
  const dy = cy - (rect.top + rect.height / 2);
  const mag = Math.hypot(dx, dy) || 1;
  const lim = 36;
  const k = Math.min(lim, mag) / mag;
  nub.style.transform = "translate(" + (dx * k) + "px," + (dy * k) + "px)";
  stick.x = (dx * k) / lim;
  stick.y = (dy * k) / lim;
  stick.on = on;
}
stickEl.addEventListener("pointerdown", (e) => {
  stickEl.setPointerCapture(e.pointerId);
  setStick(e.clientX, e.clientY, true);
});
stickEl.addEventListener("pointermove", (e) => {
  if (!stick.on) return;
  setStick(e.clientX, e.clientY, true);
});
function endStick() {
  stick.on = false;
  stick.x = 0;
  stick.y = 0;
  nub.style.transform = "translate(0,0)";
}
stickEl.addEventListener("pointerup", endStick);
stickEl.addEventListener("pointercancel", endStick);

let lookDrag = false;
let lx = 0;
let ly = 0;
canvas.addEventListener("pointerdown", (e) => {
  if (!matchMedia("(pointer: coarse)").matches) return;
  if (e.clientX < window.innerWidth * 0.45) return;
  lookDrag = true;
  lx = e.clientX;
  ly = e.clientY;
});
canvas.addEventListener("pointermove", (e) => {
  if (!lookDrag) return;
  P.yaw -= (e.clientX - lx) * 0.005;
  P.pitch = Math.max(-0.4, Math.min(1.05, P.pitch + (e.clientY - ly) * 0.004));
  lx = e.clientX;
  ly = e.clientY;
});
canvas.addEventListener("pointerup", () => { lookDrag = false; });

let frames = 0;
let last = performance.now();

function applyInput(dt) {
  let ix = 0;
  let iz = 0;
  if (keys.has("KeyW") || keys.has("ArrowUp")) iz += 1;
  if (keys.has("KeyS") || keys.has("ArrowDown")) iz -= 1;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) ix -= 1;
  if (keys.has("KeyD") || keys.has("ArrowRight")) ix += 1;
  if (stick.on) {
    ix += stick.x;
    iz += -stick.y;
  }
  const len = Math.hypot(ix, iz);
  if (len <= 0.05) return;
  const sp = (keys.has("ShiftLeft") || keys.has("ShiftRight") ? 4.2 : 1.55) * dt;
  const k = sp / len;
  const sy = Math.sin(P.yaw);
  const cy = Math.cos(P.yaw);
  const wx = (ix * cy + iz * sy) * k;
  const wz = (-ix * sy + iz * cy) * k;
  const nx = P.x + wx;
  const nz = P.z + wz;
  if (!blocked(nx, nz, P.y)) moveTo(nx, nz);
  else if (!blocked(P.x + wx, P.z, P.y)) moveTo(P.x + wx, P.z);
  else if (!blocked(P.x, P.z + wz, P.y)) moveTo(P.x, P.z + wz);
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  frames += 1;
  applyInput(dt);
  syncAvatar();
  placeCamera();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.__game = {
  ready: true,
  houses: placed,
  houseFail: window.__houseFail || [],
  tp(x, z, yaw) {
    P.x = x;
    P.z = z;
    P.y = floorAt(buildings, x, z, 0.5);
    if (yaw != null) P.yaw = yaw;
    syncAvatar();
    placeCamera();
    renderer.render(scene, camera);
  },
  pos() {
    return { x: P.x, y: P.y, z: P.z, yaw: P.yaw };
  },
  frames() { return frames; },
  step(ix, iz) {
    keys.clear();
    if (iz > 0) keys.add("KeyW");
    if (iz < 0) keys.add("KeyS");
    if (ix < 0) keys.add("KeyA");
    if (ix > 0) keys.add("KeyD");
  },
  nudge(seconds) {
    keys.add("KeyW");
    applyInput(seconds);
    keys.delete("KeyW");
    syncAvatar();
    placeCamera();
    renderer.render(scene, camera);
  },
  tryWalk() {
    const x0 = P.x;
    const z0 = P.z;
    for (let i = 0; i < 8; i++) {
      P.yaw = i * Math.PI / 4;
      keys.add("KeyW");
      applyInput(1);
      keys.delete("KeyW");
      if (Math.hypot(P.x - x0, P.z - z0) > 0.5) break;
    }
    syncAvatar();
    placeCamera();
    renderer.render(scene, camera);
  },
  release() { keys.clear(); },
};
hud.textContent = "In the square. Houses " + placed.length + ". Click to look, WASD to walk.";

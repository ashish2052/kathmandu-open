import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { installKasthamandap } from "./temple-kasthamandap.js";
import { installShivaParvati } from "./temple-shivaparvati.js";
import { installHouseModels } from "./houses200/place.js";
import { edgeFrames } from "./edge.js";
import { floorAt, wallHit } from "./collide.js";
import { makeAvatar } from "./avatar.js";
import { installGround } from "./ground.js";

const canvas = document.getElementById("view");
const hud = document.getElementById("hud");
const gate = document.getElementById("gate");
const opts = Object.assign({
  skin: "#c68642",
  hair: "#1a140f",
  shirt: "#2a3544",
  height: 1.68,
  build: 0.42,
  face: 0.78,
}, window.__avatar || {});

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0xe7c4a4, 1);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xe7c4a4, 48, 140);
scene.background = new THREE.Color(0xe7c4a4);
const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.08, 800);
scene.add(new THREE.HemisphereLight(0xffe6c8, 0x8a6a48, 0.72));
const sun = new THREE.DirectionalLight(0xffc48a, 2.35);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 2;
sun.shadow.camera.far = 70;
sun.shadow.camera.left = -22;
sun.shadow.camera.right = 22;
sun.shadow.camera.top = 22;
sun.shadow.camera.bottom = -22;
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.04;
scene.add(sun);
scene.add(sun.target);
const fill = new THREE.DirectionalLight(0xffe0c2, 0.9);
scene.add(fill);
scene.add(fill.target);

const KX = -41.56;
const KZ = 7.34;
const P = { x: -16, z: 6, y: 0, yaw: 0, face: 0, pitch: 0.2, photo: null };
P.yaw = Math.atan2(KX - P.x, KZ - P.z);
P.face = P.yaw;
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

function aimSun() {
  sun.position.set(P.x - 24, P.y + 22, P.z + 14);
  sun.target.position.set(P.x, P.y + 1.2, P.z);
  fill.position.set(P.x + 12, P.y + 8, P.z + 4);
  fill.target.position.set(P.x, P.y + 1.2, P.z);
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

const camPos = new THREE.Vector3();
let camReady = false;
function placeCamera(dt) {
  const face = P.photo ? P.face : P.yaw;
  const fx = Math.sin(face);
  const fz = Math.cos(face);
  if (P.photo === "front") {
    camera.position.set(P.x + fx * 1.15, P.y + opts.height * 0.95, P.z + fz * 1.15);
    camera.lookAt(P.x, P.y + opts.height * 0.88, P.z);
    camPos.copy(camera.position);
    camReady = true;
    return;
  }
  if (P.photo === "back") {
    camera.position.set(P.x - fx * 2.05, P.y + opts.height * 0.95, P.z - fz * 2.05);
    camera.lookAt(P.x, P.y + opts.height * 0.7, P.z);
    camPos.copy(camera.position);
    camReady = true;
    return;
  }
  const dist = 2.7;
  const sy = Math.sin(P.yaw);
  const cy = Math.cos(P.yaw);
  const rx = cy;
  const rz = -sy;
  const lookY = P.y + opts.height * 0.62;
  const tx = P.x + sy * 0.7 + rx * 0.05;
  const tz = P.z + cy * 0.7 + rz * 0.05;
  const cp = Math.cos(P.pitch);
  const desired = new THREE.Vector3(
    tx - sy * dist * cp + rx * 0.42,
    lookY + Math.sin(P.pitch) * dist * 0.55 + 0.2,
    tz - cy * dist * cp + rz * 0.42,
  );
  for (let i = 4; i >= 1; i--) {
    const t = i / 4;
    const x = P.x + (desired.x - P.x) * t;
    const z = P.z + (desired.z - P.z) * t;
    if (!wallHit(buildings, x, z, P.y + 1.2)) {
      desired.x = x;
      desired.z = z;
      break;
    }
  }
  const k = camReady ? 1 - Math.exp(-(dt || 0.016) * 10) : 1;
  camPos.lerp(desired, k);
  camReady = true;
  camera.position.copy(camPos);
  camera.lookAt(tx, lookY, tz);
}

const avatar = makeAvatar(opts);
scene.add(avatar);
let speed = 0;

function syncAvatar(dt) {
  avatar.position.set(P.x, P.y, P.z);
  avatar.rotation.y = P.face;
  if (avatar.userData.tick) avatar.userData.tick(dt || 0, speed);
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
const groundInfo = await installGround(scene, buildings);
const holds = [];
installKasthamandap(scene, data, buildings, holds);
installShivaParvati(scene, data, buildings, holds);
const placed = await installHouseModels(scene, buildings, holds, edgeFrames, { x: P.x, z: P.z });
loadCatalog(data);
scene.traverse((o) => {
  if (!o.isMesh || o.name === "sky") return;
  const groundish = o.name === "earth" || o.name === "square-paving" || o.name === "streets";
  o.castShadow = !groundish;
  o.receiveShadow = true;
});

if (blocked(P.x, P.z, 0)) {
  let found = false;
  for (let r = 1; r <= 14 && !found; r++) {
    for (let a = 0; a < 10; a++) {
      const x = -16 + Math.cos(a * 0.628) * r * 1.4;
      const z = 6 + Math.sin(a * 0.628) * r * 1.4;
      if (blocked(x, z, 0)) continue;
      P.x = x;
      P.z = z;
      found = true;
      break;
    }
  }
}
P.y = floorAt(buildings, P.x, P.z, 0.4);
P.yaw = Math.atan2(KX - P.x, KZ - P.z);
P.face = P.yaw;
aimSun();
syncAvatar(0);
placeCamera(0);
gate.hidden = true;
{
  let b = 0;
  for (const r of performance.getEntriesByType("resource")) b += r.transferSize || r.encodedBodySize || 0;
  window.__bytesAtGate = b;
}
hud.textContent = "Basantapur. Kasthamandap is ahead. Click to look, WASD to walk.";
window.__ground = groundInfo;

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
const dts = [];
window.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });

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
  if (len <= 0.05) {
    speed = 0;
    return;
  }
  speed = keys.has("ShiftLeft") || keys.has("ShiftRight") ? 4.2 : 1.55;
  const sp = speed * dt;
  const k = sp / len;
  const sy = Math.sin(P.yaw);
  const cy = Math.cos(P.yaw);
  const wx = (ix * cy + iz * sy) * k;
  const wz = (-ix * sy + iz * cy) * k;
  let turn = Math.atan2(wx, wz) - P.face;
  while (turn > Math.PI) turn -= Math.PI * 2;
  while (turn < -Math.PI) turn += Math.PI * 2;
  P.face += turn * Math.min(1, dt * 10);
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
  if (frames > 25 && dts.length < 120) dts.push(dt);
  if (frames === 6 && window.__texLater) {
    const later = window.__texLater.splice(0);
    for (const fn of later) fn();
  }
  aimSun();
  syncAvatar(dt);
  placeCamera(dt);
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
    if (yaw != null) {
      P.yaw = yaw;
      P.face = yaw;
    }
    camReady = false;
    aimSun();
    syncAvatar(0);
    placeCamera(0);
    renderer.render(scene, camera);
  },
  photo(mode) {
    P.photo = mode || null;
    camReady = false;
    syncAvatar(0);
    placeCamera(0);
    renderer.render(scene, camera);
  },
  pos() {
    return { x: P.x, y: P.y, z: P.z, yaw: P.yaw, face: P.face };
  },
  fps() {
    if (!dts.length) return 0;
    const s = dts.slice().sort((a, b) => a - b);
    const mid = s[Math.floor(s.length / 2)];
    return { n: s.length, med: +(1 / mid).toFixed(1), maxMs: +(s[s.length - 1] * 1000).toFixed(1) };
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
    let left = seconds;
    while (left > 0) {
      const step = Math.min(0.05, left);
      keys.add("KeyW");
      applyInput(step);
      syncAvatar(step);
      left -= step;
    }
    keys.delete("KeyW");
    aimSun();
    placeCamera(0.016);
    renderer.render(scene, camera);
  },
  tryWalk() {
    const x0 = P.x;
    const z0 = P.z;
    for (let i = 0; i < 8; i++) {
      P.yaw = i * Math.PI / 4;
      P.face = P.yaw;
      keys.add("KeyW");
      applyInput(1);
      keys.delete("KeyW");
      if (Math.hypot(P.x - x0, P.z - z0) > 0.5) break;
    }
    syncAvatar(0);
    placeCamera(0);
    renderer.render(scene, camera);
  },
  release() { keys.clear(); },
};
hud.textContent = "Basantapur. Houses " + placed.length + " on the square, the rest loading. Click to look, WASD to walk.";

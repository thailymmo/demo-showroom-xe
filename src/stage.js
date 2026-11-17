// Sân khấu three.js dùng chung: renderer trong suốt, camera, orbit, tự xoay nhẹ, dừng khi khuất, dịch khung hình
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import gsap from "gsap";

export { THREE, gsap };
export const clamp = THREE.MathUtils.clamp;
export const lerp = THREE.MathUtils.lerp;
export const back = (t) => { const c = 1.5, u = t - 1; return 1 + (c + 1) * u * u * u + c * u * u; };
export const ease3 = (t) => 1 - Math.pow(1 - t, 3);
/** tiến độ cục bộ 0..1 của một đoạn [a,b] trong p */
export const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);

export function createStage(canvas, opt = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, opt.maxDpr || 2));
  renderer.shadowMap.enabled = opt.shadows !== false;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = opt.env ?? 0.55;
  const camera = new THREE.PerspectiveCamera(opt.fov || 36, 1, 0.1, 200);
  const home = opt.home || { pos: [6, 3.5, 8], look: [0, 1, 0] };
  camera.position.set(...home.pos);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(...home.look);
  Object.assign(controls, { enableDamping: true, dampingFactor: 0.06, enablePan: false, minDistance: opt.minD || 2.5, maxDistance: opt.maxD || 16, minPolarAngle: opt.minPol ?? 0.4, maxPolarAngle: opt.maxPol ?? 1.52 });
  if (opt.az) { controls.minAzimuthAngle = opt.az[0]; controls.maxAzimuthAngle = opt.az[1]; }
  controls.update();
  if (opt.interactive === false) {
    controls.enabled = false;
    controls.minAzimuthAngle = -Infinity; controls.maxAzimuthAngle = Infinity;
    controls.minPolarAngle = 0; controls.maxPolarAngle = Math.PI; controls.minDistance = 0; controls.maxDistance = 999;
    canvas.style.pointerEvents = "none";
  }
  const hooks = [];
  const api = {
    renderer, scene, camera, controls, THREE,
    onFrame: (fn) => hooks.push(fn),
    /** bay camera tới góc nhìn */
    fly(v, d = 1.6) {
      controls.enabled = false;
      gsap.to(camera.position, { x: v.pos[0], y: v.pos[1], z: v.pos[2], duration: d, ease: "power3.inOut" });
      gsap.to(controls.target, { x: v.look[0], y: v.look[1], z: v.look[2], duration: d, ease: "power3.inOut", onComplete: () => (controls.enabled = opt.interactive !== false) });
    },
    idle: opt.idle ?? 0.0016,
    spin: 0,
  };
  let running = true, last = 0, idle = 0;
  const fit = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = (opt.fov || 36) * (w / h < 0.9 ? 1.12 : 1);
    const o = opt.offset || [-0.235, 0.02];
    if (w / h > 1.25) camera.setViewOffset(w, h, o[0] * w, o[1] * h, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(fit).observe(canvas);
  fit();
  controls.addEventListener("start", () => (idle = -1));
  controls.addEventListener("end", () => (idle = 0));
  const tick = (t) => {
    if (!running) return;
    const dt = Math.min((t - last) / 1000, 0.1); last = t;
    if (idle >= 0 && controls.enabled && api.idle) {
      idle += dt;
      if (idle > 3) {
        const off = camera.position.clone().sub(controls.target);
        off.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.sin(t / 5200) * api.idle);
        camera.position.copy(controls.target).add(off);
      }
    }
    hooks.forEach((f) => f(dt, t / 1000));
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  };
  new IntersectionObserver(([e]) => { const was = running; running = e.isIntersecting; if (running && !was) { last = performance.now(); requestAnimationFrame(tick); } }).observe(canvas);
  requestAnimationFrame(tick);
  /** vật liệu nhanh */
  api.M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, ...o });
  api.part = (name) => { const g = new THREE.Group(); g.name = name; scene.add(g); return g; };
  api.mesh = (geo, mat, x = 0, y = 0, z = 0, o = {}) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (o.rot) m.rotation.set(...o.rot);
    m.castShadow = o.cast !== false; m.receiveShadow = o.recv !== false;
    (o.parent || scene).add(m);
    return m;
  };
  api.intro = (d = 3.4) => { const o = { p: 0 }; api.setBuild?.(0, false); return gsap.to(o, { p: 1, duration: d, ease: "none", delay: 0.15, onUpdate: () => api.setBuild?.(o.p, false) }); };
  return api;
}

/** canvas làm vân (gỗ, cửa sổ sáng...) */
export function canvasTex(w, h, draw, repeat) {
  const k = document.createElement("canvas"); k.width = w; k.height = h;
  draw(k.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(k);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}

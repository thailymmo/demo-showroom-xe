// AXIOM One: mô hình xe thật (CarConcept, CC-BY 4.0) + HDRI studio + sàn gương + hậu kỳ (AO, bloom)
import { createStage, THREE, gsap, lerp, clamp } from "./stage.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

export const PAINTS = { rouge: "#a3101c", pearl: "#d9d7d0", midnight: "#0c0f16", blue: "#1b44c8", sage: "#5d7257", copper: "#a85b2e" };
const LEN = 4.7;

export function createScene(canvas, opt = {}) {
  const S = createStage(canvas, { ...opt, fov: 27, home: { pos: [7, 1.6, 8.5], look: [0, 0.6, 0] }, minD: 4, maxD: 16, minPol: 0.9, maxPol: 1.56, idle: 0, offset: opt.offset || [-0.2, 0.03], env: 1.0, maxDpr: opt.maxDpr || 2 });
  const { scene, renderer, camera } = S;
  renderer.toneMappingExposure = 0.95;
  scene.environmentIntensity = 0.9;
  scene.background = new THREE.Color('#06070a');
  const pm = new THREE.PMREMGenerator(renderer);
  const envReady = new RGBELoader().loadAsync("/hdr/photo_studio_loft_hall_1k.hdr").then((t) => { scene.environment = pm.fromEquirectangular(t).texture; t.dispose(); });

  // ánh sáng
  const key = new THREE.SpotLight("#ffffff", 110, 40, 0.5, 0.9, 1.5); key.position.set(2, 10, 6); key.target.position.set(0, 0.4, 0); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0003; scene.add(key, key.target);
  const rim = new THREE.SpotLight("#8fb0ff", 90, 40, 0.7, 0.9, 1.4); rim.position.set(-8, 4, -5); rim.target.position.set(0, 0.6, 0); scene.add(rim, rim.target);
  const warm = new THREE.SpotLight("#ff7a50", 60, 30, 0.8, 0.9, 1.4); warm.position.set(6, 2, -6); warm.target.position.set(0, 0.5, 0); scene.add(warm, warm.target);

  // sàn gương + lớp mờ dần ra xa
  const mirror = new Reflector(new THREE.CircleGeometry(14, 64), { color: 0x2a2a2e, textureWidth: 1024, textureHeight: 1024, clipBias: 0.003 });
  mirror.rotation.x = -Math.PI / 2; scene.add(mirror);
  const fadeTex = (() => { const k = document.createElement("canvas"); k.width = k.height = 512; const g = k.getContext("2d"); const gr = g.createRadialGradient(256, 256, 40, 256, 256, 256); gr.addColorStop(0, "rgba(6,7,10,0.35)"); gr.addColorStop(0.5, "rgba(6,7,10,0.8)"); gr.addColorStop(1, "rgba(6,7,10,1)"); g.fillStyle = gr; g.fillRect(0, 0, 512, 512); return new THREE.CanvasTexture(k); })();
  const veil = new THREE.Mesh(new THREE.CircleGeometry(14, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: fadeTex, transparent: true, depthWrite: false })); veil.position.y = 0.004; veil.renderOrder = 2; scene.add(veil);
  const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(30, 30).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ opacity: 0.55 })); shadowPlane.position.y = 0.006; shadowPlane.receiveShadow = true; shadowPlane.renderOrder = 3; scene.add(shadowPlane);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.012, 8, 200).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false, transparent: true, opacity: 0.35 })); ring.position.y = 0.012; scene.add(ring);

  // xe
  const car = new THREE.Group(); scene.add(car);
  const paintMats = [], paint2 = [];
  const mats = {};
  const carReady = new GLTFLoader().loadAsync("/models/car.glb").then((gltf) => {
    const g = gltf.scene;
    g.traverse((o) => { if (o.isMesh && o.name && /plate/i.test(o.name)) o.visible = false;
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; const m = o.material; mats[m.name] = m; if (m.name === "Paint 1 Carmine") paintMats.push(m); if (m.name === "Paint 2 Carmine") paint2.push(m); } });
    g.updateMatrixWorld(true);
    let b = new THREE.Box3().setFromObject(g), size = b.getSize(new THREE.Vector3());
    const L = Math.max(size.x, size.z), k = LEN / L; g.scale.setScalar(k);
    // xe hướng +X: nếu chiều dài nằm theo Z thì xoay
    if (size.z > size.x) g.rotation.y = Math.PI / 2;
    g.updateMatrixWorld(true);
    b = new THREE.Box3().setFromObject(g);
    const c = b.getCenter(new THREE.Vector3()); g.position.set(-c.x, -b.min.y, -c.z); g.updateMatrixWorld(true);
    // xác định mũi xe bằng vị trí đèn pha
    let hx = 0, n = 0; g.traverse((o) => { if (o.isMesh && o.material.name === "Headlight") { const p = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()); hx += p.x; n++; } });
    if (n && hx / n < 0) { g.rotation.y += Math.PI; g.updateMatrixWorld(true); const b2 = new THREE.Box3().setFromObject(g), c2 = b2.getCenter(new THREE.Vector3()); g.position.x -= c2.x; g.position.z -= c2.z; }
    car.add(g);
    buildCockpit(g);
    if (mats["Glass"]) { mats["Glass"].envMapIntensity = 1.5; }
  });

  // ── buồng lái: đồng hồ kỹ thuật số + HUD vẽ bằng canvas ──
  const cl = document.createElement("canvas"); cl.width = 1024; cl.height = 360; const cg = cl.getContext("2d");
  const clTex = new THREE.CanvasTexture(cl); clTex.colorSpace = THREE.SRGBColorSpace; clTex.anisotropy = 4;
  const hud = document.createElement("canvas"); hud.width = 1024; hud.height = 512; const hg = hud.getContext("2d");
  const hudTex = new THREE.CanvasTexture(hud); hudTex.colorSpace = THREE.SRGBColorSpace;
  const cab = { speed: 0, yaw: 0, pitch: 0, on: false, t: 0 };
  function drawCluster() {
    const w = 1024, h = 360, sp = Math.round(cab.speed), t = cab.t;
    cg.clearRect(0, 0, w, h); cg.fillStyle = "#070b10"; cg.fillRect(0, 0, w, h);
    const grd = cg.createLinearGradient(0, 0, w, 0); grd.addColorStop(0, "#00e5ff22"); grd.addColorStop(1, "#ff3b3b22"); cg.fillStyle = grd; cg.fillRect(0, 0, w, h);
    // vòng tốc độ
    cg.lineWidth = 16; cg.lineCap = "round";
    cg.strokeStyle = "#ffffff18"; cg.beginPath(); cg.arc(250, 190, 130, Math.PI * 0.8, Math.PI * 2.2); cg.stroke();
    cg.strokeStyle = "#00e5ff"; cg.beginPath(); cg.arc(250, 190, 130, Math.PI * 0.8, Math.PI * (0.8 + 1.4 * Math.min(1, sp / 260))); cg.stroke();
    cg.fillStyle = "#fff"; cg.font = "800 120px Outfit, sans-serif"; cg.textAlign = "center"; cg.fillText(String(sp), 250, 222);
    cg.fillStyle = "#8fb4c8"; cg.font = "600 26px Space Grotesk, sans-serif"; cg.fillText("KM/H", 250, 262);
    // công suất + pin
    cg.textAlign = "left"; cg.fillStyle = "#8fb4c8"; cg.font = "600 24px Space Grotesk, sans-serif"; cg.fillText("CÔNG SUẤT", 470, 80);
    const pw = Math.max(0, Math.min(1, sp / 200)); cg.fillStyle = "#ffffff18"; cg.fillRect(470, 96, 340, 18); cg.fillStyle = pw > 0.8 ? "#ff3b3b" : "#00e5ff"; cg.fillRect(470, 96, 340 * pw, 18);
    cg.fillStyle = "#fff"; cg.font = "700 56px Outfit, sans-serif"; cg.fillText(Math.round(640 * pw) + " HP", 470, 178);
    cg.fillStyle = "#8fb4c8"; cg.font = "600 24px Space Grotesk, sans-serif"; cg.fillText("PIN", 470, 232); cg.fillStyle = "#ffffff18"; cg.fillRect(470, 246, 340, 18); cg.fillStyle = "#7dff9a"; cg.fillRect(470, 246, 340 * (0.82 - sp / 2000), 18);
    cg.fillStyle = "#fff"; cg.font = "700 40px Outfit, sans-serif"; cg.fillText("512 km", 470, 312);
    // số D + nhiệt
    cg.textAlign = "right"; cg.fillStyle = "#ff3b3b"; cg.font = "800 96px Outfit, sans-serif"; cg.fillText("D", 970, 120);
    cg.fillStyle = "#8fb4c8"; cg.font = "600 24px Space Grotesk, sans-serif"; cg.fillText("EV · SPORT", 970, 170);
    cg.fillStyle = "#fff"; cg.font = "600 36px Space Grotesk, sans-serif"; cg.fillText("21°C", 970, 300);
    clTex.needsUpdate = true;
  }
  function drawHud() {
    const w = 1024, h = 512, sp = Math.round(cab.speed), t = cab.t;
    hg.clearRect(0, 0, w, h);
    hg.textAlign = "center"; hg.fillStyle = "#66e8d4"; hg.shadowColor = "#00c8b0"; hg.shadowBlur = 14;
    hg.font = "800 150px Outfit, sans-serif"; hg.fillText(String(sp), 512, 190);
    hg.font = "600 34px Space Grotesk, sans-serif"; hg.fillText("KM/H", 512, 240);
    // mũi tên dẫn đường nhấp nháy
    hg.strokeStyle = "#7dffea"; hg.lineWidth = 14; hg.lineJoin = "round"; hg.globalAlpha = 0.55 + 0.45 * Math.sin(t * 5);
    hg.beginPath(); hg.moveTo(512, 440); hg.lineTo(512, 330); hg.moveTo(450, 380); hg.lineTo(512, 316); hg.lineTo(574, 380); hg.stroke(); hg.globalAlpha = 1;
    hg.font = "600 30px Space Grotesk, sans-serif"; hg.fillText("RẼ PHẢI SAU 300 M", 512, 490);
    hudTex.needsUpdate = true;
  }
  let clMesh = null, hudMesh = null;
  function buildCockpit(g) {
    const m = new THREE.MeshBasicMaterial({ map: clTex, toneMapped: false });
    clMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.15), m);
    clMesh.position.set(1.06, 0.985, 0); clMesh.rotation.set(0, -Math.PI / 2, 0); clMesh.rotation.z = 0; car.add(clMesh);
    hudMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.35), new THREE.MeshBasicMaterial({ map: hudTex, transparent: true, depthWrite: false, toneMapped: true, blending: THREE.AdditiveBlending, opacity: 0.55 }));
    hudMesh.position.set(2.3, 1.22, 0); hudMesh.rotation.set(0, -Math.PI / 2, 0); car.add(hudMesh);
    drawCluster(); drawHud();
  }
  S.onFrame((dt, t) => { scene.environmentIntensity = cab.on ? 1.7 : 0.9; if (!cab.on) return; cab.t = t; drawCluster(); drawHud(); });

  // hậu kỳ
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: 4 }));
  composer.addPass(new RenderPass(scene, camera));
  const gtao = new GTAOPass(scene, camera, 2, 2);
  gtao.updateGtaoMaterial({ radius: 0.35, distanceExponent: 1.3, thickness: 1, scale: 1, samples: 16 }); gtao.blendIntensity = 0.85;
  composer.addPass(gtao);
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(2, 2), 0.16, 0.5, 0.97));
  composer.addPass(new OutputPass());
  S.composer = composer;

  const st = { scroll: null };
  const cam = S.camera, tgt = S.controls.target;
  const place = (ang, rad, h, lookY = 0.55) => { cam.position.set(Math.cos(ang) * rad, h, Math.sin(ang) * rad); tgt.set(0, lookY, 0); cam.lookAt(tgt); };
  S.THREE = THREE;
  const api = Object.assign(S, {
    ready: Promise.all([envReady, carReady]),
    setOption(k, v) {
      if (k === "paint") {
        const c = new THREE.Color(PAINTS[v]);
        paintMats.forEach((m) => gsap.to(m.color, { r: c.r, g: c.g, b: c.b, duration: 0.7 }));
        paintMats.concat(paint2).forEach((m) => m.normalScale && m.normalScale.set(0.12, 0.12));
        const d = c.clone().multiplyScalar(0.35); paint2.forEach((m) => gsap.to(m.color, { r: d.r, g: d.g, b: d.b, duration: 0.7 }));
        warm.color.copy(c.clone().lerp(new THREE.Color("#ff7a50"), 0.5));
      }
    },
    /** chế độ ngồi trong buồng lái: speed 0..260, yaw/pitch (rad) do người xem rê chuột */
    cockpit(speed, yaw, pitch) {
      cab.on = true; cab.speed = speed; st.scroll = 2; S.controls.enabled = false;
      cam.position.set(0.18 + yaw * 0.04, 1.16 + pitch * 0.02, 0);
      // hướng nhìn: về phía đồng hồ, hơi chúc xuống; rê chuột lệch trái/phải, lên/xuống
      const dir = new THREE.Vector3(Math.cos(yaw) * Math.cos(pitch), -0.13 + Math.sin(pitch), Math.sin(yaw) * Math.cos(pitch)).normalize();
      tgt.copy(cam.position).addScaledVector(dir, 3); cam.fov = 58; cam.updateProjectionMatrix(); cam.lookAt(tgt);
    },
    cockpitOff() { cab.on = false; },
    debug(c) { st.scroll = 1; S.controls.enabled = false; cam.position.set(c[0], c[1], c[2]); tgt.set(c[3], c[4], c[5]); cam.lookAt(tgt); cam.fov = c[6] || 27; cam.updateProjectionMatrix(); },
    setProgress(p) {
      st.scroll = p; S.controls.enabled = false;
      const orb = clamp(p / 0.8, 0, 1);
      const ang = lerp(0.55, 0.55 + Math.PI * 2.0, orb), rad = lerp(11, 7.2, Math.sin(orb * Math.PI) * 0.8 + 0.2), h = lerp(2.0, 0.9, Math.sin(orb * Math.PI * 2) * 0.5 + 0.5);
      if (p <= 0.8) { cam.fov = 27; cam.updateProjectionMatrix(); place(ang, rad, h); return; }
      // bay vào khoang lái
      const t = clamp((p - 0.8) / 0.2, 0, 1), e = t * t * (3 - 2 * t);
      const p0 = new THREE.Vector3(Math.cos(ang) * rad, h, Math.sin(ang) * rad), p1 = new THREE.Vector3(0.18, 1.1, 0);
      cam.position.lerpVectors(p0, p1, e);
      tgt.lerpVectors(new THREE.Vector3(0, 0.55, 0), new THREE.Vector3(3.2, 0.85, 0), e);
      cam.fov = lerp(27, 58, e); cam.updateProjectionMatrix(); cam.lookAt(tgt);
    },
  });
  return api;
}

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
    if (mats["Glass"]) { mats["Glass"].envMapIntensity = 1.5; }
  });

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
    debug(c) { st.scroll = 1; S.controls.enabled = false; cam.position.set(c[0], c[1], c[2]); tgt.set(c[3], c[4], c[5]); cam.lookAt(tgt); cam.fov = c[6] || 27; cam.updateProjectionMatrix(); },
    setProgress(p) {
      st.scroll = p; S.controls.enabled = false;
      const orb = clamp(p / 0.8, 0, 1);
      const ang = lerp(0.55, 0.55 + Math.PI * 2.0, orb), rad = lerp(11, 7.2, Math.sin(orb * Math.PI) * 0.8 + 0.2), h = lerp(2.0, 0.9, Math.sin(orb * Math.PI * 2) * 0.5 + 0.5);
      if (p <= 0.8) { cam.fov = 27; cam.updateProjectionMatrix(); place(ang, rad, h); return; }
      // bay vào khoang lái
      const t = clamp((p - 0.8) / 0.2, 0, 1), e = t * t * (3 - 2 * t);
      const p0 = new THREE.Vector3(Math.cos(ang) * rad, h, Math.sin(ang) * rad), p1 = new THREE.Vector3(-0.6, 1.28, 0);
      cam.position.lerpVectors(p0, p1, e);
      tgt.lerpVectors(new THREE.Vector3(0, 0.55, 0), new THREE.Vector3(3, 0.9, 0), e);
      cam.fov = lerp(27, 70, e); cam.updateProjectionMatrix(); cam.lookAt(tgt);
    },
  });
  return api;
}

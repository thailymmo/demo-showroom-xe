// Xe điện dựng bằng code: thân đúc theo biên dạng bên hông, kính, mâm, đèn LED; đổi màu sơn, xoay theo cuộn
import { createStage, THREE, gsap, lerp, clamp } from "./stage.js";

export const PAINTS = { rouge: "#b3121f", pearl: "#ecebe6", midnight: "#10131a", blue: "#1f4fd8", sage: "#6a7d62", copper: "#b0663a" };

export function createScene(canvas, opt = {}) {
  const S = createStage(canvas, { ...opt, fov: 28, home: { pos: [6.5, 1.7, 7.5], look: [0, 0.65, 0] }, minD: 4, maxD: 14, minPol: 1.0, maxPol: 1.55, idle: 0, offset: opt.offset || [-0.2, 0.03], env: 0.9 });
  const { scene, renderer } = S;
  renderer.toneMappingExposure = 1.05;
  // ánh sáng showroom
  const spot = new THREE.SpotLight("#ffffff", 150, 30, 0.45, 0.8, 1.5); spot.position.set(2, 9, 3); spot.target.position.set(0, 0.5, 0); spot.castShadow = true; spot.shadow.mapSize.set(2048, 2048); spot.shadow.bias = -0.0003; scene.add(spot, spot.target);
  const rimL = new THREE.SpotLight("#7aa2ff", 55, 30, 0.6, 0.9, 1.4); rimL.position.set(-7, 4, -5); rimL.target.position.set(0, 0.6, 0); scene.add(rimL, rimL.target);
  const warmL = new THREE.PointLight("#ff6a4a", 12, 14, 1.6); warmL.position.set(5, 1, -4); scene.add(warmL);
  const hemi = new THREE.HemisphereLight("#9fb4ff", "#151922", 0.35); scene.add(hemi);
  scene.fog = new THREE.FogExp2('#06070a', 0.028);
  // sàn
  const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 96).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: "#07080b", roughness: 0.5, metalness: 0.2 })); floor.receiveShadow = true; scene.add(floor);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.025, 8, 160).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false })); ring.position.y = 0.01; scene.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.015, 8, 160).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false, transparent: true, opacity: 0.4 })); ring2.position.y = 0.01; scene.add(ring2);

  const car = new THREE.Group(); scene.add(car);
  const paint = new THREE.MeshPhysicalMaterial({ color: PAINTS.rouge, metalness: 0.65, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.2 });
  const glass = new THREE.MeshPhysicalMaterial({ color: "#06080c", metalness: 0.2, roughness: 0.05, clearcoat: 1, envMapIntensity: 1.6 });
  const black = new THREE.MeshStandardMaterial({ color: "#0a0b0e", roughness: 0.6, metalness: 0.3 });
  const chrome = new THREE.MeshStandardMaterial({ color: "#d9dce2", roughness: 0.15, metalness: 1 });
  const add = (geo, mat, x, y, z, rot) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (rot) m.rotation.set(...rot); m.castShadow = true; m.receiveShadow = true; car.add(m); return m; };

  // thân: biên dạng bên hông (có hốc bánh) → đúc theo bề ngang
  const sh = new THREE.Shape();
  const A = 0.44, CY = 0.36, X1 = -1.45, X2 = 1.45;
  const a0 = Math.asin(0.11 / A);
  sh.moveTo(-2.3, 0.25);
  const arch = (cx) => { for (let i = 0; i <= 28; i++) { const th = Math.PI + a0 - (i / 28) * (Math.PI + 2 * a0); sh.lineTo(cx + A * Math.cos(th), CY + A * Math.sin(th)); } };
  sh.lineTo(X1 - A * Math.cos(a0), 0.25); arch(X1);
  sh.lineTo(X2 - A * Math.cos(a0), 0.25); arch(X2);
  sh.lineTo(2.3, 0.25);
  sh.splineThru([[2.36, 0.42], [2.36, 0.58], [2.2, 0.74], [1.55, 0.87], [1.15, 1.0], [0.5, 1.33], [0.0, 1.42], [-0.9, 1.4], [-1.55, 1.22], [-2.1, 0.98], [-2.33, 0.72], [-2.36, 0.46]].map(([x, y]) => new THREE.Vector2(x, y)));
  sh.lineTo(-2.3, 0.25);
  const bodyGeo = new THREE.ExtrudeGeometry(sh, { depth: 1.66, bevelEnabled: true, bevelThickness: 0.13, bevelSize: 0.1, bevelSegments: 12, curveSegments: 32 });
  bodyGeo.translate(0, 0, -0.83);
  add(bodyGeo, paint, 0, 0, 0);
  // kính hông
  const win = new THREE.Shape(); [[-1.45, 1.0], [-0.95, 1.3], [0.05, 1.36], [0.55, 1.28], [1.1, 1.0]].forEach(([x, y], i) => (i ? win.lineTo(x, y) : win.moveTo(x, y))); win.lineTo(-1.45, 1.0);
  const winGeo = new THREE.ExtrudeGeometry(win, { depth: 2.1, bevelEnabled: false }); winGeo.translate(0, 0, -1.05);
  add(winGeo, glass, 0, 0, 0);
  // kính chắn gió / kính sau (mặt phẳng nghiêng)
  const slab = (x1, y1, x2, y2, w) => { const L = Math.hypot(x2 - x1, y2 - y1), m = add(new THREE.BoxGeometry(L, 0.02, w), glass, (x1 + x2) / 2, (y1 + y2) / 2 + 0.065, 0, [0, 0, Math.atan2(y2 - y1, x2 - x1)]); return m; };
  slab(1.24, 1.0, 0.52, 1.35, 1.5); slab(-1.56, 1.24, -0.96, 1.4, 1.5);
  // mái kính panorama
  add(new THREE.BoxGeometry(1.2, 0.02, 1.4), glass, -0.25, 1.485, 0);
  // đèn LED trước/sau
  const led = new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }), tail = new THREE.MeshBasicMaterial({ color: "#ff2a2a", toneMapped: false });
  add(new THREE.BoxGeometry(0.05, 0.05, 1.45), led, 2.48, 0.6, 0); add(new THREE.BoxGeometry(0.06, 0.06, 0.4), led, 2.4, 0.56, 0.72); add(new THREE.BoxGeometry(0.06, 0.06, 0.4), led, 2.4, 0.56, -0.72);
  add(new THREE.BoxGeometry(0.05, 0.07, 1.55), tail, -2.5, 0.72, 0);
  // viền chrome, gương, ốp hông
  add(new THREE.BoxGeometry(3.2, 0.02, 0.02), chrome, 0.05, 0.98, 1.04); add(new THREE.BoxGeometry(3.2, 0.02, 0.02), chrome, 0.05, 0.98, -1.04);
  add(new THREE.BoxGeometry(4.2, 0.1, 0.06), black, 0, 0.27, 1.02); add(new THREE.BoxGeometry(4.2, 0.1, 0.06), black, 0, 0.27, -1.02);
  add(new THREE.BoxGeometry(0.18, 0.12, 0.2), paint, 0.95, 1.08, 1.12); add(new THREE.BoxGeometry(0.18, 0.12, 0.2), paint, 0.95, 1.08, -1.12);
  add(new THREE.BoxGeometry(0.02, 0.45, 0.02), black, -0.5, 0.62, 1.03); add(new THREE.BoxGeometry(0.02, 0.45, 0.02), black, 0.55, 0.62, 1.03);
  add(new THREE.BoxGeometry(0.02, 0.45, 0.02), black, -0.5, 0.62, -1.03); add(new THREE.BoxGeometry(0.02, 0.45, 0.02), black, 0.55, 0.62, -1.03);
  add(new THREE.BoxGeometry(0.6, 0.12, 1.6), black, 2.3, 0.3, 0); add(new THREE.BoxGeometry(0.5, 0.12, 1.6), black, -2.3, 0.3, 0);
  // bánh xe
  const wheels = [];
  [[X1, 1], [X1, -1], [X2, 1], [X2, -1]].forEach(([x, s]) => {
    const w = new THREE.Group(); w.position.set(x, CY, s * 0.82); car.add(w);
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.26, 40).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: "#0d0d0f", roughness: 0.85 })); tire.castShadow = true; w.add(tire);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.255, 0.255, 0.27, 40).rotateX(Math.PI / 2), chrome); w.add(rim);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.3, 20).rotateX(Math.PI / 2), black); w.add(hub);
    for (let i = 0; i < 6; i++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.285), black); sp.position.set(Math.cos((i / 6) * 6.283) * 0.14, Math.sin((i / 6) * 6.283) * 0.14, 0); sp.rotation.z = (i / 6) * 6.283; w.add(sp); }
    const cal = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.05), new THREE.MeshStandardMaterial({ color: "#e0322b", roughness: 0.4 })); cal.position.set(0.1, 0.1, s * -0.07); w.add(cal);
    wheels.push(w);
  });

  const st = { ang: 0.5, auto: true, scroll: null };
  const cam = S.camera, tgt = S.controls.target;
  const place = (ang, rad, h, lookY = 0.62, lx = 0) => { cam.position.set(Math.cos(ang) * rad + lx, h, Math.sin(ang) * rad); tgt.set(lx, lookY, 0); cam.lookAt(tgt); };
  S.onFrame((dt, t) => {
    ring.material.opacity = 1; const p = 0.5 + Math.sin(t * 1.6) * 0.5; ring.scale.setScalar(1 + p * 0.004);
    wheels.forEach((w) => (w.rotation.z = 0));
    if (st.scroll != null) return;
  });
  const api = Object.assign(S, {
    setOption(k, v) {
      if (k === "paint") { const c = new THREE.Color(PAINTS[v]); gsap.to(paint.color, { r: c.r, g: c.g, b: c.b, duration: 0.7 }); }
    },
    /** p: 0..1 — camera đi vòng quanh xe */
    setProgress(p) {
      st.scroll = p; S.controls.enabled = false;
      const e = p;
      const ang = lerp(0.55, 0.55 + Math.PI * 2.0, e);
      const rad = lerp(14.5, 10.2, Math.sin(e * Math.PI));
      const h = lerp(1.9, 1.1, Math.sin(e * Math.PI * 2) * 0.5 + 0.5);
      place(ang, rad, h);
    },
    paintMat: paint,
  });
  return api;
}

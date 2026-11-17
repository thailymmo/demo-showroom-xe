// Khối 3D do AI dựng: xem xoay được, vật liệu clay-chrome để lộ hình dáng
import { createStage, THREE, gsap } from "./stage.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

export function createAiViewer(canvas) {
  const S = createStage(canvas, { fov: 30, home: { pos: [5.5, 1.8, 5.5], look: [0, 0.6, 0] }, minD: 3, maxD: 12, idle: 0.004, shadows: false, offset: [0, 0], env: 1 });
  const { scene, renderer } = S;
  renderer.toneMappingExposure = 1.1;
  const pm = new THREE.PMREMGenerator(renderer);
  new RGBELoader().loadAsync("/hdr/photo_studio_loft_hall_1k.hdr").then((t) => { scene.environment = pm.fromEquirectangular(t).texture; t.dispose(); });
  scene.add(new THREE.HemisphereLight("#ffffff", "#223", 0.5));
  const mat = new THREE.MeshPhysicalMaterial({ color: "#c9ced8", metalness: 0.9, roughness: 0.22, clearcoat: 0.6 });
  const grid = new THREE.GridHelper(14, 28, "#3a4560", "#1e2638"); grid.position.y = 0; scene.add(grid);
  let cur = null;
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  S.show = async (url) => {
    const g = (await loader.loadAsync(url)).scene;
    g.traverse((o) => { if (o.isMesh) { o.material = mat; if (o.geometry && !o.geometry.attributes.normal) o.geometry.computeVertexNormals(); } });
    let b = new THREE.Box3().setFromObject(g), s = b.getSize(new THREE.Vector3());
    g.scale.setScalar(4.2 / Math.max(s.x, s.z)); g.updateMatrixWorld(true);
    b = new THREE.Box3().setFromObject(g); const c = b.getCenter(new THREE.Vector3()); g.position.set(-c.x, -b.min.y, -c.z);
    if (cur) scene.remove(cur);
    g.scale.multiplyScalar(0.01); scene.add(g); cur = g;
    gsap.to(g.scale, { x: g.scale.x * 100, y: g.scale.y * 100, z: g.scale.z * 100, duration: 0.9, ease: "back.out(1.4)" });
  };
  return S;
}

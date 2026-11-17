// Quay trang web AXIOM thật: mỗi khung hình là một ảnh chụp trang ở thời điểm t của kịch bản (hàm thuần của t)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
// Dùng: node tour.mjs <worker> <số worker> [từ khung] [đến khung]
//   biến môi trường: URL (mặc định http://127.0.0.1:4173), OUT (thư mục khung), FPS, WIDTH, HEIGHT, SCALE (kéo dài kịch bản: 1 = 45 giây, 0.5 = 22,5 giây), LITE=1 (tắt AO/bloom), GPU=1 (bật cờ GPU cho Chrome)
const [W0 = "0", WN = "1", F0 = "0", F1Arg] = process.argv.slice(2);
const FPS = process.env.FPS || "12", WIDTH = process.env.WIDTH || "1280", HEIGHT = process.env.HEIGHT || "720", SCALE = +(process.env.SCALE || 1);
const F1 = F1Arg || String(Math.round(45 * SCALE * +FPS));
const OUT = (process.env.OUT || "./frames").replace(/\/?$/, "/"); mkdirSync(OUT, { recursive: true });
const BASE = process.env.URL || "http://127.0.0.1:4173";
const b = await chromium.launch({ args: process.env.GPU ? ["--no-sandbox", "--use-gl=angle", "--use-angle=gl-egl", "--ignore-gpu-blocklist", "--enable-gpu-rasterization", "--autoplay-policy=no-user-gesture-required"] : ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader", "--autoplay-policy=no-user-gesture-required"] });
const ctx = await b.newContext({ viewport: { width: +WIDTH, height: +HEIGHT }, deviceScaleFactor: 1 });
const p = await ctx.newPage(); p.setDefaultTimeout(900000);
await p.goto(`${BASE}/?film=1${process.env.LITE ? "&lite=1" : ""}`); await p.waitForFunction(() => window.__axiom, null, { timeout: 900000 }); await p.waitForTimeout(4000);
// vị trí các phần (px) và chiều cao khung nhìn
const L = await p.evaluate(() => { const q = (s) => { const e = document.querySelector(s); return e ? [e.offsetTop, e.offsetHeight] : [0, 0]; }; const vh = innerHeight; const o = {}; for (const [k, s] of [["hero", ".hero"], ["walk", ".walk"], ["cab", ".cab"], ["drv", ".drv"], ["tt", ".tt"], ["close", ".close"], ["ai", ".ai"], ["specs", ".specs"], ["hz", ".hz"], ["drive", ".drive"]]) { let e = document.querySelector(s), t = 0; while (e) { t += e.offsetTop; e = e.offsetParent; } o[k] = [t, document.querySelector(s)?.offsetHeight || 0]; } o.vh = vh; o.total = document.documentElement.scrollHeight; return o; });
console.log(JSON.stringify(L));
const sm = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const seg = (t, a, b) => (t - a) / (b - a);
// kịch bản: thời gian (giây) -> scrollY
function scrollAt(t) {
  const K = [
    [0, 0], [3.2, 0],
    [3.2, L.walk[0]], [12.5, L.walk[0] + L.walk[1] - L.vh],
    [12.5, L.cab[0]], [19, L.cab[0] + L.cab[1] - L.vh],
    [19, L.drv[0] - (L.vh - Math.min(L.drv[1], L.vh)) / 2 + 40], [23, L.drv[0] - (L.vh - Math.min(L.drv[1], L.vh)) / 2 + 40],
    [23, L.tt[0]], [28, L.tt[0] + L.tt[1] - L.vh],
    [28, L.close[0]], [31.5, L.close[0] + L.close[1] - L.vh * 0.6],
    [31.5, L.ai[0] + 40], [37.5, L.ai[0] + 40],
    [37.5, L.specs[0]], [40.5, L.specs[0] + L.specs[1] * 0.5],
    [40.5, L.drive[0] - 40], [45, L.drive[0] - 40],
  ];
  for (let i = 0; i < K.length - 1; i++) { const [t0, y0] = K[i], [t1, y1] = K[i + 1]; if (t >= t0 && t <= t1) { if (t1 === t0) return y1; const u = seg(t, t0, t1); const flat = i % 2 === 0 && K[i][1] === K[i + 1][1]; return y0 + (y1 - y0) * (flat ? 0 : u); } }
  return K[K.length - 1][1];
}
const PAINTS = [[0, "rouge"], [1.4, "blue"], [2.3, "pearl"], [3.0, "rouge"]];
const paintAt = (t) => { let c = "rouge"; for (const [tt, v] of PAINTS) if (t >= tt) c = v; return c; };
const aiAt = (t) => (t < 33 ? -1 : t < 35.2 ? 0 : t < 37 ? 2 : 4);
let curPaint = "rouge", curAi = -2, lastSig = "", lastFile = null;
import { copyFileSync } from "node:fs";
const t0 = Date.now(); let done = 0;
for (let f = +F0; f < +F1; f++) {
  if (f % +WN !== +W0) continue;
  const t = f / +FPS / SCALE;
  const y = Math.round(scrollAt(t));
  const live = y < L.hero[1] || (t >= 12.5 && t < 19) || (t >= 19 && t < 23);
  const sig = [y, paintAt(t), aiAt(t)].join("|");
  if (!live && sig === lastSig && lastFile) { copyFileSync(lastFile, `${OUT}${String(f).padStart(4, "0")}.jpg`); lastFile = `${OUT}${String(f).padStart(4, "0")}.jpg`; continue; }
  lastSig = sig;
  await p.evaluate(([y, t]) => {
    window.scrollTo(0, y);
    const v = document.querySelector("#drvv");
    if (v && v.src) { const ph = t - 19; if (ph >= -2 && ph <= 5) { v.currentTime = Math.max(0, (ph + 0) % (v.duration || 5)); } }
    // chuột nhìn quanh trong buồng lái
    if (t >= 12.5 && t < 19) { const u = (t - 12.5) / 6.5; dispatchEvent(new PointerEvent("pointermove", { clientX: innerWidth * (0.5 + 0.38 * Math.sin(u * 5)), clientY: innerHeight * (0.5 + 0.1 * Math.sin(u * 3)) })); }
  }, [y, t]);
  const wp = paintAt(t); if (wp !== curPaint) { await p.evaluate((v) => document.querySelector(`#rail [data-v="${v}"]`)?.click(), wp); curPaint = wp; }
  const wa = aiAt(t); if (wa !== curAi && wa >= 0) { await p.evaluate((i) => document.querySelectorAll("#aic button")[i]?.click(), wa); curAi = wa; }
  await p.waitForTimeout(700);
  lastFile = `${OUT}${String(f).padStart(4, "0")}.jpg`;
  await p.screenshot({ path: lastFile, type: "jpeg", quality: 90 });
  done++;
  if (done % 5 === 0) console.log("frame", f, "t", t.toFixed(1), ((Date.now() - t0) / 1000 / done).toFixed(1), "s/frame");
}
console.log("done", ((Date.now() - t0) / 1000).toFixed(0), "s"); await b.close();

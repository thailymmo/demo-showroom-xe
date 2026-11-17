import "@fontsource-variable/outfit";
import "@fontsource-variable/space-grotesk";
import "./style.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { createScene } from "./scene.js";

gsap.registerPlugin(ScrollTrigger);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!reduce && !new URLSearchParams(location.search).has("film")) {
  const lenis = new Lenis({ lerp: 0.09 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => { const t = $(a.getAttribute("href")); if (t) { e.preventDefault(); lenis.scrollTo(t, { duration: 1.6 }); } }));
}
const car = createScene($("#car"));
car.ready.then(() => { if (new URLSearchParams(location.search).has("film")) { window.__dbg = true; window.__axiom = car; } document.body.classList.add("car-ready"); car.setOption("paint", "rouge"); const q = new URLSearchParams(location.search).get("cam"); if (q) { window.__dbg = true; car.debug(q.split(",").map(Number)); } });
const ACC = { rouge: ["#ff3b3b", "Đỏ Rouge"], pearl: ["#e8e8e0", "Trắng Ngọc Trai"], midnight: ["#7c8cff", "Đen Midnight"], blue: ["#4f86ff", "Xanh Racing"], sage: ["#9ec58f", "Xanh Sage"], copper: ["#ff9b5e", "Đồng Copper"] };
$("#rail").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  $$("#rail button").forEach((x) => x.classList.toggle("on", x === b));
  const [c, n] = ACC[b.dataset.v]; car.setOption("paint", b.dataset.v);
  document.documentElement.style.setProperty("--acc", c); $("#pn").textContent = n; $("#cn").textContent = n;
});

/* bố cục camera theo vị trí cuộn: hero (xe tự xoay chậm) → vòng quanh xe → ẩn khi qua phần thông số */
const cvs = $("#car"), wc = $$(".wc"), wbar = $(".wbar i");
let heroT = 0, mode = "hero";
const heroPos = (t) => { const a = 0.62 + Math.sin(t * 0.25) * 0.25; car.camera.position.set(Math.cos(a) * 9.6, 1.7, Math.sin(a) * 9.6); car.controls.target.set(0, 0.6, 0); car.camera.lookAt(car.controls.target); };
car.onFrame((dt, t) => { if (mode === "hero" && !window.__dbg) heroPos(t); });
ScrollTrigger.create({ trigger: ".walk", start: "top top", end: "bottom bottom", scrub: 0.5, onUpdate: (st) => {
  const p = st.progress; wbar.style.width = p * 100 + "%";
  const i = Math.min(4, Math.floor(p * 5)); wc.forEach((el, k) => el.classList.toggle("on", k === i && p > 0.02));
  car.setProgress(p);
} });
ScrollTrigger.create({ trigger: ".walk", start: "top 60%", end: "bottom top", onToggle: (st) => { if (mode !== "cab") mode = st.isActive ? "walk" : "hero"; } });
ScrollTrigger.create({ trigger: ".specs", start: "top 80%", onToggle: (st) => (cvs.style.display = st.isActive ? "none" : "block") , onLeaveBack: () => (cvs.style.display = "block") });
/* chữ số đếm lên */
$$("[data-n]").forEach((el) => { const to = +el.dataset.n, d = +el.dataset.d || 0, o = { v: 0 }; gsap.to(o, { v: to, duration: 2.2, delay: 0.8, ease: "power2.out", onUpdate: () => (el.textContent = o.v.toFixed(d).replace(".", ",")) }); });
/* cuộn ngang chi tiết */
const HZ = [["xe03", "Khoang lái", "Da và ốp gỗ, màn hình cong 15,6”"], ["xe04", "Mâm 21” rèn", "Phanh gốm tuỳ chọn"], ["xe05", "Đèn hậu một dải", "LED mỏng 4 mm"], ["xe07", "Sạc 270 kW", "10–80% trong 18 phút"], ["xe02", "Showroom", "3 thành phố lớn"]];
$("#hzr").innerHTML = HZ.map(([im, t, s]) => `<figure class="hc"><img src="/img/${im}.jpg" alt="${t}" loading="lazy"><figcaption><b>${t}</b><span>${s}</span></figcaption></figure>`).join("");
if (!reduce) {
  const row = $("#hzr"); const dist = () => row.scrollWidth - innerWidth + 80;
  gsap.to(row, { x: () => -dist(), ease: "none", scrollTrigger: { trigger: ".hz", start: "top top", end: "bottom bottom", scrub: 0.6, invalidateOnRefresh: true } });
  gsap.to(".hzt", { xPercent: -14, ease: "none", scrollTrigger: { trigger: ".hz", start: "top top", end: "bottom bottom", scrub: true } });
  gsap.from(".hl > *", { y: 50, opacity: 0, duration: 1.1, stagger: 0.12, ease: "power3.out", delay: 0.2 });
  gsap.from(".rail > *", { x: 30, opacity: 0, duration: 0.8, stagger: 0.06, ease: "power3.out", delay: 0.8 });
  $$(".specs h2, .sg div, .cfg > *, .fm").forEach((el) => gsap.from(el, { y: 50, opacity: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } }));
}
/* cấu hình giá */
let base = 2190, add = [0, 0];
const price = () => { $("#pr").textContent = (base + add[0] + add[1]).toLocaleString("vi-VN") + " triệu"; };
[["#whl", 0], ["#bat", 1]].forEach(([sel, i]) => $(sel).addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; $$("button", $(sel)).forEach((x) => x.classList.toggle("on", x === b)); add[i] = +b.dataset.p; price(); }));
price();

/* ───────── Nhìn gần + Phòng thiết kế AI (đọc từ /ai/manifest.json, tải 3D khi cuộn tới) ───────── */
fetch("/ai/manifest.json").then((r) => (r.ok ? r.json() : null)).catch(() => null).then((man) => {
  if (!man) { $("#nhin-gan")?.remove(); $("#ai")?.remove(); return; }
  $("#cg").innerHTML = man.stills.map((s) => `<figure class="cf"><img src="${s.img}" alt="${s.t}" loading="lazy"><figcaption><b>${s.t}</b>${s.s}</figcaption></figure>`).join("");
  if (!reduce) $$(".cf").forEach((f) => { gsap.from(f, { y: 70, opacity: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: f, start: "top 90%" } }); gsap.fromTo($("img", f), { yPercent: -4 }, { yPercent: 4, ease: "none", scrollTrigger: { trigger: f, scrub: true } }); });
  const aic = $("#aic"); aic.innerHTML = man.concepts.map((c, i) => `<button data-i="${i}" role="listitem" aria-label="Concept ${i + 1}"><img src="${c.img}" alt="Concept ${i + 1}" loading="lazy"><span>0${i + 1}</span>${c.glb ? "<i>3D</i>" : ""}</button>`).join("");
  let viewer = null;
  const open = async (i) => {
    $$("button", aic).forEach((b, k) => b.classList.toggle("on", k === i));
    const c = man.concepts[i];
    if (!c.glb) { $("#aivn").textContent = "Concept " + (i + 1) + " — chưa dựng 3D"; return; }
    $("#aivn").textContent = "Đang dựng khối 3D…";
    if (!viewer) { const { createAiViewer } = await import("./ai-viewer.js"); viewer = createAiViewer($("#aiv")); }
    await viewer.show(c.glb); $("#aivn").textContent = "Kéo để xoay · khối do AI dựng từ concept " + (i + 1);
  };
  aic.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) open(+b.dataset.i); });
  const first = man.concepts.findIndex((c) => c.glb);
  new IntersectionObserver((es, io) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); open(first >= 0 ? first : 0); } }, { rootMargin: "120% 0px" }).observe($("#ai"));
});

/* ───────── Ảnh render quay vòng: vẽ khung hình theo vị trí cuộn ───────── */
(() => {
  const cv = $("#ttc"); if (!cv) return;
  const g = cv.getContext("2d"), N = 72, frames = new Array(N);
  let cur = 0, loaded = 0;
  const draw = (i) => { const im = frames[i] || frames.find((x) => x?.complete && x.naturalWidth); if (im && im.naturalWidth) g.drawImage(im, 0, 0, cv.width, cv.height); };
  const load = () => { for (let i = 0; i < N; i++) { const im = new Image(); im.src = `/img/render/seq/${String(i).padStart(3, "0")}.jpg`; im.onload = () => { loaded++; if (i === cur || loaded === 1) draw(cur); }; frames[i] = im; } };
  new IntersectionObserver((es, io) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); load(); } }, { rootMargin: "150% 0px" }).observe($(".tt"));
  const bar = $(".ttb i");
  ScrollTrigger.create({ trigger: ".tt", start: "top top", end: "bottom bottom", scrub: true, onUpdate: (st) => { const i = Math.min(N - 1, Math.floor(st.progress * N)); bar.style.width = st.progress * 100 + "%"; if (i !== cur) { cur = i; draw(i); } }, onEnter: () => (cvs.style.display = "none"), onLeaveBack: () => (cvs.style.display = "block") });
})();
fetch("/ai/manifest.json").then((r) => (r.ok ? r.json() : null)).catch(() => null).then((man) => {
  if (man?.colors) $("#cols").innerHTML = man.colors.map((c) => `<figure><img src="${c.img}" alt="${c.n}" loading="lazy"><figcaption>${c.n}</figcaption></figure>`).join("");
});

/* ───────── Buồng lái: nhìn quanh bằng chuột, cuộn để tăng tốc ───────── */
(() => {
  const sec = $(".cab"); if (!sec) return;
  let cabP = 0, active = false, sp = 0, yawT = 0, pitchT = 0, yaw = 0, pitch = 0;
  addEventListener("pointermove", (e) => { yawT = ((e.clientX / innerWidth) - 0.5) * 0.9; pitchT = -((e.clientY / innerHeight) - 0.5) * 0.35; });
  const v = $("#cabv"), ph = $("#cabimg"), phs = $$("#cabimg img");
  const sstep = (a, b, x) => { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); };
  // ảnh AI mờ dần (0.22 → 0.42) để lộ khoang lái 3D; chữ số tốc độ chỉ hiện khi vào 3D
  const photo = (p) => { const o = 1 - sstep(0.22, 0.42, p); ph.style.opacity = o; ph.style.pointerEvents = o > 0.05 ? "auto" : "none"; phs.forEach((im) => (im.style.transform = `scale(${1 + 0.05 * p / 0.4}) translate(${yawS * -14}px, ${pitS * 10}px)`)); $(".cabs").style.opacity = sstep(0.38, 0.55, p); };
  let yawS = 0, pitS = 0;
  addEventListener("pointermove", (e) => { yawS = (e.clientX / innerWidth - 0.5) * 2; pitS = (e.clientY / innerHeight - 0.5) * 2; });
  $$(".cabtabs button").forEach((b) => b.addEventListener("click", () => { $$(".cabtabs button").forEach((x) => x.classList.toggle("on", x === b)); phs.forEach((im, i) => im.classList.toggle("on", i === +b.dataset.i)); }));
  ScrollTrigger.create({ trigger: ".cab", start: "top top", end: "bottom bottom", onToggle: (st) => { active = st.isActive; if (active) mode = "cab"; else { mode = "hero"; car.cockpitOff(); } }, onUpdate: (st) => { const p = st.progress; cabP = p; photo(p); sp = Math.round(Math.min(1, p * 1.15) ** 1.4 * 240); v.textContent = sp; } });
  car.onFrame((dt) => { if (!active) return; yaw += (yawT - yaw) * Math.min(1, dt * 4); pitch += (pitchT - pitch) * Math.min(1, dt * 4); car.cockpit(sp, yaw, pitch, Math.min(1, Math.max(0, (cabP - 0.12) * 2.4))); });
})();

/* video xe chạy: chỉ nạp khi cuộn tới, nếu có file */
(() => {
  const v = $("#drvv"); if (!v) return;
  fetch("/video/drive.mp4", { method: "HEAD" }).then((r) => {
    if (!r.ok) { $("#chay-that")?.remove(); return; }
    v.src = new URLSearchParams(location.search).has("film") ? "/video/drive.webm" : "/video/drive.mp4";
    new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }, { threshold: 0.25 }).observe(v);
  }).catch(() => $("#chay-that")?.remove());
})();

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
if (!reduce) {
  const lenis = new Lenis({ lerp: 0.09 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => { const t = $(a.getAttribute("href")); if (t) { e.preventDefault(); lenis.scrollTo(t, { duration: 1.6 }); } }));
}
const car = createScene($("#car"));
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
const heroPos = (t) => { const a = 0.62 + Math.sin(t * 0.25) * 0.25; car.camera.position.set(Math.cos(a) * 13, 2.2, Math.sin(a) * 13); car.controls.target.set(0, 0.6, 0); car.camera.lookAt(car.controls.target); };
car.onFrame((dt, t) => { if (mode === "hero") heroPos(t); });
ScrollTrigger.create({ trigger: ".walk", start: "top top", end: "bottom bottom", scrub: 0.5, onUpdate: (st) => {
  const p = st.progress; wbar.style.width = p * 100 + "%";
  const i = Math.min(3, Math.floor(p * 4)); wc.forEach((el, k) => el.classList.toggle("on", k === i && p > 0.02));
  car.setProgress(p);
} });
ScrollTrigger.create({ trigger: ".walk", start: "top 60%", end: "bottom top", onToggle: (st) => (mode = st.isActive ? "walk" : "hero") });
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

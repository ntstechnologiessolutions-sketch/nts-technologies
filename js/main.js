import { projects, testimonials } from "./data.js";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const lowPower = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
const touchDevice = window.matchMedia("(pointer: coarse)").matches;
const calmMode = reducedMotion || lowPower || touchDevice;
let enquiryFirebasePromise;

function getEnquiryFirebase() {
  if (!enquiryFirebasePromise) {
    enquiryFirebasePromise = (async () => {
      const { firebaseConfig } = await import("./firebase-config.js");
      if (firebaseConfig.apiKey.startsWith("YOUR_") || firebaseConfig.projectId.startsWith("YOUR_")) throw new Error("not-configured");
      const [{ initializeApp, getApps, getApp }, firestore] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js"), import("https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js")
      ]);
      const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
      return { db: firestore.getFirestore(app), ...firestore };
    })();
  }
  return enquiryFirebasePromise;
}

const projectMarkup = {
  broker: `<div class="project-ui project-ui-broker"><div class="mini-top"><span>N<span> / </span>MARKETS</span><small>DEMO ENVIRONMENT</small></div><div class="mini-quote"><small>NIFTY 50 <i>NSE</i></small><b>24,781.25</b><span>+206.40&nbsp; (+0.84%)</span></div><div class="mini-chart"><svg viewBox="0 0 420 130" role="img" aria-label="Illustrative rising chart"><path class="mini-grid" d="M0 25h420M0 65h420M0 105h420"/><path class="mini-area" d="M0 104 32 87 64 91 95 70 126 78 158 56 190 68 221 43 253 48 284 30 316 39 348 19 380 27 420 9v121H0Z"/><path class="mini-line" d="M0 104 32 87 64 91 95 70 126 78 158 56 190 68 221 43 253 48 284 30 316 39 348 19 380 27 420 9"/></svg></div><div class="mini-stats"><span>MARKET DEPTH<strong>Level II</strong></span><span>WATCHLIST<strong>12 symbols</strong></span><span>ACCOUNT<strong>Protected</strong></span></div></div>`,
  operations: `<div class="project-ui project-ui-ops"><div class="ops-rail"><span class="ops-monogram">N</span><i></i><i></i><i></i><i></i></div><div class="ops-main"><div class="mini-top"><span>Overview</span><small>MONDAY, 09:42 AM</small></div><div class="ops-summary"><div><small>ACTIVE CLIENTS</small><b>2,840</b><i>↑ 8.2%</i></div><div><small>OPEN REQUESTS</small><b>18</b><i class="neutral">Across 4 teams</i></div></div><div class="ops-graph"><div class="ops-bars"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div><div class="ops-rows"><span>Account review <i>In progress</i></span><span>Client onboarding <i>On track</i></span></div></div></div>`,
  analytics: `<div class="project-ui project-ui-paper"><div class="mini-top"><span>Paper portfolio</span><small>SIMULATED · NO REAL ORDERS</small></div><div class="paper-balance"><small>VIRTUAL BALANCE</small><b>₹10,48,250</b><span>+4.82% <i>this month</i></span></div><div class="paper-ring"><div><b>72</b><small>TRADES</small></div><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="43"/><circle class="paper-progress" cx="50" cy="50" r="43"/></svg></div><div class="paper-footer"><span><i></i> PROFITABLE 61%</span><span><i></i> LEARNING STREAK 8 DAYS</span></div></div>`
};

function renderProjects() {
  const rail = document.querySelector("#project-rail");
  if (!rail) return;
  rail.innerHTML = projects.map((project) => `
    <article class="project-card reveal">
      <div class="project-visual visual-${project.visual}">${projectMarkup[project.visual] ?? ""}<span class="project-index">${project.index}</span></div>
      <div class="project-meta"><span>${project.type}</span><span>${project.metric}</span></div>
      <h3>${project.title}</h3><p>${project.description}</p>
    </article>`).join("");
}

function renderTestimonials() {
  const grid = document.querySelector("#testimonial-grid");
  const emptyNote = document.querySelector(".testimonial-placeholder");
  if (!grid || !testimonials.length) return;
  emptyNote?.remove();
  grid.innerHTML = testimonials.map((item) => `
    <figure class="testimonial-card"><blockquote>“${escapeHTML(item.quote)}”</blockquote>
      <figcaption><b>${escapeHTML(item.name)}</b><span>${escapeHTML(item.role)}</span></figcaption></figure>`).join("");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function initNetwork() {
  const canvas = document.querySelector(".network-canvas");
  const context = canvas?.getContext("2d", { alpha: true });
  if (!canvas || !context) return;
  const hero = canvas.closest(".hero");
  const pointer = { x: -1000, y: -1000 };
  let width = 0;
  let height = 0;
  let frame = 0;
  let nodes = [];
  let active = true;
  const dpr = Math.min(window.devicePixelRatio || 1, calmMode ? 1 : 1.5);
  const strokes = [
    [{ x: 0.13, y: 0.78 }, { x: 0.13, y: 0.20 }],
    [{ x: 0.13, y: 0.20 }, { x: 0.53, y: 0.78 }],
    [{ x: 0.53, y: 0.78 }, { x: 0.53, y: 0.20 }]
  ];

  function resize() {
    const bounds = hero.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    const amount = width < 600 ? 78 : width < 1000 ? 118 : 170;
    nodes = Array.from({ length: amount }, (_, index) => {
      const stroke = strokes[index % strokes.length];
      const progress = Math.floor(index / strokes.length) / Math.ceil(amount / strokes.length);
      const targetX = (stroke[0].x + (stroke[1].x - stroke[0].x) * progress) * width;
      const targetY = (stroke[0].y + (stroke[1].y - stroke[0].y) * progress) * height;
      return { x: Math.random() * width, y: Math.random() * height, tx: targetX, ty: targetY, phase: Math.random() * 6.28, size: index % 9 === 0 ? 2.4 : 1.15 };
    });
  }

  function draw(time = 0) {
    if (!active) return;
    context.clearRect(0, 0, width, height);
    const assemble = calmMode ? 0.72 : Math.min(1, Math.max(0, (time - startedAt) / 1800));
    const eased = 1 - Math.pow(1 - assemble, 3);
    for (const node of nodes) {
      const drift = calmMode ? 0 : Math.sin(time * 0.00042 + node.phase) * 8;
      if (calmMode) { node.x = node.tx; node.y = node.ty; }
      else {
        node.x += (node.tx + drift - node.x) * (assemble > 0.97 ? 0.045 : 0.017);
        node.y += (node.ty + drift * 0.45 - node.y) * (assemble > 0.97 ? 0.045 : 0.017);
      }
      if (!calmMode) {
        const dx = node.x - pointer.x;
        const dy = node.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 150 && distance > 0) {
          const force = (150 - distance) / 150 * 0.22;
          node.x += dx / distance * force;
          node.y += dy / distance * force;
        }
      }
    }
    const lineDistance = width < 600 ? 72 : 106;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance < lineDistance) {
          const proximity = 1 - distance / lineDistance;
          context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y);
          context.strokeStyle = `rgba(242, 107, 42, ${proximity * (0.12 + eased * 0.18)})`;
          context.lineWidth = 0.55; context.stroke();
        }
      }
      context.beginPath(); context.arc(nodes[i].x, nodes[i].y, nodes[i].size, 0, Math.PI * 2);
      context.fillStyle = nodes[i].size > 2 ? "rgba(242,107,42,.94)" : `rgba(242,107,42,${0.26 + eased * 0.46})`;
      context.fill();
    }
    if (!calmMode) frame = requestAnimationFrame(draw);
  }
  let startedAt = 0;
  function begin(time) { startedAt = time; draw(time); }
  const observer = new IntersectionObserver(([entry]) => {
    active = entry.isIntersecting;
    if (active && !frame) frame = requestAnimationFrame((time) => { if (!startedAt) startedAt = time; draw(time); });
    if (!active) { cancelAnimationFrame(frame); frame = 0; }
  }, { threshold: 0 });
  observer.observe(hero);
  resize();
  frame = requestAnimationFrame(begin);
  window.addEventListener("resize", resize, { passive: true });
  if (!calmMode) hero.addEventListener("pointermove", (event) => { const rect = canvas.getBoundingClientRect(); pointer.x = event.clientX - rect.left; pointer.y = event.clientY - rect.top; }, { passive: true });
}

function initInteractions() {
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.querySelector(".mobile-menu");
  const header = document.querySelector(".site-header");
  const setMenu = (open) => {
    toggle?.setAttribute("aria-expanded", String(open));
    toggle?.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    menu?.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("menu-open", open);
  };
  toggle?.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  menu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") setMenu(false); });

  const updateHeader = () => header?.classList.toggle("header-scrolled", window.scrollY > 24);
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  document.querySelectorAll(".magnetic").forEach((element) => {
    if (calmMode) return;
    element.addEventListener("pointermove", (event) => {
      const rect = element.getBoundingClientRect();
      element.style.setProperty("--mag-x", `${(event.clientX - rect.left - rect.width / 2) * 0.11}px`);
      element.style.setProperty("--mag-y", `${(event.clientY - rect.top - rect.height / 2) * 0.15}px`);
    });
    element.addEventListener("pointerleave", () => { element.style.setProperty("--mag-x", "0px"); element.style.setProperty("--mag-y", "0px"); });
  });

  if (!calmMode) {
    const cursor = document.querySelector(".cursor-dot");
    window.addEventListener("pointermove", (event) => { cursor?.style.setProperty("--cursor-x", `${event.clientX}px`); cursor?.style.setProperty("--cursor-y", `${event.clientY}px`); }, { passive: true });
    document.querySelectorAll("a,button,input,textarea,select").forEach((element) => {
      element.addEventListener("pointerenter", () => cursor?.classList.add("cursor-active"));
      element.addEventListener("pointerleave", () => cursor?.classList.remove("cursor-active"));
    });
  }

  if (!calmMode) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--tilt-x", `${((event.clientY - rect.top) / rect.height - 0.5) * -4}deg`);
        card.style.setProperty("--tilt-y", `${((event.clientX - rect.left) / rect.width - 0.5) * 4}deg`);
      });
      card.addEventListener("pointerleave", () => { card.style.setProperty("--tilt-x", "0deg"); card.style.setProperty("--tilt-y", "0deg"); });
    });
  }

  const rail = document.querySelector("#project-rail");
  document.querySelector(".rail-next")?.addEventListener("click", () => rail?.scrollBy({ left: rail.clientWidth * 0.8, behavior: reducedMotion ? "instant" : "smooth" }));
  document.querySelector(".rail-prev")?.addEventListener("click", () => rail?.scrollBy({ left: -rail.clientWidth * 0.8, behavior: reducedMotion ? "instant" : "smooth" }));
  rail?.addEventListener("scroll", () => {
    const progress = rail.scrollWidth > rail.clientWidth ? rail.scrollLeft / (rail.scrollWidth - rail.clientWidth) : 0;
    document.querySelector(".rail-progress i")?.style.setProperty("transform", `scaleX(${Math.max(0.08, progress)})`);
  }, { passive: true });

  document.querySelectorAll(".quantity-control button").forEach((button) => button.addEventListener("click", () => {
    const input = button.parentElement.querySelector("input");
    input.value = Math.max(1, Number(input.value) + (button.textContent.trim() === "+" ? 1 : -1));
  }));
  document.querySelectorAll(".order-tab").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll(".order-tab").forEach((tab) => {
      const selected = tab === button;
      tab.classList.toggle("selected", selected);
      tab.setAttribute("aria-pressed", String(selected));
    });
    document.querySelector(".demo-order-button").classList.toggle("sell-selected", button.textContent.trim() === "Sell");
  }));
  document.querySelectorAll(".chart-action").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll(".chart-action").forEach((item) => {
      const selected = item === button;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
  }));
  document.querySelector(".watchlist .widget-heading button")?.addEventListener("click", (event) => {
    const button = event.currentTarget;
    const hidden = document.querySelector(".watchlist").classList.toggle("hide-daily-change");
    button.setAttribute("aria-pressed", String(hidden));
    button.setAttribute("aria-label", hidden ? "Show daily changes" : "Hide daily changes");
    button.title = hidden ? "Show daily changes" : "Hide daily changes";
  });
  document.querySelector(".chart-icon-btn")?.addEventListener("click", (event) => {
    const button = event.currentTarget;
    const expanded = document.querySelector(".trading-body").classList.toggle("chart-expanded");
    button.setAttribute("aria-pressed", String(expanded));
    button.setAttribute("aria-label", expanded ? "Collapse chart" : "Expand chart");
  });
  document.querySelector(".demo-order-button")?.addEventListener("click", () => {
    const button = document.querySelector(".demo-order-button");
    const original = button.innerHTML;
    button.textContent = "Demo only · No order placed";
    window.setTimeout(() => { button.innerHTML = original; }, 1900);
  });
}

function initChart() {
  const canvas = document.querySelector(".candlestick-chart");
  const context = canvas?.getContext("2d");
  if (!canvas || !context) return;
  let candles = [];
  let width = 0;
  let height = 0;
  let pulse = 0;
  function generateCandles() {
    let price = 70;
    candles = Array.from({ length: 50 }, (_, index) => {
      const open = price;
      const change = Math.sin(index * 1.9) * 4.4 + Math.cos(index * 0.7) * 3 + (Math.random() - 0.42) * 4;
      const close = open + change;
      const wick = 2 + Math.random() * 5;
      price = close;
      return { open, close, high: Math.max(open, close) + wick, low: Math.min(open, close) - wick };
    });
  }
  function draw() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    if (!rect.width || !rect.height) return;
    if (width !== rect.width || height !== rect.height) {
      width = rect.width; height = rect.height; canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio); context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    context.clearRect(0, 0, width, height);
    const max = Math.max(...candles.map((item) => item.high)) + 5;
    const min = Math.min(...candles.map((item) => item.low)) - 5;
    const y = (price) => 8 + (max - price) / (max - min) * (height - 18);
    context.strokeStyle = "rgba(138,151,173,.11)"; context.lineWidth = 1;
    for (let line = 0; line < 4; line++) { const lineY = 12 + line * (height - 20) / 3; context.beginPath(); context.moveTo(0, lineY); context.lineTo(width, lineY); context.stroke(); }
    const cell = width / candles.length;
    candles.forEach((item, index) => {
      const x = index * cell + cell * 0.5;
      const up = item.close >= item.open;
      context.strokeStyle = up ? "#71BD9A" : "#D3766B";
      context.lineWidth = Math.max(1, cell * 0.17); context.beginPath(); context.moveTo(x, y(item.high)); context.lineTo(x, y(item.low)); context.stroke();
      const top = Math.min(y(item.open), y(item.close));
      const candleHeight = Math.max(2, Math.abs(y(item.open) - y(item.close)));
      context.fillStyle = up ? "#71BD9A" : "#D3766B";
      context.fillRect(x - Math.max(1.1, cell * 0.29), top, Math.max(2, cell * 0.58), candleHeight);
    });
    pulse += 0.02;
    const last = candles.at(-1);
    const lastY = y(last.close);
    context.setLineDash([3, 4]); context.strokeStyle = "rgba(242,107,42,.5)"; context.beginPath(); context.moveTo(0, lastY); context.lineTo(width, lastY); context.stroke(); context.setLineDash([]);
    if (!calmMode) requestAnimationFrame(draw);
  }
  generateCandles();
  if (calmMode) draw(); else requestAnimationFrame(draw);
  window.addEventListener("resize", () => { width = 0; if (calmMode) draw(); }, { passive: true });
}

function initMotion() {
  if (reducedMotion) {
    document.body.classList.add("motion-reduced");
    document.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));
    document.querySelector(".preloader")?.classList.add("preloader-done");
    return;
  }
  if (window.gsap && window.ScrollTrigger) window.gsap.registerPlugin(window.ScrollTrigger);
  const revealItems = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((element) => observer.observe(element));
  const heroWords = document.querySelectorAll(".hero-title .hero-word");
  if (window.gsap) window.gsap.fromTo(heroWords, { y: 28, opacity: 0, rotateX: -18 }, { y: 0, opacity: 1, rotateX: 0, duration: 0.8, stagger: 0.085, delay: 0.35, ease: "power3.out" });
  const counter = document.querySelector("[data-counter]");
  if (counter && window.gsap) window.gsap.fromTo(counter, { innerText: 0 }, { innerText: Number(counter.dataset.counter), duration: 1.1, delay: 0.3, snap: { innerText: 1 }, ease: "power2.out", scrollTrigger: { trigger: counter, start: "top 88%", once: true }, onUpdate: () => { counter.textContent = String(Math.round(Number(counter.textContent))).padStart(2, "0"); } });
  const preloader = document.querySelector(".preloader");
  window.addEventListener("load", () => window.setTimeout(() => preloader?.classList.add("preloader-done"), 1500), { once: true });
  window.setTimeout(() => preloader?.classList.add("preloader-done"), 1800);

  if (!calmMode && window.gsap && window.ScrollTrigger) {
    window.gsap.utils.toArray(".section-pad").forEach((section) => window.gsap.to(section.querySelector(".section-kicker"), {
      y: -8, opacity: 0.68, ease: "none", scrollTrigger: { trigger: section, start: "top bottom", end: "top top", scrub: true }
    }));
  }
  if (!calmMode && window.Lenis && window.gsap) {
    const lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.85 });
    lenis.on("scroll", () => window.ScrollTrigger?.update());
    window.gsap.ticker.add((time) => lenis.raf(time * 1000));
    window.gsap.ticker.lagSmoothing(0);
  }
}

function initEnquiryForm() {
  const form = document.querySelector("#enquiry-form");
  const status = form?.querySelector(".form-status");
  if (!form || !status) return;
  const storageKey = "nts-enquiry-last-submit";
  const showStatus = (message, type) => { status.textContent = message; status.dataset.state = type; };
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (form.elements.website.value) { showStatus("Thanks. Your enquiry has been received.", "success"); form.reset(); return; }
    const lastSubmit = Number(localStorage.getItem(storageKey) || 0);
    const remaining = 30000 - (Date.now() - lastSubmit);
    if (remaining > 0) { showStatus(`Please wait ${Math.ceil(remaining / 1000)} seconds before sending another enquiry.`, "error"); return; }
    const submitButton = form.querySelector(".form-submit");
    const originalLabel = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.querySelector("span:first-child").textContent = "Sending...";
    showStatus("", "");
    const values = new FormData(form);
    const enquiry = {
      name: String(values.get("name") || "").trim(), email: String(values.get("email") || "").trim(),
      phone: String(values.get("phone") || "").trim(), company: String(values.get("company") || "").trim(),
      service: String(values.get("service") || "").trim(), message: String(values.get("message") || "").trim()
    };
    try {
      const { db, collection, addDoc, serverTimestamp } = await getEnquiryFirebase();
      await addDoc(collection(db, "enquiries"), { ...enquiry, createdAt: serverTimestamp(), status: "new" });
      localStorage.setItem(storageKey, String(Date.now()));
      form.reset();
      showStatus("Thank you. Your enquiry is on its way. We'll be in touch soon.", "success");
    } catch (error) {
      if (error.message !== "not-configured") console.error("Enquiry submission failed:", error);
      showStatus(error.message === "not-configured" ? "The enquiry form is being set up. Please try again shortly." : "We couldn't send that just now. Please try again shortly.", "error");
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = originalLabel;
    }
  });
}

renderProjects();
renderTestimonials();
initNetwork();
initChart();
initInteractions();
initMotion();
initEnquiryForm();
document.querySelector("#current-year").textContent = new Date().getFullYear();

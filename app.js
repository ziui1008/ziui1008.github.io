"use strict";

const root = document.documentElement;
const body = document.body;

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const isCoarsePointer = window.matchMedia("(pointer: coarse)");
const LOGO_COLORS = ["#FFD93D", "#FFB3D9", "#B3E0FF", "#B3FFD9"];

function easeOutBack(value) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(value - 1, 3) + c1 * Math.pow(value - 1, 2);
}

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function setupCanvas(canvas) {
  if (!canvas) return null;
  const size = Math.max(1, Math.round(canvas.clientWidth || canvas.parentElement?.clientWidth || canvas.width || 1));
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const pixels = Math.round(size * ratio);

  if (canvas.width !== pixels || canvas.height !== pixels) {
    canvas.width = pixels;
    canvas.height = pixels;
  }

  const context = canvas.getContext("2d");
  if (!context) return null;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { context, size };
}

function logoTriangles(size) {
  const cx = size / 2;
  const cy = size / 2;
  const longSide = size * 0.3;
  const shortSide = size * 0.2;
  const gap = size * 0.01875;

  return [
    { color: LOGO_COLORS[0], points: [[cx - gap, cy - gap - longSide], [cx - gap, cy - gap], [cx - gap - shortSide, cy - gap]], origin: [-size * 0.22, -size * 0.28], rotation: -0.35 },
    { color: LOGO_COLORS[1], points: [[cx + gap + longSide, cy - gap], [cx + gap, cy - gap], [cx + gap, cy - gap - shortSide]], origin: [size * 0.28, -size * 0.2], rotation: 0.34 },
    { color: LOGO_COLORS[2], points: [[cx - gap - longSide, cy + gap], [cx - gap, cy + gap], [cx - gap, cy + gap + shortSide]], origin: [-size * 0.3, size * 0.2], rotation: 0.28 },
    { color: LOGO_COLORS[3], points: [[cx + gap, cy + gap + longSide], [cx + gap, cy + gap], [cx + gap + shortSide, cy + gap]], origin: [size * 0.22, size * 0.3], rotation: -0.3 }
  ];
}

function drawLogo(canvas, progress = 1, setup = setupCanvas(canvas)) {
  if (!setup) return;
  const { context, size } = setup;
  context.clearRect(0, 0, size, size);

  logoTriangles(size).forEach((triangle, index) => {
    const localProgress = clamp((progress * 1.55) - (index * 0.17));
    if (localProgress <= 0) return;
    const eased = easeOutBack(localProgress);
    const offsetX = triangle.origin[0] * (1 - eased);
    const offsetY = triangle.origin[1] * (1 - eased);
    const rotation = triangle.rotation * (1 - eased);

    context.save();
    context.translate(size / 2 + offsetX, size / 2 + offsetY);
    context.rotate(rotation);
    context.translate(-size / 2, -size / 2);
    context.beginPath();
    context.moveTo(triangle.points[0][0], triangle.points[0][1]);
    context.lineTo(triangle.points[1][0], triangle.points[1][1]);
    context.lineTo(triangle.points[2][0], triangle.points[2][1]);
    context.closePath();
    context.fillStyle = triangle.color;
    context.fill();
    context.lineJoin = "round";
    context.lineCap = "round";
    context.lineWidth = Math.max(2, size * 0.015);
    context.strokeStyle = "#1a1a1a";
    context.stroke();
    context.restore();
  });
}

const logoCanvases = Array.from(document.querySelectorAll("canvas[data-logo]"));

function renderStaticLogos() {
  logoCanvases.filter((canvas) => canvas.dataset.logo === "static").forEach((canvas) => drawLogo(canvas, 1));
}

function watchLogoLayout() {
  if (!("ResizeObserver" in window)) return;
  const observer = new ResizeObserver(() => renderStaticLogos());
  logoCanvases.forEach((canvas) => observer.observe(canvas.parentElement || canvas));
}

// Native dialogs keep keyboard focus out of the obscured page.
function runIntro() {
  const splash = document.getElementById("splash");
  const canvas = splash.querySelector("canvas");
  const progressBar = document.getElementById("splashProgress");
  let seen = false;
  try { seen = sessionStorage.getItem("ziui-intro-seen") === "1"; } catch {}
  if (seen || prefersReducedMotion.matches || typeof splash.showModal !== "function") {
    setupReveals();
    return;
  }

  let frameId = 0;
  let startedAt;
  let finished = false;
  let watchdog;
  function finish() {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(frameId);
    clearTimeout(watchdog);
    prefersReducedMotion.removeEventListener("change", finish);
    if (splash.open) splash.close();
    splash.hidden = true;
    body.classList.remove("intro-active");
    try { sessionStorage.setItem("ziui-intro-seen", "1"); } catch {}
    setupReveals();
  }

  // A bounded timeout also recovers if the rendering loop is interrupted.
  watchdog = setTimeout(finish, 3200);
  try {
    splash.hidden = false;
    splash.showModal();
    body.classList.add("intro-active");
    const surface = setupCanvas(canvas);
    function animate(timestamp) {
      if (startedAt === undefined) startedAt = timestamp;
      const progress = clamp((timestamp - startedAt) / 1800);
      drawLogo(canvas, clamp(progress / 0.78), surface);
      progressBar.style.transform = "scaleX(" + progress + ")";
      if (progress >= 1) finish();
      else frameId = requestAnimationFrame(animate);
    }
    document.getElementById("skipIntro").addEventListener("click", finish, { once: true });
    splash.addEventListener("cancel", (event) => { event.preventDefault(); finish(); });
    prefersReducedMotion.addEventListener("change", finish);
    frameId = requestAnimationFrame(animate);
  } catch (error) {
    finish();
    console.warn("Intro unavailable; page remains usable.", error);
  }
}

function setupReveals() {
  if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) return;
  const elements = [...document.querySelectorAll(".reveal")];
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.remove("reveal-pending");
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.05 });
  elements.forEach((element) => {
    // Content in the initial viewport never depends on the observer to be visible.
    if (element.getBoundingClientRect().top < window.innerHeight) {
      element.classList.add("is-visible");
      return;
    }
    element.classList.add("reveal-pending");
    element.addEventListener("focusin", () => element.classList.remove("reveal-pending"));
    observer.observe(element);
  });
  prefersReducedMotion.addEventListener("change", () => {
    if (!prefersReducedMotion.matches) return;
    elements.forEach((element) => element.classList.remove("reveal-pending"));
    observer.disconnect();
  });
}

function setupTheme() {
  const toggle = document.getElementById("themeToggle");
  const meta = document.getElementById("themeColorMeta");
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  let chosen;
  try { chosen = localStorage.getItem("ziui-theme"); } catch {}
  if (!["light", "dark"].includes(chosen)) chosen = null;

  function apply(theme) {
    root.dataset.theme = theme;
    toggle.setAttribute("aria-label", theme === "dark" ? "切换到浅色主题" : "切换到深色主题");
    toggle.title = toggle.getAttribute("aria-label");
    meta.content = theme === "dark" ? "#101114" : "#f5f5f7";
  }
  apply(chosen || (systemTheme.matches ? "dark" : "light"));
  toggle.hidden = false;
  toggle.addEventListener("click", () => {
    chosen = root.dataset.theme === "dark" ? "light" : "dark";
    apply(chosen);
    try { localStorage.setItem("ziui-theme", chosen); } catch {}
  });
  systemTheme.addEventListener("change", () => {
    if (!chosen) apply(systemTheme.matches ? "dark" : "light");
  });
}

function setupCommandPalette() {
  const dialog = document.getElementById("commandPalette");
  if (typeof dialog.showModal !== "function") return;
  const input = document.getElementById("commandInput");
  const links = [...dialog.querySelectorAll("[data-search]")];
  const empty = document.getElementById("noResults");
  const count = document.getElementById("resultCount");
  const buttons = [document.getElementById("openSearch"), document.getElementById("toolSearch")];
  let previousFocus;

  function filter() {
    const terms = input.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    links.forEach((link) => {
      const haystack = (link.dataset.search + " " + link.textContent).toLocaleLowerCase();
      link.hidden = !terms.every((term) => haystack.includes(term));
    });
    const total = links.filter((link) => !link.hidden).length;
    count.textContent = total + " 个应用入口";
    empty.hidden = total !== 0;
  }
  function open() {
    if (dialog.open || document.getElementById("splash").open) return;
    previousFocus = document.activeElement;
    input.value = "";
    filter();
    dialog.showModal();
    body.classList.add("palette-open");
    input.focus({ preventScroll: true });
  }
  buttons.forEach((button) => {
    button.addEventListener("click", open);
    button.hidden = false;
  });
  dialog.querySelector(".command-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    body.classList.remove("palette-open");
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  });
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  input.addEventListener("input", filter);
  input.addEventListener("keydown", (event) => {
    if (event.isComposing) return;
    const visible = links.filter((link) => !link.hidden);
    if (event.key === "Enter") {
      event.preventDefault();
      visible[0]?.click();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      (event.key === "ArrowDown" ? visible[0] : visible.at(-1))?.focus();
    }
  });
  links.forEach((link) => link.addEventListener("keydown", (event) => {
    if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    const visible = links.filter((item) => !item.hidden);
    const next = visible.indexOf(link) + (event.key === "ArrowDown" ? 1 : -1);
    if (next < 0 || next === visible.length) input.focus();
    else visible[next].focus();
  }));
  document.addEventListener("keydown", (event) => {
    if (event.isComposing || !(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") return;
    event.preventDefault();
    if (dialog.open) dialog.close(); else open();
  });
}

function setupDetails() {
  const details = document.querySelector("details.launch-item");
  document.addEventListener("click", (event) => {
    if (details.open && !details.contains(event.target)) details.open = false;
  });
  details.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !details.open) return;
    details.open = false;
    details.querySelector("summary").focus();
  });
}

function setupMobileMenu() {
  const toggle = document.getElementById("mobileMenuToggle");
  const nav = document.getElementById("mobileNav");
  const header = document.getElementById("siteHeader");
  const mobile = matchMedia("(max-width: 820px)");
  function setOpen(open) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "关闭导航菜单" : "打开导航菜单");
    toggle.title = toggle.getAttribute("aria-label");
    nav.classList.toggle("is-open", open);
    header.classList.toggle("menu-open", open);
  }
  toggle.hidden = false;
  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    setOpen(false);
    document.querySelector(link.getAttribute("href"))?.focus({ preventScroll: true });
  }));
  document.addEventListener("click", (event) => {
    if (!nav.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || toggle.getAttribute("aria-expanded") !== "true") return;
    setOpen(false);
    toggle.focus();
  });
  mobile.addEventListener("change", () => {
    if (!mobile.matches) {
      const hadFocus = nav.contains(document.activeElement) || document.activeElement === toggle;
      setOpen(false);
      if (hadFocus) header.querySelector(".brand").focus();
    }
  });
}

function setupCoreTilt() {
  const stage = document.getElementById("coreStage");
  function reset() {
    stage.style.setProperty("--tilt-x", "0deg");
    stage.style.setProperty("--tilt-y", "0deg");
  }
  stage.addEventListener("pointermove", (event) => {
    if (prefersReducedMotion.matches || isCoarsePointer.matches) return;
    const bounds = stage.getBoundingClientRect();
    stage.style.setProperty("--tilt-x", ((event.clientY - bounds.top) / bounds.height - 0.5) * -10 + "deg");
    stage.style.setProperty("--tilt-y", ((event.clientX - bounds.left) / bounds.width - 0.5) * 10 + "deg");
  }, { passive: true });
  stage.addEventListener("pointerleave", reset);
  prefersReducedMotion.addEventListener("change", reset);
  isCoarsePointer.addEventListener("change", reset);
}

class ParticleField {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    if (!this.context) return;
    this.frameId = 0;
    this.lastTime = 0;
    this.visible = true;
    this.pointer = { x: -1000, y: -1000 };
    this.animate = this.animate.bind(this);
    this.resize();
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => this.resize(), 120);
    }, { passive: true });
    const home = document.getElementById("home");
    home.addEventListener("pointermove", (event) => {
      if (isCoarsePointer.matches || prefersReducedMotion.matches) return;
      this.pointer = { x: event.clientX, y: event.clientY };
    }, { passive: true });
    home.addEventListener("pointerleave", () => { this.pointer = { x: -1000, y: -1000 }; });
    document.addEventListener("visibilitychange", () => this.sync());
    prefersReducedMotion.addEventListener("change", () => this.sync());
    if ("IntersectionObserver" in window) {
      this.observer = new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting;
        this.sync();
      });
      this.observer.observe(home);
    }
    this.sync();
  }

  sync() {
    cancelAnimationFrame(this.frameId);
    this.frameId = 0;
    this.lastTime = 0;
    if (this.visible && !document.hidden && !prefersReducedMotion.matches) {
      this.frameId = requestAnimationFrame(this.animate);
    } else {
      this.draw();
    }
  }

  resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.round(this.width * ratio);
    this.canvas.height = Math.round(this.height * ratio);
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.particles = Array.from({ length: this.width < 700 ? 12 : 22 }, (_, index) => ({
      x: Math.random() * this.width, y: Math.random() * this.height,
      vx: (Math.random() - 0.5) * 0.18, vy: (Math.random() - 0.5) * 0.18,
      radius: 1 + Math.random(), color: LOGO_COLORS[index % 4]
    }));
    this.draw();
  }

  update(delta) {
    this.particles.forEach((particle) => {
      const dx = particle.x - this.pointer.x;
      const dy = particle.y - this.pointer.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 0 && distance < 105) {
        const force = (1 - distance / 105) * 0.025 * delta;
        particle.vx = clamp(particle.vx + dx / distance * force, -0.45, 0.45);
        particle.vy = clamp(particle.vy + dy / distance * force, -0.45, 0.45);
      }
      particle.x = (particle.x + particle.vx * delta + this.width) % this.width;
      particle.y = (particle.y + particle.vy * delta + this.height) % this.height;
    });
  }

  draw() {
    const ctx = this.context;
    ctx.clearRect(0, 0, this.width, this.height);
    this.particles.forEach((particle, index) => {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = 0.65;
      ctx.fill();
      this.particles.slice(index + 1).forEach((other) => {
        const distance = Math.hypot(particle.x - other.x, particle.y - other.y);
        if (distance > 112) return;
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(other.x, other.y);
        ctx.strokeStyle = particle.color;
        ctx.globalAlpha = (1 - distance / 112) * 0.16;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      });
    });
    ctx.globalAlpha = 1;
  }

  animate(timestamp) {
    const delta = this.lastTime ? Math.min((timestamp - this.lastTime) / 16.67, 2) : 1;
    this.lastTime = timestamp;
    this.update(delta);
    this.draw();
    this.frameId = requestAnimationFrame(this.animate);
  }
}

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(renderStaticLogos, 120);
}, { passive: true });

document.getElementById("currentYear").textContent = new Date().getFullYear();
// Optional enhancements fail independently; the underlying links always remain.
[setupTheme, renderStaticLogos, setupCommandPalette, setupDetails, setupMobileMenu, setupCoreTilt,
  () => new ParticleField(document.getElementById("particleField"))
].forEach((enhance) => {
  try { enhance(); } catch (error) { console.error("Enhancement unavailable:", error); }
});
body.classList.remove("no-js");
watchLogoLayout();
runIntro();

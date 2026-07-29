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
  const size = Math.max(1, Math.round(canvas.getBoundingClientRect().width));
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const pixels = Math.round(size * ratio);

  if (canvas.width !== pixels || canvas.height !== pixels) {
    canvas.width = pixels;
    canvas.height = pixels;
  }

  const context = canvas.getContext("2d");
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
    {
      color: LOGO_COLORS[0],
      points: [[cx - gap, cy - gap - longSide], [cx - gap, cy - gap], [cx - gap - shortSide, cy - gap]],
      origin: [-size * 0.22, -size * 0.28],
      rotation: -0.35
    },
    {
      color: LOGO_COLORS[1],
      points: [[cx + gap + longSide, cy - gap], [cx + gap, cy - gap], [cx + gap, cy - gap - shortSide]],
      origin: [size * 0.28, -size * 0.2],
      rotation: 0.34
    },
    {
      color: LOGO_COLORS[2],
      points: [[cx - gap - longSide, cy + gap], [cx - gap, cy + gap], [cx - gap, cy + gap + shortSide]],
      origin: [-size * 0.3, size * 0.2],
      rotation: 0.28
    },
    {
      color: LOGO_COLORS[3],
      points: [[cx + gap, cy + gap + longSide], [cx + gap, cy + gap], [cx + gap + shortSide, cy + gap]],
      origin: [size * 0.22, size * 0.3],
      rotation: -0.3
    }
  ];
}

function drawLogo(canvas, progress = 1) {
  const { context, size } = setupCanvas(canvas);
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
  logoCanvases
    .filter((canvas) => canvas.dataset.logo === "static")
    .forEach((canvas) => drawLogo(canvas, 1));
}

function runIntro() {
  const splash = document.getElementById("splash");
  const introCanvas = document.querySelector('canvas[data-logo="intro"]');
  const progressBar = document.getElementById("splashProgress");
  const status = document.getElementById("splashStatus");
  const skip = document.getElementById("skipIntro");
  const duration = prefersReducedMotion.matches ? 500 : 2500;
  let startedAt = 0;
  let finished = false;
  let frameId = 0;

  body.classList.add("intro-active");

  function finishIntro() {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(frameId);
    drawLogo(introCanvas, 1);
    progressBar.style.width = "100%";
    status.textContent = "SYSTEM READY";
    window.setTimeout(() => {
      splash.classList.add("is-complete");
      body.classList.remove("intro-active");
      revealInitialContent();
    }, prefersReducedMotion.matches ? 40 : 340);
  }

  function animate(timestamp) {
    if (!startedAt) startedAt = timestamp;
    const progress = clamp((timestamp - startedAt) / duration);
    const logoProgress = clamp(progress / 0.72);
    drawLogo(introCanvas, logoProgress);
    progressBar.style.width = `${Math.round(progress * 100)}%`;

    if (progress > 0.76) status.textContent = "CONNECTING LIVE BUILDS";
    if (progress > 0.9) status.textContent = "SYSTEM READY";

    if (progress < 1) {
      frameId = requestAnimationFrame(animate);
    } else {
      finishIntro();
    }
  }

  skip.addEventListener("click", finishIntro, { once: true });
  frameId = requestAnimationFrame(animate);
}

let revealObserver;

function setupReveals() {
  const revealElements = document.querySelectorAll(".reveal");

  if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -7%" });

  revealElements.forEach((element) => revealObserver.observe(element));
}

function revealInitialContent() {
  document.querySelectorAll(".launchpad .reveal").forEach((element, index) => {
    window.setTimeout(() => element.classList.add("is-visible"), index * 85);
  });
}

function setupTheme() {
  const toggle = document.getElementById("themeToggle");
  const storedTheme = localStorage.getItem("ziui-theme");
  const initialTheme = storedTheme || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");

  root.dataset.theme = initialTheme;

  toggle.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = nextTheme;
    localStorage.setItem("ziui-theme", nextTheme);
  });
}

function setupCommandPalette() {
  const dialog = document.getElementById("commandPalette");
  const input = document.getElementById("commandInput");
  const openButtons = [document.getElementById("openSearch"), document.getElementById("toolSearch")];
  const links = Array.from(dialog.querySelectorAll("[data-search]"));
  const noResults = document.getElementById("noResults");

  function openPalette() {
    if (!dialog.open) dialog.showModal();
    input.value = "";
    links.forEach((link) => { link.hidden = false; });
    noResults.hidden = true;
    window.setTimeout(() => input.focus(), 20);
  }

  openButtons.forEach((button) => button.addEventListener("click", openPalette));

  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openPalette();
    }
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    let visibleCount = 0;

    links.forEach((link) => {
      const matched = link.dataset.search.toLowerCase().includes(query);
      link.hidden = !matched;
      if (matched) visibleCount += 1;
    });

    noResults.hidden = visibleCount !== 0;
  });
}

function setupDetails() {
  const detailsElements = Array.from(document.querySelectorAll("details.launch-item"));

  document.addEventListener("click", (event) => {
    detailsElements.forEach((details) => {
      if (details.open && !details.contains(event.target)) details.removeAttribute("open");
    });
  });
}

function setupCoreTilt() {
  const stage = document.getElementById("coreStage");
  const shell = stage.querySelector(".core-logo-shell");
  const back = stage.querySelector(".core-plane-back");
  const mid = stage.querySelector(".core-plane-mid");

  if (prefersReducedMotion.matches || isCoarsePointer.matches) return;

  stage.addEventListener("pointermove", (event) => {
    const bounds = stage.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    shell.style.transform = `translateZ(42px) rotateX(${-y * 9}deg) rotateY(${x * 9}deg)`;
    mid.style.transform = `translateZ(-5px) rotate(${(-4 + x * 3)}deg) translate(${x * -5}px, ${y * -5}px)`;
    back.style.transform = `translateZ(-36px) rotate(${(7 + x * 4)}deg) translate(${x * -9}px, ${y * -9}px)`;
  });

  stage.addEventListener("pointerleave", () => {
    shell.style.transform = "translateZ(42px)";
    mid.style.transform = "translateZ(-5px) rotate(-4deg)";
    back.style.transform = "translateZ(-36px) rotate(7deg)";
  });
}

function setupCursor() {
  const cursor = document.getElementById("cursorGlow");
  if (isCoarsePointer.matches || prefersReducedMotion.matches) return;

  document.addEventListener("pointermove", (event) => {
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
    cursor.style.opacity = "1";
  });

  document.addEventListener("pointerout", (event) => {
    if (!event.relatedTarget) cursor.style.opacity = "0";
  });

  document.querySelectorAll("a, button, summary").forEach((element) => {
    element.addEventListener("pointerenter", () => {
      cursor.style.width = "30px";
      cursor.style.height = "30px";
    });
    element.addEventListener("pointerleave", () => {
      cursor.style.width = "18px";
      cursor.style.height = "18px";
    });
  });
}

class ParticleField {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.particles = [];
    this.pointer = { x: -1000, y: -1000 };
    this.frameId = 0;
    this.resize = this.resize.bind(this);
    this.animate = this.animate.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.resize();
    window.addEventListener("resize", this.resize);
    window.addEventListener("pointermove", this.onPointerMove, { passive: true });
    if (!prefersReducedMotion.matches) this.frameId = requestAnimationFrame(this.animate);
    else this.draw();
  }

  resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.round(this.width * ratio);
    this.canvas.height = Math.round(this.height * ratio);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const density = this.width < 700 ? 14 : 26;
    this.particles = Array.from({ length: density }, (_, index) => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      radius: 0.8 + Math.random() * 1.2,
      color: LOGO_COLORS[index % LOGO_COLORS.length]
    }));
    this.draw();
  }

  onPointerMove(event) {
    this.pointer.x = event.clientX;
    this.pointer.y = event.clientY;
  }

  update() {
    this.particles.forEach((particle) => {
      const dx = particle.x - this.pointer.x;
      const dy = particle.y - this.pointer.y;
      const distanceSquared = dx * dx + dy * dy;

      if (distanceSquared < 11000 && distanceSquared > 0) {
        const force = (11000 - distanceSquared) / 11000;
        const distance = Math.sqrt(distanceSquared);
        particle.vx += (dx / distance) * force * 0.025;
        particle.vy += (dy / distance) * force * 0.025;
      }

      particle.vx *= 0.995;
      particle.vy *= 0.995;
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < -10) particle.x = this.width + 10;
      if (particle.x > this.width + 10) particle.x = -10;
      if (particle.y < -10) particle.y = this.height + 10;
      if (particle.y > this.height + 10) particle.y = -10;
    });
  }

  draw() {
    const context = this.context;
    context.clearRect(0, 0, this.width, this.height);

    this.particles.forEach((particle, index) => {
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fillStyle = particle.color;
      context.globalAlpha = 0.5;
      context.fill();

      for (let linkIndex = index + 1; linkIndex < this.particles.length; linkIndex += 1) {
        const target = this.particles[linkIndex];
        const dx = particle.x - target.x;
        const dy = particle.y - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 112) continue;

        context.beginPath();
        context.moveTo(particle.x, particle.y);
        context.lineTo(target.x, target.y);
        context.strokeStyle = particle.color;
        context.globalAlpha = (1 - distance / 112) * 0.09;
        context.lineWidth = 0.6;
        context.stroke();
      }
    });

    context.globalAlpha = 1;
  }

  animate() {
    this.update();
    this.draw();
    this.frameId = requestAnimationFrame(this.animate);
  }
}

let resizeTimer;
window.addEventListener("resize", () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(renderStaticLogos, 120);
});

document.getElementById("currentYear").textContent = new Date().getFullYear();
setupTheme();
renderStaticLogos();
setupReveals();
setupCommandPalette();
setupDetails();
setupCoreTilt();
setupCursor();
new ParticleField(document.getElementById("particleField"));
runIntro();

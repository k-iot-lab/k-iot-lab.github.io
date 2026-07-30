(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- mobile nav ---------- */
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
    mainNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- scroll reveal ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add("is-visible"), i * 60);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- contact form (static demo) ---------- */
  const form = document.getElementById("contactForm");
  const note = document.getElementById("formNote");
  if (form && note) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      note.textContent = "상담 요청이 접수되었습니다. 담당자가 확인 후 회신드리겠습니다.";
      form.reset();
    });
  }

  /* ---------- radar hero canvas ---------- */
  const canvas = document.getElementById("radar");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let w, h, cx, cy, radius, dpr;
  let blips = [];

  const palette = () => {
    const styles = getComputedStyle(document.documentElement);
    return {
      green: styles.getPropertyValue("--signal-green").trim() || "#4ADE9C",
      amber: styles.getPropertyValue("--amber").trim() || "#E8A33D",
      line: styles.getPropertyValue("--line").trim() || "rgba(255,255,255,0.1)",
    };
  };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = w * 0.78;
    cy = h * 0.42;
    radius = Math.min(w, h) * 0.42;
    seedBlips();
  }

  function seedBlips() {
    blips = [];
    const count = 10;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 0.15 + Math.random() * 0.85;
      blips.push({
        angle,
        dist,
        triggered: 0,
        opacity: 0,
      });
    }
  }

  function drawStatic() {
    const c = palette();
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = c.line;
    ctx.lineWidth = 1;
    [0.25, 0.5, 0.75, 1].forEach((f) => {
      ctx.beginPath();
      ctx.arc(cx, cy, radius * f, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.moveTo(cx - radius, cy);
    ctx.lineTo(cx + radius, cy);
    ctx.moveTo(cx, cy - radius);
    ctx.lineTo(cx, cy + radius);
    ctx.stroke();
  }

  let sweepAngle = 0;
  function drawFrame() {
    const c = palette();
    ctx.clearRect(0, 0, w, h);

    // concentric rings
    ctx.strokeStyle = c.line;
    ctx.lineWidth = 1;
    [0.25, 0.5, 0.75, 1].forEach((f) => {
      ctx.beginPath();
      ctx.arc(cx, cy, radius * f, 0, Math.PI * 2);
      ctx.stroke();
    });
    // crosshair
    ctx.beginPath();
    ctx.moveTo(cx - radius, cy);
    ctx.lineTo(cx + radius, cy);
    ctx.moveTo(cx, cy - radius);
    ctx.lineTo(cx, cy + radius);
    ctx.stroke();

    // sweep gradient
    const grad = ctx.createConicGradient
      ? ctx.createConicGradient(sweepAngle - Math.PI / 2, cx, cy)
      : null;
    if (grad) {
      grad.addColorStop(0, "transparent");
      grad.addColorStop(0.85, "transparent");
      grad.addColorStop(0.97, c.green + "33");
      grad.addColorStop(1, "transparent");
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = grad;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      ctx.restore();
    }

    // sweep line
    ctx.strokeStyle = c.green;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(sweepAngle) * radius, cy + Math.sin(sweepAngle) * radius);
    ctx.stroke();

    // blips: trigger when swept over, fade out
    blips.forEach((b) => {
      const bx = cx + Math.cos(b.angle) * radius * b.dist;
      const by = cy + Math.sin(b.angle) * radius * b.dist;
      let diff = Math.abs(((sweepAngle - b.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      if (diff < 0.08) b.opacity = 1;
      else b.opacity *= 0.965;

      if (b.opacity > 0.01) {
        ctx.beginPath();
        ctx.fillStyle = c.amber;
        ctx.globalAlpha = b.opacity;
        ctx.arc(bx, by, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    });

    sweepAngle += 0.012;
    if (sweepAngle > Math.PI * 2) sweepAngle -= Math.PI * 2;

    requestAnimationFrame(drawFrame);
  }

  resize();
  window.addEventListener("resize", resize);

  if (reduceMotion) {
    drawStatic();
  } else {
    requestAnimationFrame(drawFrame);
  }

  // repaint static rings if theme changes while reduced-motion is on
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener?.("change", () => {
      if (reduceMotion) drawStatic();
    });
})();

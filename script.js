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

  /* ---------- contact form ----------
     접수 서버가 아직 없어 입력 내용으로 메일 앱을 연다(실제로 보낸 것처럼 안내하지 않는다) */
  const form = document.getElementById("contactForm");
  const note = document.getElementById("formNote");
  // 영문판(en/, 2026-10-15)은 메일 제목·본문·안내도 영어로
  const T = document.documentElement.lang === "en"
    ? { subject: "GITEUL Consultation", name: "Name", org: "Organization / Company", email: "Email", field: "Site under consideration",
        sent: "Press Send in your email app to deliver the request." }
    : { subject: "GITEUL 도입 상담", name: "이름", org: "기관 / 회사", email: "이메일", field: "검토 중인 현장",
        sent: "메일 앱에서 보내기를 눌러야 상담 요청이 전달됩니다." };
  if (form && note) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = new FormData(form);
      const subject = `[${T.subject}] ${d.get("org")} · ${d.get("name")}`;
      const body = [
        `${T.name}: ${d.get("name")}`,
        `${T.org}: ${d.get("org")}`,
        `${T.email}: ${d.get("email")}`,
        `${T.field}: ${d.get("field")}`,
        "",
        String(d.get("message") || ""),
      ].join("\n");
      window.location.href = `mailto:${form.dataset.mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      note.textContent = T.sent;
    });
  }

  /* ---------- radar hero canvas ---------- */
  const canvas = document.getElementById("radar");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let w, h, cx, cy, radius, dpr;
  let blips = [];

  const palette = () => {
    // 색은 캔버스에 둔 --radar-* (style.css .radar-canvas). 첫 화면은 어두운 사진 위라 밝은 선을 쓴다.
    // 아래 sweep이 "#rrggbb" + 알파로 이어 붙이므로 16진수여야 한다
    const styles = getComputedStyle(canvas);
    return {
      green: styles.getPropertyValue("--radar-sweep").trim() || "#7FD9EC",
      amber: styles.getPropertyValue("--radar-blip").trim() || "#01B2D5",
      line: styles.getPropertyValue("--radar-line").trim() || "rgba(232,238,245,0.16)",
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
      ? ctx.createConicGradient(sweepAngle, cx, cy)
      : null;
    if (grad) {
      grad.addColorStop(0, c.green + "00");
      grad.addColorStop(0.85, c.green + "00");
      grad.addColorStop(0.97, c.green + "33");
      grad.addColorStop(1, c.green + "00");
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

    if (running) requestAnimationFrame(drawFrame);
  }

  resize();
  window.addEventListener("resize", resize);

  // 첫 화면이 보일 때만 돌린다(아래로 내려가면 멈춰 배터리·CPU를 아낀다)
  let running = false;
  const start = () => {
    if (running || reduceMotion) return;
    running = true;
    requestAnimationFrame(drawFrame);
  };
  if (reduceMotion) {
    drawStatic();
  } else if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start();
      else running = false;
    }).observe(canvas);
  } else {
    start();
  }

  // repaint static rings if theme changes while reduced-motion is on
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener?.("change", () => {
      if (reduceMotion) drawStatic();
    });
})();

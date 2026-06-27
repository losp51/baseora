"use client";

import { useEffect, useRef } from "react";

/* ─── CONFIG ─── */
const CONFIG = {
  PARTICLE_COUNT: 500,
  CELL_SIZE: 26,
  NOISE_SCALE: 0.0018,
  NOISE_SPEED: 0.00042,
  BASE_SPEED: 1.5,
  SPEED_VARIATION: 0.9,
  LINE_WIDTH_MIN: 0.3,
  LINE_WIDTH_MAX: 1.0,
  TRAIL_ALPHA: 0.10,
  RESET_CHANCE: 0.0025,
  COLORS: [
    { h: 210, s: 100, l: 85, a: 0.45 },
    { h: 200, s: 90,  l: 75, a: 0.38 },
    { h: 220, s: 80,  l: 90, a: 0.50 },
    { h: 195, s: 95,  l: 70, a: 0.32 },
    { h: 0,   s: 0,   l: 98, a: 0.28 },
    { h: 230, s: 70,  l: 80, a: 0.40 },
  ],
};

/* ─── PERLIN NOISE ─── */
function buildNoise() {
  const perm = new Uint8Array(512);
  const grad: [number, number][] = [];
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const angles = [0, 45, 90, 135, 180, 225, 270, 315].map(d => d * Math.PI / 180);
  for (let i = 0; i < 256; i++) {
    const a = angles[perm[i] % 8];
    grad[i] = [Math.cos(a), Math.sin(a)];
  }
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a: number, b: number, t: number) => a + t * (b - a);
  const dot2 = (g: [number, number], x: number, y: number) => g[0] * x + g[1] * y;

  return function noise2(x: number, y: number): number {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x), yf = y - Math.floor(y);
    const u = fade(xf), v = fade(yf);
    const aa = perm[perm[X] + Y], ab = perm[perm[X] + Y + 1];
    const ba = perm[perm[X + 1] + Y], bb = perm[perm[X + 1] + Y + 1];
    return lerp(
      lerp(dot2(grad[aa], xf, yf), dot2(grad[ba], xf - 1, yf), u),
      lerp(dot2(grad[ab], xf, yf - 1), dot2(grad[bb], xf - 1, yf - 1), u),
      v
    );
  };
}

export default function FlowFieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const noise2 = buildNoise();

    let W = 0, H = 0, cols = 0, rows = 0;
    let flowField: Float32Array;
    let noiseTime = 0;
    let rafId: number;

    /* ── resize ── */
    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      cols = Math.ceil(W / CONFIG.CELL_SIZE) + 1;
      rows = Math.ceil(H / CONFIG.CELL_SIZE) + 1;
      flowField = new Float32Array(cols * rows);
      ctx.fillStyle = "#0A0B0D";
      ctx.fillRect(0, 0, W, H);
    }

    /* ── flow field ── */
    function updateField() {
      noiseTime += CONFIG.NOISE_SPEED;
      const ns = CONFIG.NOISE_SCALE;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const n = noise2(
            c * ns * CONFIG.CELL_SIZE + noiseTime,
            r * ns * CONFIG.CELL_SIZE + noiseTime * 0.7
          );
          flowField[r * cols + c] = n * Math.PI * 4;
        }
      }
    }

    function getAngle(px: number, py: number) {
      const c = Math.max(0, Math.min(cols - 1, Math.floor(px / CONFIG.CELL_SIZE)));
      const r = Math.max(0, Math.min(rows - 1, Math.floor(py / CONFIG.CELL_SIZE)));
      return flowField[r * cols + c];
    }

    /* ── particle ── */
    type P = {
      x: number; y: number; px: number; py: number;
      speed: number; color: string; lw: number;
      life: number; maxLife: number;
    };

    function makeParticle(initial = false): P {
      const c = CONFIG.COLORS[Math.floor(Math.random() * CONFIG.COLORS.length)];
      const hv = (Math.random() - 0.5) * 18;
      const lv = (Math.random() - 0.5) * 12;
      const av = (Math.random() - 0.5) * 0.12;
      const x = Math.random() * W;
      const y = initial
        ? Math.random() * H
        : Math.random() < 0.5 ? -5 : H + 5;
      return {
        x, y, px: x, py: y,
        speed: CONFIG.BASE_SPEED + Math.random() * CONFIG.SPEED_VARIATION,
        color: `hsla(${c.h + hv},${c.s}%,${Math.min(95, c.l + lv)}%,${Math.max(0.12, c.a + av)})`,
        lw: CONFIG.LINE_WIDTH_MIN + Math.random() * (CONFIG.LINE_WIDTH_MAX - CONFIG.LINE_WIDTH_MIN),
        life: 0,
        maxLife: 180 + Math.random() * 400,
      };
    }

    let particles: P[] = [];

    function initParticles() {
      particles = Array.from({ length: CONFIG.PARTICLE_COUNT }, () => makeParticle(true));
    }

    /* ── loop ── */
    function loop() {
      rafId = requestAnimationFrame(loop);
      updateField();

      ctx.fillStyle = `rgba(10,11,13,${CONFIG.TRAIL_ALPHA})`;
      ctx.fillRect(0, 0, W, H);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.px = p.x; p.py = p.y;
        const angle = getAngle(p.x, p.y);
        p.x += Math.cos(angle) * p.speed;
        p.y += Math.sin(angle) * p.speed;
        p.life++;

        if (
          p.x < -10 || p.x > W + 10 ||
          p.y < -10 || p.y > H + 10 ||
          p.life > p.maxLife ||
          Math.random() < CONFIG.RESET_CHANCE
        ) {
          particles[i] = makeParticle();
          continue;
        }

        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.lw;
        ctx.lineCap = "round";
        ctx.stroke();
      }
    }

    resize();
    initParticles();
    loop();

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}

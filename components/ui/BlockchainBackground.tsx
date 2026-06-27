"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

/* ═══════════════════════════════════════════════════════════════
   MINIMALIST BLOCKCHAIN NETWORK BACKGROUND
   ─ Theme-aware: dark navy in dark mode, soft blue-white in light
   ─ Sparse, clean node-and-path grid
   ─ Extremely thin, precise linear edges — no chaos, no clutter
   ─ Very few, small geometric block nodes at key intersections
   ─ Drastically reduced particle count — almost imperceptible drift
   ─ Animation speed: near-meditative (≈15x slower than typical)
═══════════════════════════════════════════════════════════════ */

const DARK = {
  BG_R: 10, BG_G: 15, BG_B: 28,
  CYAN:  "0,220,255",
  TEAL:  "0,190,175",
  WHITE: "200,225,255",
  EDGE_A_BASE:  0.085,
  EDGE_A_PULSE: 0.04,
  NODE_BRIGHT:  0.60,
  BLOCK_ALPHA:  0.85,
};

const LIGHT = {
  BG_R: 13, BG_G: 27, BG_B: 62,   // #0D1B3E — matches CSS --bg-primary
  CYAN:  "0,180,255",
  TEAL:  "80,160,255",
  WHITE: "160,200,255",
  EDGE_A_BASE:  0.22,
  EDGE_A_PULSE: 0.12,
  NODE_BRIGHT:  0.90,
  BLOCK_ALPHA:  1.0,
};

const C = {
  DELTA:           0.00065,
  PARTICLE_SPEED:  0.0008,
  DRIFT_SPEED:     0.00018,
  PULSE_FREQ:      0.00022,
  NODE_PULSE_FREQ: 0.00035,
  BLOCK_ROT_SPEED: 0.000055,
  NODE_COUNT:      42,
  CONNECT_DIST:    210,
  EDGE_REBUILD:    240,
  BLOCK_COUNT:     7,
  BLOCK_SIZE:      9,
  PARTICLE_COUNT:  28,
  TRAIL_ALPHA:     0.038,
  PANEL_W: 460,
  PANEL_H: 540,
  PANEL_MARGIN: 80,
};

/* ── Permutation-table Perlin noise ── */
function makePerlin() {
  const perm = new Uint8Array(512);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const G: [number, number][] = [];
  [0,45,90,135,180,225,270,315].map(d => d * Math.PI / 180).forEach((a, i) => {
    for (let k = i; k < 256; k += 8) G[k] = [Math.cos(a), Math.sin(a)];
  });
  const f = (t: number) => t*t*t*(t*(t*6-15)+10);
  const l = (a: number, b: number, t: number) => a + t*(b-a);
  const d = (g: [number,number], x: number, y: number) => g[0]*x + g[1]*y;
  return (x: number, y: number) => {
    const X = Math.floor(x)&255, Y = Math.floor(y)&255;
    const xf = x-Math.floor(x), yf = y-Math.floor(y);
    const u = f(xf), v = f(yf);
    return l(
      l(d(G[perm[perm[X]+Y]],   xf,   yf),   d(G[perm[perm[X+1]+Y]],   xf-1, yf  ), u),
      l(d(G[perm[perm[X]+Y+1]], xf,   yf-1), d(G[perm[perm[X+1]+Y+1]], xf-1, yf-1), u),
      v
    );
  };
}

export default function BlockchainBackground() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const cv  = ref.current!;
    const ctx = cv.getContext("2d")!;
    const N   = makePerlin();

    /* pick palette based on current theme */
    const T = resolvedTheme === "light" ? LIGHT : DARK;

    let W = 0, H = 0, raf = 0, t = 0, frm = 0;
    let PX = 0, PY = 0; // panel centre

    /* ── types ── */
    interface Node {
      x: number; y: number;
      vx: number; vy: number;
      r: number; phase: number;
      isBlock: boolean; depth: number;
      col: string; rot: number;
    }
    interface Ptcl {
      ei: number; t: number;
      spd: number; col: string;
      alpha: number; sz: number;
      dir: 1|-1;
    }

    let nodes: Node[] = [];
    let edges: [number,number][] = [];
    let ptcls: Ptcl[] = [];

    /* ── panel repulsion ── */
    function repel(x: number, y: number): [number,number] {
      const hw = C.PANEL_W/2 + C.PANEL_MARGIN;
      const hh = C.PANEL_H/2 + C.PANEL_MARGIN;
      const dx = x - PX, dy = y - PY;
      if (Math.abs(dx) < hw && Math.abs(dy) < hh) {
        const fx = (dx < 0 ? -(hw-Math.abs(dx)) : (hw-Math.abs(dx))) * 0.004;
        const fy = (dy < 0 ? -(hh-Math.abs(dy)) : (hh-Math.abs(dy))) * 0.004;
        return [fx, fy];
      }
      return [0,0];
    }

    /* ── init nodes ── */
    function initNodes() {
      nodes = [];
      const COLS = [T.CYAN, T.TEAL, T.WHITE];
      for (let i = 0; i < C.NODE_COUNT; i++) {
        nodes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random()-.5)*.12,
          vy: (Math.random()-.5)*.12,
          r: 1.2 + Math.random()*2,
          phase: Math.random()*Math.PI*2,
          isBlock: i < C.BLOCK_COUNT,
          depth: Math.random(),
          col: COLS[(Math.random()*COLS.length)|0],
          rot: Math.random()*Math.PI*2,
        });
      }
    }

    /* ── build edges — only straight, clean connections ── */
    function buildEdges() {
      edges = [];
      for (let i = 0; i < nodes.length; i++)
        for (let j = i+1; j < nodes.length; j++) {
          const dx = nodes[i].x-nodes[j].x, dy = nodes[i].y-nodes[j].y;
          if (Math.hypot(dx,dy) < C.CONNECT_DIST) edges.push([i,j]);
        }
    }

    /* ── init particles ── */
    function initPtcls() {
      ptcls = [];
      if (!edges.length) return;
      const COLS = [T.CYAN, T.TEAL, T.WHITE];
      for (let i = 0; i < C.PARTICLE_COUNT; i++) {
        ptcls.push({
          ei:    (Math.random()*edges.length)|0,
          t:     Math.random(),
          spd:   C.PARTICLE_SPEED * (.6+Math.random()*.8),
          col:   COLS[(Math.random()*COLS.length)|0],
          alpha: .3+Math.random()*.4,
          sz:    .6+Math.random()*1.1,
          dir:   Math.random()<.5 ? 1 : -1,
        });
      }
    }

    function respawn(p: Ptcl) {
      if (!edges.length) return;
      p.ei = (Math.random()*edges.length)|0;
      p.t  = p.dir===1 ? 0 : 1;
    }

    /* ── draw minimal geometric block ── */
    function drawBlock(
      x: number, y: number, sz: number,
      rot: number, col: string, alpha: number
    ) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);

      /* very soft outer glow */
      const g = ctx.createRadialGradient(0,0,sz*.1, 0,0,sz*3.2);
      g.addColorStop(0,  `rgba(${col},${(alpha*.18).toFixed(3)})`);
      g.addColorStop(1,  `rgba(${col},0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0,0,sz*3.2,0,Math.PI*2); ctx.fill();

      /* hexagon — hairline stroke */
      ctx.beginPath();
      for (let s=0; s<6; s++) {
        const a = (s/6)*Math.PI*2;
        s===0
          ? ctx.moveTo(Math.cos(a)*sz, Math.sin(a)*sz)
          : ctx.lineTo(Math.cos(a)*sz, Math.sin(a)*sz);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(${col},${(alpha*.80).toFixed(3)})`;
      ctx.lineWidth   = 0.65;
      ctx.stroke();
      ctx.fillStyle   = `rgba(${col},${(alpha*.05).toFixed(3)})`;
      ctx.fill();

      /* inner projection — 3 clean lines */
      ctx.strokeStyle = `rgba(${col},${(alpha*.22).toFixed(3)})`;
      ctx.lineWidth   = 0.35;
      [[0,-sz,0,sz],[-sz*.866,-sz*.5,sz*.866,sz*.5],[sz*.866,-sz*.5,-sz*.866,sz*.5]]
        .forEach(([x1,y1,x2,y2]) => {
          ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
        });

      /* core pixel */
      ctx.fillStyle = `rgba(${col},${(alpha*.55).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(0,0,1,0,Math.PI*2); ctx.fill();

      ctx.restore();
    }

    /* ── resize ── */
    function resize() {
      W = cv.width  = window.innerWidth;
      H = cv.height = window.innerHeight;
      PX = W/2; PY = H/2;
      initNodes(); buildEdges(); initPtcls();
      ctx.fillStyle = `rgb(${T.BG_R},${T.BG_G},${T.BG_B})`;
      ctx.fillRect(0,0,W,H);
    }

    /* ════════════ RENDER LOOP ════════════ */
    function loop() {
      raf = requestAnimationFrame(loop);
      t   += C.DELTA;
      frm++;

      /* ── slow trail fade ── */
      ctx.fillStyle = `rgba(${T.BG_R},${T.BG_G},${T.BG_B},${C.TRAIL_ALPHA})`;
      ctx.fillRect(0,0,W,H);

      /* master pulse 0→1 */
      const pulse = .5 + .5*Math.sin(t * C.PULSE_FREQ * 10000);

      /* ── update node drift ── */
      const ns = .0007, ts = C.DRIFT_SPEED * 10000;
      for (const nd of nodes) {
        const nx = N(nd.x*ns + t*ts, nd.y*ns);
        const ny = N(nd.x*ns,        nd.y*ns + t*ts);
        const [rx,ry] = repel(nd.x, nd.y);
        nd.vx = nd.vx*.97 + nx*.018 + rx;
        nd.vy = nd.vy*.97 + ny*.018 + ry;
        nd.x += nd.vx; nd.y += nd.vy;
        nd.rot += C.BLOCK_ROT_SPEED * 10000 * C.DELTA;
        if (nd.x < -30)  nd.x = W+30;
        if (nd.x > W+30) nd.x = -30;
        if (nd.y < -30)  nd.y = H+30;
        if (nd.y > H+30) nd.y = -30;
      }

      /* ── periodic edge rebuild ── */
      if (frm % C.EDGE_REBUILD === 0) {
        buildEdges();
        for (const p of ptcls) if (edges.length) respawn(p);
      }

      /* ── draw edges — hairline, straight, clean ── */
      for (const [ai,bi] of edges) {
        const a = nodes[ai], b = nodes[bi];
        const dist   = Math.hypot(b.x-a.x, b.y-a.y);
        const fade   = 1 - dist/C.CONNECT_DIST;
        const depthF = 1 - (a.depth+b.depth)*.38;
        const alpha  = fade * depthF * (T.EDGE_A_BASE + pulse * T.EDGE_A_PULSE);
        const col    = (a.depth+b.depth)*.5 > .5 ? T.TEAL : T.CYAN;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);          // perfectly straight lines
        ctx.strokeStyle = `rgba(${col},${alpha.toFixed(3)})`;
        ctx.lineWidth   = .4 + pulse*.15;
        ctx.stroke();
      }

      /* ── draw particles — perfect linear drift ── */
      for (const p of ptcls) {
        if (!edges[p.ei]) { respawn(p); continue; }
        const [ai,bi] = edges[p.ei];
        const a = nodes[ai], b = nodes[bi];

        p.t += p.spd * p.dir;
        if (p.t>1 || p.t<0) { respawn(p); continue; }

        const x = a.x + (b.x-a.x)*p.t;
        const y = a.y + (b.y-a.y)*p.t;

        const avgD  = (a.depth+b.depth)*.5;
        const bokeh = p.sz * (1.2 + avgD*3.5);
        const fa    = p.alpha * (1-avgD*.5);

        /* minimal glow — no large flare */
        const gr = ctx.createRadialGradient(x,y,0, x,y,bokeh*2.8);
        gr.addColorStop(0,   `rgba(${p.col},${(fa*.65).toFixed(3)})`);
        gr.addColorStop(.5,  `rgba(${p.col},${(fa*.12).toFixed(3)})`);
        gr.addColorStop(1,   `rgba(${p.col},0)`);
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.arc(x,y,bokeh*2.8,0,Math.PI*2); ctx.fill();

        /* sharp core dot */
        ctx.fillStyle = `rgba(${p.col},${fa.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(x,y,bokeh*.55,0,Math.PI*2); ctx.fill();
      }

      /* ── draw nodes ── */
      for (const nd of nodes) {
        const np   = .55 + .45*Math.sin(t*C.NODE_PULSE_FREQ*10000 + nd.phase);
        const brigA = .2 + (1-nd.depth) * T.NODE_BRIGHT;

        if (nd.isBlock) {
          drawBlock(nd.x, nd.y, C.BLOCK_SIZE*(.88+np*.12),
            nd.rot, nd.col, np*brigA*T.BLOCK_ALPHA);
        } else {
          const r  = nd.r * np;
          const gr = ctx.createRadialGradient(nd.x,nd.y,0, nd.x,nd.y,r*5);
          gr.addColorStop(0,  `rgba(${nd.col},${(.60*brigA).toFixed(3)})`);
          gr.addColorStop(.45,`rgba(${nd.col},${(.12*brigA).toFixed(3)})`);
          gr.addColorStop(1,  `rgba(${nd.col},0)`);
          ctx.fillStyle = gr;
          ctx.beginPath(); ctx.arc(nd.x,nd.y,r*5,0,Math.PI*2); ctx.fill();

          ctx.fillStyle = `rgba(${nd.col},${(.80*brigA).toFixed(3)})`;
          ctx.beginPath(); ctx.arc(nd.x,nd.y,r,0,Math.PI*2); ctx.fill();
        }
      }

      /* ── subtle panel integration shadow ── */
      const panelShadowCol = "5,10,30";
      const panelShadowA0  = resolvedTheme === "light" ? 0.55 : 0.40;
      const panelShadowA1  = resolvedTheme === "light" ? 0.18 : 0.12;

      const ps = ctx.createRadialGradient(PX,PY,0, PX,PY, Math.max(C.PANEL_W,C.PANEL_H)*.72);
      ps.addColorStop(0,  `rgba(${panelShadowCol},${panelShadowA0})`);
      ps.addColorStop(.6, `rgba(${panelShadowCol},${panelShadowA1})`);
      ps.addColorStop(1,  `rgba(${panelShadowCol},0)`);
      ctx.fillStyle = ps;
      ctx.fillRect(PX-C.PANEL_W,PY-C.PANEL_H, C.PANEL_W*2,C.PANEL_H*2);

      /* ── clean vignette ── */
      const vigCol = "2,6,20";
      const vigA   = resolvedTheme === "light" ? 0.45 : 0.50;
      const vg = ctx.createRadialGradient(W/2,H/2, H*.18, W/2,H/2, H*.88);
      vg.addColorStop(0,  "rgba(0,0,0,0)");
      vg.addColorStop(1, `rgba(${vigCol},${vigA + pulse*.05})`);
      ctx.fillStyle = vg;
      ctx.fillRect(0,0,W,H);
    }

    resize();
    loop();
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize",resize); };
  }, [resolvedTheme]);

  return (
    <canvas
      ref={ref}
      id="blockchain-bg"
      style={{
        position:"fixed", inset:0,
        width:"100vw", height:"100vh",
        zIndex:0, pointerEvents:"none", display:"block",
      }}
    />
  );
}

import { useEffect, useRef } from "react";

/**
 * The hero as a hanging cloth printed with “Brand & Product Design.”: pinned
 * at three points along the top, moving with a slow, gusting wind; the
 * pointer pushes it. Verlet physics, as first published. The drawing is the
 * realistic part: the print is sharp at the screen's resolution, the sheet is
 * drawn smooth (each simulated cell split into finer, curved pieces), folds
 * darken where the cloth bunches or tilts, and wherever it folds over itself
 * its back shows on top instead of letters cut through. Calls onUnsupported
 * when the browser has no WebGL 2, so the page can fall back to the image trail.
 */

const GROUND = [0xf5 / 255, 0xf5 / 255, 0xf5 / 255]; // the hero's #F5F5F5

const VERTEX = `#version 300 es
in vec2 aPos; in vec2 aUV; in float aShade;
uniform vec2 uOffset, uViewport; uniform float uScale;
out vec2 vUV; out float vShade;
void main() {
  vec2 px = aPos * uScale + uOffset;
  gl_Position = vec4(px.x / uViewport.x * 2.0 - 1.0, 1.0 - px.y / uViewport.y * 2.0, 0.0, 1.0);
  vUV = aUV; vShade = aShade;
}`;

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUV; in float vShade; uniform sampler2D uTex; uniform float uBack; out vec4 o;
void main() {
  vec3 c = texture(uTex, vUV).rgb;
  // The back of the fabric: the print shows faintly through, darker
  if (uBack > 0.5) c = vec3(0.07) + c * 0.18;
  o = vec4(c * vShade, 1.0);
}`;

/** The print, sharp and square like the cloth. */
const drawPrint = () => {
  const W = 2048, H = 2048;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fff";
  const font = (s: number) => `700 ${s}px Inter, "Helvetica Neue", Arial, sans-serif`;
  let size = W * 0.2;
  ctx.font = font(size);
  size *= (W * 0.777) / ctx.measureText("Product").width;
  ctx.font = font(size);
  (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${-0.02 * size}px`;
  const left = W * 0.113, step = W * 0.216, top = W * 0.287;
  ["Brand &", "Product", "Design."].forEach((l, i) => ctx.fillText(l, left, top + i * step));
  const s = W * 0.161;
  ctx.fillStyle = "rgb(46,93,235)";
  ctx.fillRect(W * 0.737, H - W * 0.103 - s, s, s);
  return cv;
};

// Catmull-Rom: a smooth curve through four points
const cr = (p0: number, p1: number, p2: number, p3: number, t: number) => {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
};

const ClothHero = ({ onUnsupported }: { onUnsupported?: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const gl = canvas.getContext("webgl2", { antialias: true, alpha: false });
    if (!gl) {
      onUnsupported?.();
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth < 768;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const COLS = isMobile ? 26 : 36;
    const ROWS = isMobile ? 26 : 36;
    const ITERS = isMobile ? 5 : 7;
    const GRAVITY = 0.008;
    const DAMPING = 0.994;

    let VW = 0, VH = 0, OX = 0, OY = 0, SIZE = 0;
    const sizeFor = (w: number, h: number) => (isMobile ? Math.min(w, h) * 0.85 : Math.min(760, h * 0.84));

    // ── Shaders ──
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      onUnsupported?.();
      return;
    }
    gl.useProgram(program);
    const uOffset = gl.getUniformLocation(program, "uOffset");
    const uViewport = gl.getUniformLocation(program, "uViewport");
    const uScale = gl.getUniformLocation(program, "uScale");
    const uBack = gl.getUniformLocation(program, "uBack");
    gl.clearColor(GROUND[0], GROUND[1], GROUND[2], 1);
    gl.enable(gl.CULL_FACE);

    // ── Physics, in a fixed 760px cloth space (scaled when drawn) ──
    const BASE = 760;
    const CW = BASE / (COLS - 1), CH = BASE / (ROWS - 1);
    const N = COLS * ROWS;
    const PIN_COLS = new Set([0, Math.floor(COLS / 2), COLS - 1]);
    const pX = new Float32Array(N), pY = new Float32Array(N), pPX = new Float32Array(N), pPY = new Float32Array(N);
    const pPin = new Uint8Array(N);
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        pX[i] = pPX[i] = c * CW;
        pY[i] = pPY[i] = r * CH;
        pPin[i] = r === 0 && PIN_COLS.has(c) ? 1 : 0;
      }
    const A: number[] = [], B: number[] = [], R: number[] = [];
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        if (c < COLS - 1) A.push(i), B.push(i + 1), R.push(CW);
        if (r < ROWS - 1) A.push(i), B.push(i + COLS), R.push(CH);
      }
    const caA = new Int32Array(A), caB = new Int32Array(B), caR = new Float32Array(R);

    let simTime = 0, windTarget = 0.012, windSmooth = 0.03, windNextAt = 3;
    let mouseX = -1e4, mouseY = -1e4, mouseActive = false;
    const PUSH = BASE * 0.1;
    // Phones: a finger reaches wider than a cursor, and scrolling blows a gust
    // through the cloth, so it answers even when it isn't touched
    const reach = isMobile ? 1.7 : 1;
    let gust = 0, lastScroll = window.scrollY;

    const simulate = (dt: number) => {
      simTime += dt;
      if (simTime > windNextAt) {
        windTarget = (Math.random() - 0.42) * 0.042;
        windNextAt = simTime + 2.5 + Math.random() * 4;
      }
      windSmooth += (windTarget - windSmooth) * 0.003;
      const T = simTime;
      for (let i = 0; i < N; i++) {
        if (pPin[i]) continue;
        const col = i % COLS, row = (i / COLS) | 0;
        const wx =
          windSmooth * (0.55 + 0.45 * Math.sin(T * 0.43 + col * 0.21 + row * 0.08)) * (0.65 + 0.35 * Math.sin(T * 0.19 - row * 0.14)) +
          0.005 * Math.sin(T * 1.2 + col * 0.38);
        const wy = 0.003 * Math.sin(T * 0.28 + col * 0.17) * (row / ROWS);
        const gx = gust * (row / ROWS) * (0.7 + 0.3 * Math.sin(col * 0.4 + T));
        const vx = (pX[i] - pPX[i]) * DAMPING, vy = (pY[i] - pPY[i]) * DAMPING;
        pPX[i] = pX[i];
        pPY[i] = pY[i];
        pX[i] += vx + wx + gx;
        pY[i] += vy + wy + GRAVITY;
      }
      gust *= 0.97;
      if (mouseActive) {
        const push = PUSH * reach;
        for (let i = 0; i < N; i++) {
          if (pPin[i]) continue;
          const dx = pX[i] - mouseX, dy = pY[i] - mouseY, d2 = dx * dx + dy * dy;
          if (d2 < push * push && d2 > 0.01) {
            const d = Math.sqrt(d2), f = ((push - d) / push) * 3.5;
            pX[i] += (dx / d) * f;
            pY[i] += (dy / d) * f;
          }
        }
      }
      for (let it = 0; it < ITERS; it++)
        for (let k = 0; k < caA.length; k++) {
          const a = caA[k], b = caB[k];
          const dx = pX[b] - pX[a], dy = pY[b] - pY[a];
          const dist = Math.sqrt(dx * dx + dy * dy) || 1e-4;
          const diff = ((dist - caR[k]) / dist) * 0.5, ox = dx * diff, oy = dy * diff;
          if (!pPin[a]) (pX[a] += ox), (pY[a] += oy);
          if (!pPin[b]) (pX[b] -= ox), (pY[b] -= oy);
        }
    };

    // ── Drawing: a finer, curved sheet over the simulated points ──
    const SUB = isMobile ? 3 : 4;
    const RC = (COLS - 1) * SUB + 1, RR = (ROWS - 1) * SUB + 1, RN = RC * RR;
    const rX = new Float32Array(RN), rY = new Float32Array(RN), shade = new Float32Array(RN), pos = new Float32Array(RN * 2);
    const rowX = new Float32Array(RC * ROWS), rowY = new Float32Array(RC * ROWS);
    const uv = new Float32Array(RN * 2);
    for (let r = 0; r < RR; r++)
      for (let c = 0; c < RC; c++) {
        const i = r * RC + c;
        uv[i * 2] = c / (RC - 1);
        uv[i * 2 + 1] = r / (RR - 1);
      }
    const idx: number[] = [];
    for (let r = 0; r < RR - 1; r++)
      for (let c = 0; c < RC - 1; c++) {
        const i = r * RC + c;
        idx.push(i, i + 1, i + RC, i + 1, i + RC + 1, i + RC);
      }
    const indexData = new Uint32Array(idx);
    const restU = CW / SUB, restV = CH / SUB;

    const smooth = () => {
      // Along each simulated row, then down each column
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < RC; c++) {
          const s = c / SUB, k = Math.min(Math.floor(s), COLS - 2), t = s - k;
          const i0 = r * COLS + Math.max(k - 1, 0), i1 = r * COLS + k, i2 = i1 + 1, i3 = r * COLS + Math.min(k + 2, COLS - 1);
          rowX[r * RC + c] = cr(pX[i0], pX[i1], pX[i2], pX[i3], t);
          rowY[r * RC + c] = cr(pY[i0], pY[i1], pY[i2], pY[i3], t);
        }
      for (let r = 0; r < RR; r++) {
        const s = r / SUB, k = Math.min(Math.floor(s), ROWS - 2), t = s - k;
        const a0 = Math.max(k - 1, 0) * RC, a1 = k * RC, a2 = (k + 1) * RC, a3 = Math.min(k + 2, ROWS - 1) * RC;
        for (let c = 0; c < RC; c++) {
          const i = r * RC + c;
          rX[i] = cr(rowX[a0 + c], rowX[a1 + c], rowX[a2 + c], rowX[a3 + c], t);
          rY[i] = cr(rowY[a0 + c], rowY[a1 + c], rowY[a2 + c], rowY[a3 + c], t);
        }
      }
      // Light: a stretch of cloth that shows shorter than it is must be tilted
      // away from you, so it gets less light — that gives each fold its shadow
      for (let r = 0; r < RR; r++)
        for (let c = 0; c < RC; c++) {
          const i = r * RC + c;
          const l = r * RC + Math.max(c - 1, 0), rr = r * RC + Math.min(c + 1, RC - 1);
          const u = Math.max(r - 1, 0) * RC + c, d = Math.min(r + 1, RR - 1) * RC + c;
          const su = Math.hypot(rX[rr] - rX[l], rY[rr] - rY[l]) / (restU * (rr - l));
          const sv = Math.hypot(rX[d] - rX[u], rY[d] - rY[u]) / (restV * ((d - u) / RC));
          shade[i] = 0.58 + 0.44 * Math.pow(Math.min(su, 1) * Math.min(sv, 1), 1.6);
        }
    };

    // ── Buffers ──
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const attr = (data: Float32Array, name: string, size: number, usage: number) => {
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, data, usage);
      const l = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(l);
      gl.vertexAttribPointer(l, size, gl.FLOAT, false, 0, 0);
      return b;
    };
    const posBuf = attr(pos, "aPos", 2, gl.DYNAMIC_DRAW);
    const shadeBuf = attr(shade, "aShade", 1, gl.DYNAMIC_DRAW);
    attr(uv, "aUV", 2, gl.STATIC_DRAW);
    const idxBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);

    let texReady = false;
    const tex = gl.createTexture();
    const paint = () => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, drawPrint());
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const an = gl.getExtension("EXT_texture_filter_anisotropic");
      if (an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(an.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
      texReady = true;
    };
    let cancelled = false;
    document.fonts.load("700 100px Inter").finally(() => {
      if (cancelled) return;
      paint();
      // If Inter wasn't in yet, print it again once it is
      if (!document.fonts.check("700 100px Inter")) document.fonts.ready.then(() => !cancelled && paint());
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      VW = rect.width;
      VH = rect.height;
      canvas.width = Math.round(VW * DPR);
      canvas.height = Math.round(VH * DPR);
      SIZE = sizeFor(VW, VH);
      // Big and centred; the bio card may overlap its corner
      OX = (VW - SIZE) / 2;
      OY = (VH - SIZE) / 2;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const render = () => {
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (!texReady) return;
      smooth();
      for (let i = 0; i < RN; i++) {
        pos[i * 2] = rX[i];
        pos[i * 2 + 1] = rY[i];
      }
      gl.uniform2f(uOffset, OX, OY);
      gl.uniform2f(uViewport, VW, VH);
      gl.uniform1f(uScale, SIZE / BASE);
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos);
      gl.bindBuffer(gl.ARRAY_BUFFER, shadeBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, shade);
      // The front first; then any part folded over, showing its back, on top
      gl.cullFace(gl.FRONT);
      gl.uniform1f(uBack, 0);
      gl.drawElements(gl.TRIANGLES, indexData.length, gl.UNSIGNED_INT, 0);
      gl.cullFace(gl.BACK);
      gl.uniform1f(uBack, 1);
      gl.drawElements(gl.TRIANGLES, indexData.length, gl.UNSIGNED_INT, 0);
    };

    // Pointer in cloth space; no preventDefault, so touch still scrolls the page
    const point = (x: number, y: number) => {
      const rect = canvas.getBoundingClientRect();
      const s = SIZE / BASE;
      mouseX = (x - rect.left - OX) / s;
      mouseY = (y - rect.top - OY) / s;
      mouseActive = y >= rect.top && y <= rect.bottom;
    };
    const onMove = (e: PointerEvent) => (!isMobile || e.pointerType !== "touch") && point(e.clientX, e.clientY);
    const onLeave = () => (mouseActive = false);
    // A finger: pointer events stop as soon as the page starts scrolling, but
    // touch events keep coming, so the cloth follows the thumb all the way
    const onTouch = (e: TouchEvent) => e.touches[0] && point(e.touches[0].clientX, e.touches[0].clientY);

    // Fixed timestep, so the motion stays smooth on any refresh rate. The
    // hero sits under the next sections once you scroll: stop drawing then.
    const FIXED = 1 / 60;
    let last = 0, acc = 0, raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden || window.scrollY > window.innerHeight * 1.1) {
        last = 0;
        lastScroll = window.scrollY; // back from below: not one big gust for the whole way up
        return;
      }
      if (isMobile && !reduced) {
        const sy = window.scrollY;
        gust = Math.max(-0.08, Math.min(0.08, gust + Math.max(-40, Math.min(40, sy - lastScroll)) * 0.0012));
        lastScroll = sy;
      }
      if (!last) {
        last = now;
        render();
        return;
      }
      acc += Math.min((now - last) / 1000, 0.25);
      last = now;
      let steps = 0;
      while (acc >= FIXED && steps < 5) {
        simulate(reduced ? FIXED * 0.25 : FIXED);
        acc -= FIXED;
        steps++;
      }
      render();
    };

    // Play a few seconds of wind before the first frame, so the cloth shows
    // up already hanging and waving instead of dropping and bouncing into
    // place; a random start means each visit catches the wind at a new moment
    simTime = Math.random() * 20;
    windNextAt = simTime + 1;
    for (let k = 0; k < 420; k++) simulate(FIXED);

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    if (isMobile) {
      window.addEventListener("touchstart", onTouch, { passive: true });
      window.addEventListener("touchmove", onTouch, { passive: true });
      window.addEventListener("touchend", onLeave);
      window.addEventListener("touchcancel", onLeave);
    }
    raf = requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend", onLeave);
      window.removeEventListener("touchcancel", onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-10 w-full h-full"
      role="img"
      aria-label="A cloth printed with “Brand & Product Design.”, moving in the wind"
    />
  );
};

export default ClothHero;

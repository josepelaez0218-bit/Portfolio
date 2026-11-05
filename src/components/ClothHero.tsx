import { useEffect, useRef } from "react";

/**
 * The hero as a hanging cloth printed with “Brand & Product Design.”, in 3D:
 * a sheet of points pinned at three spots on its top edge, pushed by a soft
 * gusting wind that blows towards and away from you, so it folds for real.
 * Depth keeps the nearer fold in front (no letters cut through), each fold
 * catches a little light, and the print is drawn sharp at the screen's own
 * resolution. Phones get a taller cloth. Calls onUnsupported when the browser
 * has no WebGL 2, so the page can fall back to the image trail.
 */

const GROUND = [0xf5 / 255, 0xf5 / 255, 0xf5 / 255]; // the hero's #F5F5F5
const BLUE = "rgb(46,93,235)";

const VERTEX = `#version 300 es
in vec3 aPos; in vec2 aUV; in vec3 aNormal;
uniform vec2 uOffset, uViewport; uniform float uScale;
out vec2 vUV; out vec3 vN;
void main() {
  vec2 px = aPos.xy * uScale + uOffset;
  // Flat projection; depth only decides which fold is in front
  gl_Position = vec4(px.x / uViewport.x * 2.0 - 1.0, 1.0 - px.y / uViewport.y * 2.0, aPos.z / 2000.0, 1.0);
  vUV = aUV; vN = aNormal;
}`;

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUV; in vec3 vN; uniform sampler2D uTex; out vec4 o;
void main() {
  // Whichever side shows, light the side facing you: soft, from the top left
  vec3 n = normalize(vN); if (n.z > 0.0) n = -n;
  float l = max(dot(n, normalize(vec3(-0.35, -0.45, -1.0))), 0.0);
  o = vec4(texture(uTex, vUV).rgb * mix(0.62, 1.04, l), 1.0);
}`;

/** The print, sharp, in the cloth's own proportion (phones: words low, clear of the card). */
const drawPrint = (aspect: number, phone: boolean) => {
  const W = 2048, H = Math.round(W / aspect);
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fff";
  let size = W * 0.2;
  ctx.font = `700 ${size}px Inter, "Helvetica Neue", Arial, sans-serif`;
  size *= (W * 0.777) / ctx.measureText("Product").width;
  ctx.font = `700 ${size}px Inter, "Helvetica Neue", Arial, sans-serif`;
  (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${-0.02 * size}px`;
  const left = W * 0.113, step = W * 0.216;
  const top = phone ? H - W * 0.16 - 2 * step : W * 0.287;
  ["Brand &", "Product", "Design."].forEach((l, i) => ctx.fillText(l, left, top + i * step));
  const s = W * 0.161;
  ctx.fillStyle = BLUE;
  ctx.fillRect(W * 0.737, phone ? W * 0.12 : H - W * 0.103 - s, s, s);
  return cv;
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
    const phone = window.innerWidth < 768;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const ASPECT = phone ? 2 / 3 : 4 / 5; // width / height
    const COLS = phone ? 34 : 46;
    const ROWS = Math.round((COLS - 1) / ASPECT) + 1;
    const ITERS = phone ? 8 : 10;
    const BASE_W = 760, BASE_H = BASE_W / ASPECT;
    const CW = BASE_W / (COLS - 1), CH = BASE_H / (ROWS - 1);

    // ── Shaders ──
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      onUnsupported?.();
      return;
    }
    gl.useProgram(prog);
    const uOffset = gl.getUniformLocation(prog, "uOffset");
    const uViewport = gl.getUniformLocation(prog, "uViewport");
    const uScale = gl.getUniformLocation(prog, "uScale");
    gl.clearColor(GROUND[0], GROUND[1], GROUND[2], 1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // ── Physics: Verlet points with stretch, shear and bend links ──
    const N = COLS * ROWS;
    const X = new Float32Array(N), Y = new Float32Array(N), Z = new Float32Array(N);
    const PX = new Float32Array(N), PY = new Float32Array(N), PZ = new Float32Array(N);
    const pin = new Uint8Array(N);
    const PINS = new Set([0, Math.floor(COLS / 2), COLS - 1]);
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        X[i] = PX[i] = c * CW;
        Y[i] = PY[i] = r * CH;
        pin[i] = r === 0 && PINS.has(c) ? 1 : 0;
      }
    const LA: number[] = [], LB: number[] = [], LR: number[] = [], LK: number[] = [];
    const link = (a: number, b: number, k: number) => {
      LA.push(a);
      LB.push(b);
      LR.push(Math.hypot(X[b] - X[a], Y[b] - Y[a]));
      LK.push(k);
    };
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        if (c < COLS - 1) link(i, i + 1, 1);
        if (r < ROWS - 1) link(i, i + COLS, 1);
        // Shear: keeps the weave from collapsing sideways
        if (c < COLS - 1 && r < ROWS - 1) {
          link(i, i + COLS + 1, 0.6);
          link(i + 1, i + COLS, 0.6);
        }
        // Bend: a soft stiffness, so it makes waves instead of crumpling
        if (c < COLS - 2) link(i, i + 2, 0.18);
        if (r < ROWS - 2) link(i, i + 2 * COLS, 0.18);
      }
    const la = new Int32Array(LA), lb = new Int32Array(LB), lr = new Float32Array(LR), lk = new Float32Array(LK);

    let t = 0, gust = 0.5, gustTo = 0.6, gustAt = 3;
    let mx = -1e4, my = -1e4, mOn = false, mSpeed = 0;
    const PUSH = BASE_W * 0.1, GRAVITY = 0.012, DAMP = 0.993;
    // How far the cloth may come towards you or away, and the faint pull back
    // to its resting plane that keeps it from rolling up into a ball
    const DEPTH = BASE_W * 0.25, FLATTEN = 0.0008;

    const step = (dt: number) => {
      t += dt;
      if (t > gustAt) {
        gustTo = 0.25 + Math.random() * 0.9;
        gustAt = t + 2.5 + Math.random() * 4;
      }
      gust += (gustTo - gust) * 0.004;
      for (let i = 0; i < N; i++) {
        if (pin[i]) continue;
        const c = i % COLS, r = (i / COLS) | 0, v = r / ROWS;
        // Wind mostly through the cloth (towards and away from you), a little sideways
        const wz = gust * 0.05 * (Math.sin(t * 0.9 + c * 0.23 + r * 0.11) + 0.6 * Math.sin(t * 1.7 - r * 0.19 + c * 0.07)) * (0.3 + v);
        const wx = gust * 0.012 * Math.sin(t * 0.43 + r * 0.09);
        const vx = (X[i] - PX[i]) * DAMP, vy = (Y[i] - PY[i]) * DAMP, vz = (Z[i] - PZ[i]) * DAMP;
        PX[i] = X[i];
        PY[i] = Y[i];
        PZ[i] = Z[i];
        X[i] += vx + wx;
        Y[i] += vy + GRAVITY;
        Z[i] += vz + wz - Z[i] * FLATTEN;
        if (Z[i] > DEPTH) Z[i] = DEPTH;
        else if (Z[i] < -DEPTH) Z[i] = -DEPTH;
      }
      // The pointer only stirs it while it moves, like a hand brushing past:
      // a gentle push away from you, stronger the faster the hand goes
      const stir = Math.min(mSpeed, 30) * 0.012;
      mSpeed *= 0.85;
      if (mOn && stir > 0.01)
        for (let i = 0; i < N; i++) {
          if (pin[i]) continue;
          const dx = X[i] - mx, dy = Y[i] - my, d2 = dx * dx + dy * dy;
          if (d2 < PUSH * PUSH) Z[i] += (1 - Math.sqrt(d2) / PUSH) * stir;
        }
      for (let it = 0; it < ITERS; it++)
        for (let k = 0; k < la.length; k++) {
          const a = la[k], b = lb[k];
          const dx = X[b] - X[a], dy = Y[b] - Y[a], dz = Z[b] - Z[a];
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-4;
          const s = ((d - lr[k]) / d) * 0.5 * lk[k];
          const ox = dx * s, oy = dy * s, oz = dz * s;
          if (!pin[a]) (X[a] += ox), (Y[a] += oy), (Z[a] += oz);
          if (!pin[b]) (X[b] -= ox), (Y[b] -= oy), (Z[b] -= oz);
        }
    };

    // ── Buffers ──
    const uv = new Float32Array(N * 2);
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        uv[i * 2] = c / (COLS - 1);
        uv[i * 2 + 1] = r / (ROWS - 1);
      }
    const ind: number[] = [];
    for (let r = 0; r < ROWS - 1; r++)
      for (let c = 0; c < COLS - 1; c++) {
        const i = r * COLS + c;
        ind.push(i, i + 1, i + COLS, i + 1, i + COLS + 1, i + COLS);
      }
    const pos = new Float32Array(N * 3), nor = new Float32Array(N * 3);
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const attr = (data: Float32Array, name: string, size: number, usage: number) => {
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, data, usage);
      const l = gl.getAttribLocation(prog, name);
      gl.enableVertexAttribArray(l);
      gl.vertexAttribPointer(l, size, gl.FLOAT, false, 0, 0);
      return b;
    };
    const posBuf = attr(pos, "aPos", 3, gl.DYNAMIC_DRAW);
    const norBuf = attr(nor, "aNormal", 3, gl.DYNAMIC_DRAW);
    attr(uv, "aUV", 2, gl.STATIC_DRAW);
    const ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(ind), gl.STATIC_DRAW);

    const normals = () => {
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++) {
          const i = r * COLS + c;
          const l = r * COLS + Math.max(c - 1, 0), rr = r * COLS + Math.min(c + 1, COLS - 1);
          const u = Math.max(r - 1, 0) * COLS + c, d = Math.min(r + 1, ROWS - 1) * COLS + c;
          const ax = X[rr] - X[l], ay = Y[rr] - Y[l], az = Z[rr] - Z[l];
          const bx = X[d] - X[u], by = Y[d] - Y[u], bz = Z[d] - Z[u];
          const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
          const n = Math.hypot(nx, ny, nz) || 1;
          nor[i * 3] = nx / n;
          nor[i * 3 + 1] = ny / n;
          nor[i * 3 + 2] = nz / n;
        }
    };

    let VW = 0, VH = 0, OX = 0, OY = 0, SCALE = 1;
    const resize = () => {
      VW = canvas.clientWidth;
      VH = canvas.clientHeight;
      canvas.width = Math.round(VW * DPR);
      canvas.height = Math.round(VH * DPR);
      gl.viewport(0, 0, canvas.width, canvas.height);
      // Phones: nearly the full width, low on the screen under the card. Wide screens: big and centred.
      const h = phone ? Math.min(VH * 0.78, (VW * 0.9) / ASPECT) : Math.min(VH * 0.84, 950);
      SCALE = h / BASE_H;
      OX = (VW - BASE_W * SCALE) / 2;
      OY = phone ? VH - h - VH * 0.04 : (VH - h) / 2;
    };

    // Pointer in cloth space; no preventDefault, so touch still scrolls the page
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = (e.clientX - rect.left - OX) / SCALE, ny = (e.clientY - rect.top - OY) / SCALE;
      if (mOn) mSpeed = Math.max(mSpeed, Math.hypot(nx - mx, ny - my));
      mx = nx;
      my = ny;
      mOn = e.clientY >= rect.top && e.clientY <= rect.bottom;
    };
    const onLeave = () => (mOn = false);

    let raf = 0, cancelled = false;
    const ro = new ResizeObserver(resize);
    document.fonts.load("700 100px Inter").finally(() => {
      if (cancelled) return;
      const tex = gl.createTexture();
      const paint = () => {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, drawPrint(ASPECT, phone));
        gl.generateMipmap(gl.TEXTURE_2D);
      };
      paint();
      // If Inter wasn't in yet, print it again once it is
      if (!document.fonts.check("700 100px Inter")) document.fonts.ready.then(() => !cancelled && paint());
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
      if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));

      resize();
      ro.observe(canvas);
      // Let it settle before showing it, so it doesn't start as a flat board
      for (let k = 0; k < 240; k++) step(1 / 60);

      // Fixed timestep, so the motion stays smooth on any refresh rate. The
      // hero sits under the next sections once you scroll: stop drawing then.
      const FIXED = 1 / 60;
      let last = 0, acc = 0;
      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        if (document.hidden || window.scrollY > window.innerHeight * 1.1) {
          last = 0;
          return;
        }
        if (!last) last = now;
        acc += Math.min((now - last) / 1000, 0.25);
        last = now;
        let n = 0;
        while (acc >= FIXED && n < 4) {
          step(reduced ? FIXED * 0.25 : FIXED);
          acc -= FIXED;
          n++;
        }
        for (let i = 0; i < N; i++) {
          pos[i * 3] = X[i];
          pos[i * 3 + 1] = Y[i];
          pos[i * 3 + 2] = Z[i];
        }
        normals();
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.uniform2f(uOffset, OX, OY);
        gl.uniform2f(uViewport, VW, VH);
        gl.uniform1f(uScale, SCALE);
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos);
        gl.bindBuffer(gl.ARRAY_BUFFER, norBuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, nor);
        gl.drawElements(gl.TRIANGLES, ind.length, gl.UNSIGNED_SHORT, 0);
      };
      raf = requestAnimationFrame(frame);
    });

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
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

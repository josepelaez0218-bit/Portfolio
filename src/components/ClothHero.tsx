import { useEffect, useRef } from "react";

/**
 * The hero as a hanging cloth printed with “Brand & Product Design.”: pinned
 * at three points along the top, moving with a slow, gusting wind; the
 * pointer pushes it. Verlet physics, drawn in one WebGL call per frame.
 * (Ported from the original /cloth-webgl.html.) Calls onUnsupported when the
 * browser has no WebGL, so the page can fall back to the image trail.
 */

const TEXTURE = "/images/cloth-fabric.jpg";
const GROUND = [0xf5 / 255, 0xf5 / 255, 0xf5 / 255]; // the hero's #F5F5F5

const ClothHero = ({ onUnsupported }: { onUnsupported?: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const gl = canvas.getContext("webgl", { antialias: true, alpha: false });
    if (!gl) {
      onUnsupported?.();
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth < 768;
    const DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1.2 : 1.5);
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
    gl.attachShader(
      program,
      compile(
        gl.VERTEX_SHADER,
        `attribute vec2 aPos; attribute vec2 aUV; uniform vec2 uOffset; uniform vec2 uViewport; uniform float uScale; varying vec2 vUV;
         void main() { vec2 px = aPos * uScale + uOffset;
           gl_Position = vec4((px.x / uViewport.x) * 2.0 - 1.0, 1.0 - (px.y / uViewport.y) * 2.0, 0.0, 1.0); vUV = aUV; }`,
      ),
    );
    gl.attachShader(
      program,
      compile(gl.FRAGMENT_SHADER, `precision mediump float; varying vec2 vUV; uniform sampler2D uTex; void main() { gl_FragColor = texture2D(uTex, vUV); }`),
    );
    gl.linkProgram(program);
    gl.useProgram(program);
    const aPos = gl.getAttribLocation(program, "aPos");
    const aUV = gl.getAttribLocation(program, "aUV");
    const uOffset = gl.getUniformLocation(program, "uOffset");
    const uViewport = gl.getUniformLocation(program, "uViewport");
    const uScale = gl.getUniformLocation(program, "uScale");
    const uTex = gl.getUniformLocation(program, "uTex");
    gl.clearColor(GROUND[0], GROUND[1], GROUND[2], 1);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // ── Texture ──
    const glTex = gl.createTexture();
    let texReady = false;
    const tex = new Image();
    tex.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, glTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      texReady = true;
    };
    tex.src = TEXTURE;

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
        const vx = (pX[i] - pPX[i]) * DAMPING, vy = (pY[i] - pPY[i]) * DAMPING;
        pPX[i] = pX[i];
        pPY[i] = pY[i];
        pX[i] += vx + wx;
        pY[i] += vy + wy + GRAVITY;
      }
      if (mouseActive) {
        for (let i = 0; i < N; i++) {
          if (pPin[i]) continue;
          const dx = pX[i] - mouseX, dy = pY[i] - mouseY, d2 = dx * dx + dy * dy;
          if (d2 < PUSH * PUSH && d2 > 0.01) {
            const d = Math.sqrt(d2), f = ((PUSH - d) / PUSH) * 3.5;
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

    // ── Buffers ──
    const uv = new Float32Array(N * 2);
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        uv[i * 2] = c / (COLS - 1);
        uv[i * 2 + 1] = r / (ROWS - 1);
      }
    const idx: number[] = [];
    for (let r = 0; r < ROWS - 1; r++)
      for (let c = 0; c < COLS - 1; c++) {
        const i0 = r * COLS + c;
        idx.push(i0, i0 + 1, i0 + COLS, i0 + 1, i0 + COLS + 1, i0 + COLS);
      }
    const indexData = new Uint16Array(idx);
    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, N * 2 * 4, gl.DYNAMIC_DRAW);
    const uvBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
    const idxBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);
    const pos = new Float32Array(N * 2);

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
      for (let i = 0; i < N; i++) {
        pos[i * 2] = pX[i];
        pos[i * 2 + 1] = pY[i];
      }
      gl.uniform2f(uOffset, OX, OY);
      gl.uniform2f(uViewport, VW, VH);
      gl.uniform1f(uScale, SIZE / BASE);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, glTex);
      gl.uniform1i(uTex, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
      gl.enableVertexAttribArray(aUV);
      gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
      gl.drawElements(gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, 0);
    };

    // Pointer in cloth space; no preventDefault, so touch still scrolls the page
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const s = SIZE / BASE;
      mouseX = (e.clientX - rect.left - OX) / s;
      mouseY = (e.clientY - rect.top - OY) / s;
      mouseActive = e.clientY >= rect.top && e.clientY <= rect.bottom;
    };
    const onLeave = () => (mouseActive = false);

    // Fixed timestep, so the motion stays smooth on any refresh rate. The
    // hero sits under the next sections once you scroll: stop drawing then.
    const FIXED = 1 / 60;
    let last = 0, acc = 0, raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden || window.scrollY > window.innerHeight * 1.1) {
        last = 0;
        return;
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

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(loop);
    return () => {
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

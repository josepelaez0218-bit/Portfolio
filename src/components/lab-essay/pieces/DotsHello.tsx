import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { clamp01, ease, prefersReducedMotion, range } from "../lib";

// The sprite: 47 frames of a short "hello" video, 400×225 each, tiled 8×6,
// already masked (wall removed) and toned: 0 = nothing, 255 = dense.
const SPRITE = "/lab/hello-dots-400.png";
const FW = 400, FH = 225, COLS = 8, FRAMES = 47;
// Look: "bitmap" (default) — square dots, ordered dither; "letters" — the
// figure drawn with the letters of my own info, flowing sideways through it;
// "glyph" — round dots shaped by tone (ring → disc). ?dots=letters|glyph to compare.
const LOOK_PARAM = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("dots") : null;
const LOOK: "letters" | "bitmap" | "glyph" = LOOK_PARAM === "letters" || LOOK_PARAM === "glyph" ? LOOK_PARAM : "bitmap";
const BITMAP_SCALE = 1.67; // square dots span this many video pixels
const GLYPH_SCALE = 4.3; // glyph cells span this many video pixels
const LETTER_SCALE = 1.0; // letter cells: one video pixel wide — tiny letters, so the face reads
const LETTER_FLOW = 7; // characters per second the text slides sideways
const INFO =
  "JOSE PELÁEZ · CREATIVE PRODUCT DESIGNER · SEEDTAG · BUEN PUERTO STUDIO · WEB · BRANDING · PHOTOGRAPHY · ILLUSTRATION · MOTION · MADRID · ";

// Choreography, in scrolled vh after `startVh`
export const DOTS = {
  toDots: [0, 30] as const, //    the question breaks up into dots
  toFigure: [25, 70] as const, // the dots regroup into the figure
  wave: [70, 150] as const, //    the figure holds (the wave itself plays on a loop, in real time)
  toOutro: [150, 195] as const, // the figure breaks up again into the closing line, if there is one
  fadeOut: [1e6, 1e6 + 1] as const, // the line stays; the scene just scrolls away
  length: 235, //                 …held a beat, then the scene lets go
};

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

export type DotsHelloHandle = { update: (scrolled: number, vh: number) => void };

/**
 * The question turns into a field of dots, and the dots become me, waving —
 * the scroll scrubs the wave. A bitmap/ordered-dither look: square white dots
 * on the Lab’s black. (A pointer scatter is built in but switched off: POINTER_SCATTER.)
 */
type Props = {
  startVh: number;
  caption?: string;
  /** dot colour */ ink?: string;
  /** the ground, for the caption's halo */ ground?: string;
  /** the heading is shown in dots from the very start (the real text only gives the shape) */
  startDotted?: boolean;
  /** Light grounds: ink stands for shadow, not light (a printed halftone), so the figure doesn't read as a negative */
  invert?: boolean;
  /** A live camera feed: when set, the visitor is drawn in dots instead of me */
  live?: HTMLVideoElement | null;
};
const DotsHello = forwardRef<DotsHelloHandle, Props>(({ startVh, caption, ink = "#fff", ground = "#000", startDotted = false, invert = false, live = null }, ref) => {
  const liveRef = useRef<HTMLVideoElement | null>(null);
  liveRef.current = live;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captionRef = useRef<HTMLParagraphElement>(null);
  const frames = useRef<Uint8Array[] | null>(null);
  // Live camera: each frame is grabbed at the sprite's resolution, mirrored, as luminance
  const liveBuf = useRef<{ c: HTMLCanvasElement; g: CanvasRenderingContext2D; data: Uint8Array } | null>(null);
  const grabLive = (v: HTMLVideoElement) => {
    if (!liveBuf.current) {
      const c = document.createElement("canvas");
      c.width = FW;
      c.height = FH;
      liveBuf.current = { c, g: c.getContext("2d", { willReadFrequently: true })!, data: new Uint8Array(FW * FH) };
    }
    const { g, data } = liveBuf.current;
    const vw = v.videoWidth, vh = v.videoHeight;
    if (!vw || !vh) return null;
    // cover-crop to the sprite's 16:9 and mirror, like a selfie view
    const s = Math.max(FW / vw, FH / vh), dw = vw * s, dh = vh * s;
    g.setTransform(-1, 0, 0, 1, FW, 0);
    g.drawImage(v, (FW - dw) / 2, (FH - dh) / 2, dw, dh);
    const px = g.getImageData(0, 0, FW, FH).data;
    let lo = 255, hi = 0;
    for (let i = 0; i < FW * FH; i++) {
      const l = (px[i * 4] * 0.2126 + px[i * 4 + 1] * 0.7152 + px[i * 4 + 2] * 0.0722) | 0;
      data[i] = l;
      if (l < lo) lo = l;
      if (l > hi) hi = l;
    }
    // auto-contrast so any room reads
    const span = Math.max(30, hi - lo);
    for (let i = 0; i < FW * FH; i++) data[i] = Math.max(0, Math.min(255, ((data[i] - lo) * 255) / span));
    return data;
  };
  const textMask = useRef<{ key: string; data: Uint8Array } | null>(null);
  // px/py: the pointer; sx/sy: where the push is, trailing it; push: 0…1 presence
  const state = useRef({ sVh: -1, raf: 0, px: -9999, py: -9999, sx: -9999, sy: -9999, push: 0, dirty: true, waveStart: -1 });

  // Decode the sprite once
  useEffect(() => {
    const img = new Image();
    img.src = SPRITE;
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext("2d", { willReadFrequently: true })!;
      g.drawImage(img, 0, 0);
      const all = g.getImageData(0, 0, img.width, img.height).data;
      frames.current = Array.from({ length: FRAMES }, (_, f) => {
        const ox = (f % COLS) * FW, oy = Math.floor(f / COLS) * FH;
        const out = new Uint8Array(FW * FH);
        for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) out[y * FW + x] = all[((oy + y) * img.width + ox + x) * 4];
        return out;
      });
      state.current.dirty = true;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const stage = canvas.parentElement as HTMLElement;
    const ctx = canvas.getContext("2d")!;
    const S = state.current;

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      S.px = e.clientX - r.left;
      S.py = e.clientY - r.top;
      S.dirty = true;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    const onLeave = () => {
      S.px = S.py = -9999;
    };
    document.documentElement.addEventListener("pointerleave", onLeave);
    const onResize = () => {
      textMask.current = null;
      S.dirty = true;
    };
    window.addEventListener("resize", onResize);
    // Rebuild the mask once the webfont is in, so the dots take the real letters' shape
    document.fonts?.ready.then(onResize);

    // The question, rasterised onto the dot grid (from the real letters on screen)
    // Rasterise a text element onto the dot grid (from its real letters on screen)
    const buildMask = (heading: Element | null, cols: number, rows: number, cw: number, ch: number) => {
      const off = document.createElement("canvas");
      off.width = canvas.clientWidth;
      off.height = canvas.clientHeight;
      const g = off.getContext("2d", { willReadFrequently: true })!;
      const base = canvas.getBoundingClientRect();
      g.fillStyle = "#fff";
      g.textBaseline = "alphabetic";
      heading?.querySelectorAll<HTMLElement>("span").forEach((s) => {
        if (s.children.length || !s.textContent?.trim()) return;
        const r = s.getBoundingClientRect(), cs = getComputedStyle(s);
        g.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        // Draw what's on screen: the heading is uppercased in CSS
        const ch = cs.textTransform === "uppercase" ? s.textContent.toUpperCase() : s.textContent;
        const m = g.measureText(ch);
        // Baseline: centre the glyph's ascent/descent in the span box
        const y = r.top - base.top + (r.height + m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
        g.fillText(ch, r.left - base.left, y);
      });
      const px = g.getImageData(0, 0, off.width, off.height).data;
      const data = new Uint8Array(cols * rows);
      for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) {
        const x = Math.round((cx + 0.5) * cw), y = Math.round((cy + 0.5) * ch);
        if (x < 0 || y < 0 || x >= off.width || y >= off.height) continue;
        data[cy * cols + cx] = px[(y * off.width + x) * 4 + 3] > 110 ? 255 : 0;
      }
      return data;
    };
    const buildTextMask = (cols: number, rows: number, cw: number, ch: number) => {
      const key = `${cols}x${rows}x${cw.toFixed(2)}x${ch.toFixed(2)}`;
      if (textMask.current?.key === key) return textMask.current.data;
      const data = buildMask(stage.querySelector("h1"), cols, rows, cw, ch);
      textMask.current = { key, data };
      return data;
    };
    // The closing line: any [data-dots-outro] element in the stage, laid out but invisible
    let outroMask: { key: string; data: Uint8Array } | null = null;
    const buildOutroMask = (cols: number, rows: number, cw: number, ch: number) => {
      const el = stage.querySelector("[data-dots-outro]");
      if (!el) return null;
      const key = `${cols}x${rows}x${cw.toFixed(2)}x${ch.toFixed(2)}`;
      if (outroMask?.key !== key) outroMask = { key, data: buildMask(el, cols, rows, cw, ch) };
      return outroMask.data;
    };

    // Average of a block of video pixels around (fx, fy), in video pixel units
    const sample = (frame: Uint8Array, fx: number, fy: number, span: number) => {
      const r = Math.max(0, Math.floor(span / 2));
      const x0 = Math.round(fx), y0 = Math.round(fy);
      let sum = 0, n = 0;
      for (let y = y0 - r; y <= y0 + r; y++) for (let x = x0 - r; x <= x0 + r; x++) {
        if (x < 0 || y < 0 || x >= FW || y >= FH) continue;
        sum += frame[y * FW + x];
        n++;
      }
      return n ? sum / n / 255 : 0;
    };

    // Letters look: every character of INFO pre-drawn in two weights, so a
    // frame is thousands of cheap image copies rather than text layout
    const atlas = new Map<string, HTMLCanvasElement>();
    let atlasKey = "";
    const ensureAtlas = (cw: number, ch: number, dpr: number) => {
      const key = `${cw.toFixed(2)}x${ch.toFixed(2)}x${dpr}`;
      if (key === atlasKey) return;
      atlasKey = key;
      atlas.clear();
      const W = Math.max(2, Math.round(cw * dpr)), H = Math.max(2, Math.round(ch * dpr));
      for (const c of new Set(INFO)) {
        if (c === " ") continue;
        for (const wgt of ["r", "b"]) {
          const t = document.createElement("canvas");
          t.width = W;
          t.height = H;
          const g = t.getContext("2d")!;
          g.fillStyle = "#fff";
          g.font = `${wgt === "b" ? 700 : 500} ${(H * 0.9).toFixed(1)}px "IBM Plex Mono", ui-monospace, monospace`;
          g.textAlign = "center";
          g.textBaseline = "middle";
          g.fillText(c, W / 2, H / 2 + H * 0.04);
          atlas.set(wgt + c, t);
        }
      }
    };

    // Glyph look: four pre-drawn tones — small ring, ring, ring + centre, disc
    let glyphs: HTMLCanvasElement[] = [];
    let glyphSize = 0;
    const ensureGlyphs = (size: number) => {
      const sz = Math.max(4, Math.round(size));
      if (sz === glyphSize) return;
      glyphSize = sz;
      glyphs = [0, 1, 2, 3].map((level) => {
        const c = document.createElement("canvas");
        c.width = c.height = sz;
        const g = c.getContext("2d")!;
        const r = sz / 2, lw = Math.max(1, sz * 0.09);
        g.strokeStyle = g.fillStyle = "#fff";
        g.lineWidth = lw;
        g.beginPath();
        if (level === 0) g.arc(r, r, sz * 0.2, 0, Math.PI * 2);
        else g.arc(r, r, sz * 0.38, 0, Math.PI * 2);
        if (level === 3) g.fill();
        else g.stroke();
        if (level === 2) {
          g.beginPath();
          g.arc(r, r, sz * 0.13, 0, Math.PI * 2);
          g.fill();
        }
        return c;
      });
    };

    const draw = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const sVh = S.sVh - startVh;
      const heading = stage.querySelector("h1") as HTMLElement | null;
      const eyebrow = heading?.previousElementSibling as HTMLElement | null;
      const reduced = prefersReducedMotion();

      const tDots = startDotted ? 1 : ease(range(sVh, ...DOTS.toDots));
      const tFig = ease(range(sVh, ...DOTS.toFigure));
      const tWave = range(sVh, ...DOTS.wave);
      const tOut = ease(range(sVh, ...DOTS.fadeOut));
      const tLine = ease(range(sVh, ...DOTS.toOutro));
      // The real text gives way to its dotted twin
      // !important: the entrance animation's fill-mode would otherwise win
      heading?.style.setProperty("opacity", (1 - tDots).toFixed(3), "important");
      eyebrow?.style.setProperty("opacity", (1 - tDots).toFixed(3), "important");
      if (captionRef.current) {
        // In as the hand comes up to wave
        const c = ease(range(sVh, DOTS.wave[0] + 5, DOTS.wave[0] + 35)) * (1 - tOut) * (1 - ease(range(sVh, DOTS.toOutro[0], DOTS.toOutro[0] + 18)));
        captionRef.current.style.opacity = c.toFixed(3);
        captionRef.current.style.translate = `-50% calc(-50% + ${((1 - c) * 16).toFixed(1)}px)`;
      }
      if ((!startDotted && sVh <= DOTS.toDots[0]) || tOut >= 1) return;

      // Dot grid: the video's pixel grid, covering the stage
      // Landscape: the video covers the stage. Portrait: fit the figure (its
      // middle ~72%, waving arm included) to the width, a little below centre
      // — a finer grid, so the dotted question still reads.
      const portrait = h > w;
      // Zoomed in on the figure, his head on the screen's vertical centre line
      // (landscape: top of the head ~10% down, cropped at the bottom).
      const ZOOM = 1.3, HEAD_X = 0.472, HEAD_Y = 0.21; // head centre x / head top y, as fractions of the video
      const liveV = liveRef.current;
      // Live camera fills the stage; my clip keeps its framing
      const px = liveV ? Math.max(w / FW, h / FH) : portrait ? w / (FW * 0.72) : Math.max(w / FW, h / FH) * ZOOM; // one video pixel, on screen
      const ox = liveV ? (w - FW * px) / 2 : w / 2 - FW * HEAD_X * px;
      const oy = liveV ? (h - FH * px) / 2 : portrait ? (h - FH * px) / 2 + h * 0.06 : h * 0.1 - FH * HEAD_Y * px;
      const glyph = LOOK === "glyph", letters = LOOK === "letters";
      const cell = px * (glyph ? GLYPH_SCALE : letters ? LETTER_SCALE : BITMAP_SCALE); // cell width
      const cellH = letters ? cell / 0.6 : cell; //  monospace letters are 0.6em wide
      const cols = Math.ceil(w / cell) + 1, rows = Math.ceil(h / cellH);
      const text = buildTextMask(cols, rows, cell, cellH);
      const outro = tLine > 0 ? buildOutroMask(cols, rows, cell, cellH) : null;
      // Letters: the text slides left, smoothly — whole characters advance,
      // the remainder shifts the row by a fraction of a cell
      const flow = (performance.now() / 1000) * LETTER_FLOW;
      const flowInt = Math.floor(flow), shift = (flow - flowInt) * cell;
      if (letters) ensureAtlas(cell, cellH, dpr);
      const fr = frames.current;
      const liveFrame = liveV ? grabLive(liveV) : null;
      // The wave plays in real time once the figure has formed: once through,
      // then back and forth over the waving part, so it never stops
      if (tFig > 0.35 && S.waveStart < 0) S.waveStart = performance.now();
      if (tFig <= 0) S.waveStart = -1;
      const f = S.waveStart < 0 ? 0 : ((performance.now() - S.waveStart) / 1000) * 24;
      const LOOP_A = 18, LOOP_B = FRAMES - 1, span = LOOP_B - LOOP_A;
      const g = (f - LOOP_B) % (2 * span); // after the first pass: down to LOOP_A and back up
      const loopFrame = f <= LOOP_B ? f : g < span ? LOOP_B - g : LOOP_A + (g - span);
      const fi = reduced ? Math.round(tWave * (FRAMES - 1)) : Math.min(FRAMES - 1, Math.round(loopFrame));
      const video = fr ? fr[fi] : null;

      const dot = cell * 0.72;
      // Push: the trailing point eases after the pointer, and the push fades
      // in and out with it, so the field opens and closes softly
      const here = S.px > -9000;
      if (here && S.sx < -9000) { S.sx = S.px; S.sy = S.py; }
      if (here) { S.sx += (S.px - S.sx) * 0.2; S.sy += (S.py - S.sy) * 0.2; }
      S.push += ((here ? 1 : 0) - S.push) * 0.08;
      // Scatter, not a crowd: a soft gaussian field (no hard edge to pile up
      // against) that pushes each dot outwards a little and throws it off in
      // its own random direction, so the dots under the pointer thin out and
      // spread like sand rather than bunching into a ring
      const R = Math.min(w, h) * 0.2; //     reach of the field
      const R2 = (R * 2.2) ** 2; //            beyond this, no effect
      const RADIAL = R * 0.55, SCATTER = R * 0.75;
      // Pointer scatter switched off for now (flip to true to bring it back)
      const POINTER_SCATTER = false;
      if (glyph) ensureGlyphs(cell * dpr);
      ctx.fillStyle = ink;
      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const i = cy * cols + cx;
          // Letters: the question doesn't re-spell itself in the grid (too coarse to read);
          // it simply gives way to the figure
          const tv = letters ? 0 : text[i] / 255;
          const src = liveFrame ?? video;
          const raw = src ? sample(src, ((cx + 0.5) * cell - ox) / px, ((cy + 0.5) * cellH - oy) / px, glyph ? GLYPH_SCALE : letters ? LETTER_SCALE : BITMAP_SCALE) : 0;
          // The sprite stores mask × tone (0.16…1). Inverted: dense where the video is dark,
          // sparse in the highlights; min(1, raw/0.16) keeps the soft edge of the figure
          // Live: plain luminance (inverted on light grounds); my clip: masked tone
          const vv = liveFrame ? (invert ? 1 - raw : raw) : !invert || raw <= 0.01 ? raw : Math.min(1, raw / 0.16) * (0.08 + 0.64 * Math.pow(1 - Math.min(1, Math.max(0, (raw - 0.16) / 0.84)), 1.4));
          // Each dot changes over at its own moment, so the regroup ripples
          const n = ((cx * 73856093) ^ (cy * 19349663)) >>> 0;
          const delay = (n % 1000) / 1000;
          const k = liveFrame ? 1 : reduced ? tFig : clamp01((tFig - delay * 0.55) / 0.45);
          const k2 = !outro || liveFrame ? 0 : reduced ? tLine : clamp01((tLine - delay * 0.55) / 0.45);
          let v = tv * tDots * (1 - k) + vv * k * (1 - k2) + (outro ? (outro[i] / 255) * k2 : 0);
          v *= 1 - tOut * (0.4 + 0.6 * delay);
          if (v <= 0) continue;
          // Pushed away from the pointer: strongest at the centre, eased off to the edge
          let ox2 = 0, oy2 = 0;
          if (POINTER_SCATTER && S.push > 0.01) {
            const dx = cx * cell + cell / 2 - S.sx, dy = cy * cellH + cellH / 2 - S.sy;
            const d2 = dx * dx + dy * dy;
            if (d2 < R2 && d2 > 0.01) {
              const d = Math.sqrt(d2);
              const f = Math.exp(-d2 / (R * R)) * S.push; // 1 at the pointer, fading smoothly
              const ang = (n % 6283) / 1000; //              this dot's own direction
              const amt = 0.35 + ((n >>> 13) % 1000) / 1540; // and how far it flies
              ox2 = (dx / d) * RADIAL * f + Math.cos(ang) * SCATTER * amt * f;
              oy2 = (dy / d) * RADIAL * f + Math.sin(ang) * SCATTER * amt * f;
            }
          }
          const lens = 1;
          if (letters) {
            if (v < 0.1) continue;
            // Each row reads the info from a different point, so rows don't stack up
            const c = INFO[(cx + flowInt + cy * 11) % INFO.length];
            if (c === " ") continue;
            // Tone → brightness and weight: highlights bold and bright, shadows thin and dim
            const tile = atlas.get((v > 0.42 ? "b" : "r") + c);
            if (!tile) continue;
            // Tiny letters cover little ink, so the tone curve is lifted: even the
            // shirt reads, the face and hand come through bright
            ctx.globalAlpha = Math.min(1, (0.3 + 1.15 * v) * (0.85 + 0.3 * (lens - 1) / 0.55));
            ctx.drawImage(tile, cx * cell - shift + ox2, cy * cellH + oy2, cell, cellH);
            continue;
          }
          if (glyph) {
            const level = v < 0.14 ? -1 : v < 0.36 ? 0 : v < 0.6 ? 1 : v < 0.82 ? 2 : 3;
            if (level < 0) continue;
            const s = cell * Math.min(1.25, lens);
            ctx.drawImage(glyphs[level], cx * cell + (cell - s) / 2 + ox2, cy * cell + (cell - s) / 2 + oy2, s, s);
            continue;
          }
          if (v < BAYER[(cy & 3) * 4 + (cx & 3)]) continue;
          const s = Math.min(cell * 0.98, dot * lens);
          ctx.fillRect(cx * cell + (cell - s) / 2 + ox2, cy * cell + (cell - s) / 2 + oy2, s, s);
        }
      }
      ctx.globalAlpha = 1;
    };

    let onScreen = true;
    const io = new IntersectionObserver(([e]) => (onScreen = e.isIntersecting));
    io.observe(canvas);
    const tick = () => {
      S.raf = requestAnimationFrame(tick);
      // Letters flow and the wave loops on their own while the scene is showing
      if (onScreen && (liveRef.current || (S.sVh - startVh > DOTS.toDots[0] && !prefersReducedMotion()))) S.dirty = true;

      if (!S.dirty) return;
      S.dirty = false;
      draw();
    };
    S.raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(S.raf);
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
      const heading = stage.querySelector("h1") as HTMLElement | null;
      heading?.style.removeProperty("opacity");
      (heading?.previousElementSibling as HTMLElement | null)?.style.removeProperty("opacity");
    };
  }, [startVh, ink, startDotted, invert]);

  useImperativeHandle(ref, () => ({
    update: (scrolled, vh) => {
      const sVh = (scrolled / vh) * 100;
      // Before the dots start, the text mask must follow the live letters
      if (sVh < startVh && !startDotted) textMask.current = null;
      state.current.sVh = sVh;
      state.current.dirty = true;
    },
  }), [startVh]);

  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" />
      {caption && (
        <p ref={captionRef} className="absolute left-1/2 top-1/2 w-[90vw] md:w-auto text-center font-serif font-normal text-[14vw] md:text-[min(7.4vw,112px)] leading-[0.95] tracking-[-0.02em] text-foreground md:whitespace-nowrap pointer-events-none"
          // A soft black halo clears the dots right around the letters, so it reads over the figure
          style={{ opacity: 0, translate: "-50% calc(-50% + 16px)", textShadow: `0 0 18px ${ground}, 0 0 36px ${ground}, 0 0 64px ${ground}` }}>
          {caption}
        </p>
      )}
    </>
  );
});

DotsHello.displayName = "DotsHello";
export default DotsHello;

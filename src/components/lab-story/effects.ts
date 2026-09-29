import Matter from "matter-js";

/**
 * Pointer reactions for the Lab story question. Each effect drives the
 * letter <span>s imperatively (transforms, weight, glyphs, masks…) from a
 * shared per-frame loop, and must restore everything it touched on dispose.
 */

export type Pointer = {
  x: number;
  y: number;
  /** Per-frame velocity, px/frame. */
  vx: number;
  vy: number;
  active: boolean;
};

export type EffectContext = {
  letters: HTMLSpanElement[];
  heading: HTMLElement;
  /** The pinned, full-viewport container the heading sits in. */
  stage: HTMLElement;
  pointer: Pointer;
  /** True once the question is fully typed — reactions only run then. */
  isDone: () => boolean;
};

export type Effect = { step: () => void; dispose: () => void };

export type EffectDef = {
  id: number;
  name: string;
  hint: string;
  create: (ctx: EffectContext) => Effect;
};

export const fontSizeOf = (el: HTMLElement) => parseFloat(getComputedStyle(el).fontSize);

const centerOf = (el: HTMLElement, offsetX = 0, offsetY = 0) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2 - offsetX, y: r.top + r.height / 2 - offsetY };
};

export const smoothstep = (k: number) => k * k * (3 - 2 * k);

/** Letters grouped by their word <span> (the unbreakable inline-block). */
export type Word = { el: HTMLElement; idx: number[] };
export const groupWords = (letters: HTMLSpanElement[]): Word[] => {
  const map = new Map<HTMLElement, number[]>();
  letters.forEach((l, i) => {
    const w = l.parentElement as HTMLElement;
    if (!map.has(w)) map.set(w, []);
    map.get(w)!.push(i);
  });
  return [...map].map(([el, idx]) => ({ el, idx }));
};

/** Is the pointer over this word (with a little forgiving padding)? */
export const overWord = (w: Word, p: Pointer, fontSize: number, padEm = 0.1) => {
  const r = w.el.getBoundingClientRect();
  const pad = fontSize * padEm;
  return p.x >= r.left - pad && p.x <= r.right + pad && p.y >= r.top - pad * 0.5 && p.y <= r.bottom + pad * 0.5;
};

// ─── 1. Ink lens ────────────────────────────────────────────────────────────
// Letters swell in weight under the cursor (Platypi is a variable font, so
// the weight interpolates smoothly), lifting slightly like ink under a lens.
const inkLens: EffectDef = {
  id: 1,
  name: "Ink lens",
  hint: "Hover the words",
  create: ({ letters, heading, pointer, isDone }) => {
    const weight = letters.map(() => 400);
    const lift = letters.map(() => 0);

    return {
      step: () => {
        const fs = fontSizeOf(heading);
        const radius = fs * 2.4;
        const on = isDone() && pointer.active;
        letters.forEach((l, i) => {
          let k = 0;
          if (on) {
            const c = centerOf(l, 0, lift[i]);
            k = smoothstep(Math.max(0, 1 - Math.hypot(c.x - pointer.x, c.y - pointer.y) / radius));
          }
          weight[i] += (400 + 400 * k - weight[i]) * 0.16;
          lift[i] += (-0.07 * fs * k - lift[i]) * 0.16;
          l.style.fontWeight = String(Math.round(weight[i]));
          l.style.transform = `translate3d(0, ${lift[i].toFixed(2)}px, 0)`;
        });
      },
      dispose: () =>
        letters.forEach((l) => {
          l.style.fontWeight = "";
          l.style.transform = "";
        }),
    };
  },
};

// ─── 2. Languages ───────────────────────────────────────────────────────────
// Touched letters scramble through other writing systems before resolving
// back — "designing through different languages", literally.
const SCRIPTS = [
  "αβγδεζηθλμξπσφψω",
  "бгджзлпфцчшщыэюя",
  "あいうえおかきくけこさしすせそたちつてと",
  "ابتثجحخدذرزسشصضطظعغفقكلمن",
  "אבגדהוזחטיכלמנסעפצקרשת",
  "कखगघचछजझटठडढतथदधनपफबभम",
  "가나다라마바사아자차카타파하",
];
const pick = (s: string) => {
  const chars = Array.from(s);
  return chars[Math.floor(Math.random() * chars.length)];
};

/**
 * Shared engine for "touch to cycle" effects, triggered per word: hovering a
 * word sets all its letters cycling (glyph, style…) in a quick cascade, and
 * they settle back letter by letter shortly after the pointer leaves it.
 * Each cycling letter's box is locked (width, height, line-height, top
 * alignment) so a glyph from a font with different metrics can never push
 * the line around; `apply` can then nudge the glyph onto the baseline.
 */
const hoverCycle = (opts: {
  intervalMs: [number, number];
  /** How long a word keeps cycling after the pointer leaves it. */
  settleMs: number;
  /** Delay between consecutive letters of a word, both starting and settling. */
  staggerMs: number;
  /** Called once when a letter starts cycling; returns per-burst data. */
  begin: (l: HTMLSpanElement) => unknown;
  /** Show the next variation. */
  apply: (l: HTMLSpanElement, i: number, burst: unknown) => void;
  /** Put the letter back exactly as it was. */
  restore: (l: HTMLSpanElement, i: number) => void;
  dispose?: () => void;
}) =>
  ({ letters, heading, pointer, isDone }: EffectContext): Effect => {
    const words = groupWords(letters);
    const state = letters.map(() => ({ until: 0, next: 0, burst: null as unknown, active: false }));

    const lock = (l: HTMLSpanElement) => {
      const h = l.offsetHeight;
      l.style.width = `${l.offsetWidth}px`;
      l.style.height = `${h}px`;
      l.style.lineHeight = `${h}px`;
      l.style.verticalAlign = "top";
      l.style.textAlign = "center";
      l.style.whiteSpace = "nowrap";
    };
    const unlock = (l: HTMLSpanElement) => {
      ["width", "height", "lineHeight", "verticalAlign", "textAlign", "whiteSpace"].forEach(
        (k) => (l.style[k as "width"] = ""),
      );
    };
    const settle = (i: number) => {
      opts.restore(letters[i], i);
      unlock(letters[i]);
      state[i].active = false;
    };

    return {
      step: () => {
        const now = performance.now();
        const fs = fontSizeOf(heading);
        const on = isDone() && pointer.active;

        words.forEach((w) => {
          if (!on || !overWord(w, pointer, fs)) return;
          w.idx.forEach((i, j) => {
            const s = state[i];
            if (!s.active) {
              lock(letters[i]);
              s.burst = opts.begin(letters[i]);
              s.active = true;
              s.next = now + j * opts.staggerMs;
            }
            s.until = now + opts.settleMs + j * opts.staggerMs;
          });
        });

        letters.forEach((l, i) => {
          const s = state[i];
          if (!s.active) return;
          if (now > s.until) settle(i);
          else if (now > s.next) {
            opts.apply(l, i, s.burst);
            const [a, b] = opts.intervalMs;
            s.next = now + a + Math.random() * (b - a);
          }
        });
      },
      dispose: () => {
        letters.forEach((_, i) => state[i].active && settle(i));
        opts.dispose?.();
      },
    };
  };

const languages: EffectDef = {
  id: 2,
  name: "Languages",
  hint: "Hover a word",
  create: (ctx) => {
    const original = ctx.letters.map((l) => l.textContent ?? "");
    return hoverCycle({
      intervalMs: [55, 100],
      settleMs: 500,
      staggerMs: 35,
      begin: (l) => {
        l.style.color = "hsl(var(--foreground) / 0.7)";
        return SCRIPTS[Math.floor(Math.random() * SCRIPTS.length)];
      },
      apply: (l, _i, script) => (l.textContent = pick(script as string)),
      restore: (l, i) => {
        l.textContent = original[i];
        l.style.color = "";
      },
    })(ctx);
  },
};

// ─── 3. Physics ─────────────────────────────────────────────────────────────
// Swipe fast through the words (or click a letter) and they break loose,
// fall and pile up; drag and throw them around. Scroll back up or
// double-click to rebuild the question.
const physics: EffectDef = {
  id: 3,
  name: "Physics",
  hint: "Swipe fast or click · double-click to rebuild",
  create: ({ letters, heading, stage, pointer, isDone }) => {
    const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint } = Matter;
    const engine = Engine.create();
    engine.gravity.y = 1.1;

    type LetterState = {
      mode: "rest" | "free" | "return";
      body: Matter.Body | null;
      base: { x: number; y: number };
      x: number;
      y: number;
      r: number;
    };
    const state: LetterState[] = letters.map(() => ({
      mode: "rest",
      body: null,
      base: { x: 0, y: 0 },
      x: 0,
      y: 0,
      r: 0,
    }));

    let walls: Matter.Body[] = [];
    const buildWalls = () => {
      Composite.remove(engine.world, walls);
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      const t = 200;
      walls = [
        Bodies.rectangle(w / 2, h + t / 2, w * 3, t, { isStatic: true }),
        Bodies.rectangle(-t / 2, h / 2, t, h * 4, { isStatic: true }),
        Bodies.rectangle(w + t / 2, h / 2, t, h * 4, { isStatic: true }),
        Bodies.rectangle(w / 2, -h - t / 2, w * 3, t, { isStatic: true }),
      ];
      Composite.add(engine.world, walls);
    };
    buildWalls();

    const detach = (i: number, vx: number, vy: number) => {
      const s = state[i];
      if (s.mode === "free") return;
      const l = letters[i];
      const prev = l.style.transform;
      l.style.transform = "none";
      const r = l.getBoundingClientRect();
      l.style.transform = prev;
      const sr = stage.getBoundingClientRect();
      s.base = { x: r.left - sr.left + r.width / 2, y: r.top - sr.top + r.height / 2 };
      const body = Bodies.rectangle(s.base.x + s.x, s.base.y + s.y, r.width * 0.92, r.height * 0.62, {
        restitution: 0.3,
        friction: 0.35,
        frictionAir: 0.012,
        chamfer: { radius: 4 },
        angle: (s.r * Math.PI) / 180,
      });
      Body.setVelocity(body, { x: vx, y: vy });
      Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.25);
      Composite.add(engine.world, body);
      s.body = body;
      s.mode = "free";
    };

    const rebuild = () =>
      state.forEach((s) => {
        if (s.mode !== "free" || !s.body) return;
        Composite.remove(engine.world, s.body);
        s.body = null;
        s.mode = "return";
      });

    // Drag & throw loose letters. Only mouse: Matter's touch handlers call
    // preventDefault and would block page scroll on phones (tap still works).
    const mouse = Mouse.create(stage);
    const m = mouse as unknown as Record<string, EventListener>;
    const drop = (names: string[], handler: EventListener) =>
      names.forEach((n) => mouse.element.removeEventListener(n, handler));
    drop(["wheel", "mousewheel", "DOMMouseScroll"], m.mousewheel);
    drop(["touchmove"], m.mousemove);
    drop(["touchstart"], m.mousedown);
    drop(["touchend"], m.mouseup);
    const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.25, damping: 0.1 } });
    Composite.add(engine.world, mc);

    const onPointerDown = (e: PointerEvent) => {
      if (!isDone()) return;
      const i = letters.indexOf(e.target as HTMLSpanElement);
      if (i >= 0) detach(i, (Math.random() - 0.5) * 6, -6 - Math.random() * 4);
    };
    stage.addEventListener("pointerdown", onPointerDown);
    stage.addEventListener("dblclick", rebuild);
    window.addEventListener("resize", buildWalls);

    return {
      step: () => {
        if (!isDone()) rebuild();
        else if (pointer.active) {
          const speed = Math.hypot(pointer.vx, pointer.vy);
          if (speed > 14) {
            const radius = fontSizeOf(heading) * 0.8;
            letters.forEach((l, i) => {
              if (state[i].mode === "free") return;
              const c = centerOf(l, state[i].x, state[i].y);
              if (Math.hypot(c.x - pointer.x, c.y - pointer.y) < radius) {
                detach(i, pointer.vx * 0.45, pointer.vy * 0.45 - 3);
              }
            });
          }
        }

        Engine.update(engine, 1000 / 60);

        letters.forEach((l, i) => {
          const s = state[i];
          if (s.mode === "free" && s.body) {
            s.x = s.body.position.x - s.base.x;
            s.y = s.body.position.y - s.base.y;
            s.r = (s.body.angle * 180) / Math.PI;
          } else if (s.mode === "return") {
            s.x += -s.x * 0.12;
            s.y += -s.y * 0.12;
            // unwind to the nearest upright angle
            const target = Math.round(s.r / 360) * 360;
            s.r += (target - s.r) * 0.12;
            if (Math.abs(s.x) + Math.abs(s.y) < 0.3 && Math.abs(target - s.r) < 0.3) {
              s.mode = "rest";
              s.x = s.y = s.r = 0;
            }
          }
          l.style.transform =
            s.mode === "rest" ? "" : `translate3d(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px, 0) rotate(${s.r.toFixed(2)}deg)`;
        });
      },
      dispose: () => {
        stage.removeEventListener("pointerdown", onPointerDown);
        stage.removeEventListener("dblclick", rebuild);
        window.removeEventListener("resize", buildWalls);
        drop(["mousemove"], m.mousemove);
        drop(["mousedown"], m.mousedown);
        drop(["mouseup"], m.mouseup);
        Composite.clear(engine.world, false);
        Engine.clear(engine);
        letters.forEach((l) => (l.style.transform = ""));
      },
    };
  },
};

// ─── Masked filter overlay (shared by 4. Liquid, 7. Pixels, 8. Halftone) ────
// A filtered copy of the question sits over the original. Per-word masks
// reveal the filtered copy exactly over the word under the pointer (and hide
// the clean original there), fading in and out word by word.
const SVG_NS = "http://www.w3.org/2000/svg";

const maskedFilter = (opts: {
  /** Filter primitives; the <filter> wrapper and id are added for you. */
  primitives: string;
  /** Extra room around each word, in em — for effects that spill outside the glyphs. */
  padEm: number;
  /** Per-frame update of the filter nodes. k: 0–1 presence, speed in px/frame. */
  animate: (filter: SVGFilterElement, s: { k: number; speed: number; t: number; fontSize: number }) => void;
}) =>
  ({ letters, heading, stage, pointer, isDone }: EffectContext): Effect => {
    const filterId = `lab-fx-${Math.random().toString(36).slice(2, 8)}`;
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.setAttribute("aria-hidden", "true");
    svg.style.position = "absolute";
    svg.innerHTML = `<filter id="${filterId}" x="-20%" y="-40%" width="140%" height="180%" color-interpolation-filters="sRGB">${opts.primitives}</filter>`;
    stage.appendChild(svg);
    const filter = svg.querySelector("filter")!;

    let overlay: HTMLElement | null = null;
    const buildOverlay = () => {
      overlay = document.createElement("div");
      overlay.setAttribute("aria-hidden", "true");
      overlay.className = heading.className.replace("relative", "") + " absolute pointer-events-none";
      overlay.style.cssText = heading.style.cssText;
      heading.childNodes.forEach((n) => {
        if (n instanceof HTMLElement && n.classList.contains("lab-caret")) return;
        overlay!.appendChild(n.cloneNode(true));
      });
      overlay.querySelectorAll<HTMLElement>("span").forEach((s) => {
        s.style.opacity = "1";
        s.style.transform = "";
      });
      overlay.style.filter = `url(#${filterId})`;
      stage.appendChild(overlay);
    };

    type MaskLayer = { image: string; size: string; position: string };
    const setMask = (el: HTMLElement, layers: MaskLayer[] | null, exclude = false) => {
      const s = el.style as CSSStyleDeclaration & Record<string, string>;
      s.maskImage = s.webkitMaskImage = layers ? layers.map((l) => l.image).join(", ") : "";
      s.maskSize = s.webkitMaskSize = layers ? layers.map((l) => l.size).join(", ") : "";
      s.maskPosition = s.webkitMaskPosition = layers ? layers.map((l) => l.position).join(", ") : "";
      s.maskRepeat = s.webkitMaskRepeat = layers ? "no-repeat" : "";
      s.maskComposite = layers && exclude ? "exclude" : "";
      s.webkitMaskComposite = layers && exclude ? "xor" : "";
    };

    const words = groupWords(letters);
    const presence = words.map(() => 0);
    let speed = 0;
    let t = 0;

    return {
      step: () => {
        const done = isDone();
        if (done && !overlay) buildOverlay();
        if (!overlay) return;

        const fontSize = fontSizeOf(heading);
        const on = done && pointer.active;
        words.forEach((w, j) => {
          presence[j] += ((on && overWord(w, pointer, fontSize) ? 1 : 0) - presence[j]) * 0.14;
        });
        speed += (Math.hypot(pointer.vx, pointer.vy) - speed) * 0.2;
        t += 0.016;

        const k = Math.max(...presence);
        if (k < 0.01) {
          setMask(heading, null);
          overlay.style.visibility = "hidden";
          return;
        }
        overlay.style.left = `${heading.offsetLeft}px`;
        overlay.style.top = `${heading.offsetTop}px`;
        overlay.style.width = `${heading.offsetWidth}px`;
        overlay.style.margin = "0";
        overlay.style.visibility = "visible";
        opts.animate(filter, { k, speed, t, fontSize });

        const hr = heading.getBoundingClientRect();
        const pad = fontSize * opts.padEm;
        const layers: MaskLayer[] = [];
        words.forEach((w, j) => {
          const a = presence[j];
          if (a < 0.01) return;
          const r = w.el.getBoundingClientRect();
          const c = `rgba(0,0,0,${a.toFixed(3)})`;
          layers.push({
            image: `linear-gradient(${c}, ${c})`,
            size: `${(r.width + pad * 2).toFixed(1)}px ${(r.height + pad * 2).toFixed(1)}px`,
            position: `${(r.left - hr.left - pad).toFixed(1)}px ${(r.top - hr.top - pad).toFixed(1)}px`,
          });
        });
        setMask(overlay, layers);
        // Original: a full layer with the word boxes cut out of it.
        setMask(heading, [{ image: "linear-gradient(#000, #000)", size: "100% 100%", position: "0 0" }, ...layers], true);
      },
      dispose: () => {
        setMask(heading, null);
        overlay?.remove();
        svg.remove();
        letters.forEach((l) => (l.style.transform = ""));
      },
    };
  };

// ─── 4. Liquid ink ──────────────────────────────────────────────────────────
// Big, slow turbulence waves melt the letters under the cursor; moving fast
// churns the ink much harder.
const liquid: EffectDef = {
  id: 4,
  name: "Liquid ink",
  hint: "Hover a word — faster means wilder",
  create: maskedFilter({
    padEm: 0.45,
    primitives: `
      <feTurbulence type="fractalNoise" baseFrequency="0.008 0.02" numOctaves="2" seed="4" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" />`,
    animate: (filter, { k, speed, t, fontSize }) => {
      const turbulence = filter.querySelector("feTurbulence")!;
      const displacement = filter.querySelector("feDisplacementMap")!;
      turbulence.setAttribute(
        "baseFrequency",
        `${(0.007 + Math.sin(t * 1.1) * 0.003).toFixed(4)} ${(0.018 + Math.cos(t * 0.8) * 0.006).toFixed(4)}`,
      );
      const amount = k * Math.min(fontSize * 0.55 + speed * 4, fontSize * 1.8);
      displacement.setAttribute("scale", amount.toFixed(1));
    },
  }),
};

// ─── 5. Magnet ──────────────────────────────────────────────────────────────
// Nearby letters are pulled toward the cursor on springs of slightly
// different stiffness, so they trail behind it like an elastic swarm.
const magnet: EffectDef = {
  id: 5,
  name: "Magnet",
  hint: "Hover and drag the cursor around",
  create: ({ letters, heading, pointer, isDone }) => {
    const state = letters.map((_, i) => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      s: 1,
      k: 0.045 + (((i * 37) % 10) / 10) * 0.05,
    }));

    return {
      step: () => {
        const fs = fontSizeOf(heading);
        const radius = fs * 3.6;
        const on = isDone() && pointer.active;
        letters.forEach((l, i) => {
          const st = state[i];
          let tx = 0;
          let ty = 0;
          let pull = 0;
          if (on) {
            const c = centerOf(l, st.x, st.y);
            const dx = pointer.x - c.x;
            const dy = pointer.y - c.y;
            const d = Math.hypot(dx, dy);
            if (d < radius) {
              pull = (1 - d / radius) ** 1.4 * 0.8;
              tx = dx * pull;
              ty = dy * pull;
            }
          }
          st.vx = (st.vx + (tx - st.x) * st.k) * 0.84;
          st.vy = (st.vy + (ty - st.y) * st.k) * 0.84;
          st.x += st.vx;
          st.y += st.vy;
          st.s += (1 + pull * 0.35 - st.s) * 0.12;
          const tilt = Math.max(-25, Math.min(25, st.vx * 1.6));
          l.style.transform = `translate3d(${st.x.toFixed(2)}px, ${st.y.toFixed(2)}px, 0) rotate(${tilt.toFixed(2)}deg) scale(${st.s.toFixed(3)})`;
        });
      },
      dispose: () => letters.forEach((l) => (l.style.transform = "")),
    };
  },
};

// ─── 6. Styles ──────────────────────────────────────────────────────────────
// Like Languages, but the letters of the hovered word flick through
// typographic voices — italic, black, hairline, grotesk, mono, didone —
// before settling back. Every voice is shifted onto Platypi's baseline
// (measured per font), so nothing jumps.
const STYLES: Partial<CSSStyleDeclaration>[] = [
  { fontFamily: "'Platypi', serif", fontStyle: "italic", fontWeight: "300" },
  { fontFamily: "'Platypi', serif", fontStyle: "normal", fontWeight: "800" },
  { fontFamily: "'Platypi', serif", fontStyle: "italic", fontWeight: "800" },
  { fontFamily: "'Platypi', serif", fontStyle: "normal", fontWeight: "300" },
  { fontFamily: "'Inter', sans-serif", fontStyle: "normal", fontWeight: "900" },
  { fontFamily: "'Inter', sans-serif", fontStyle: "normal", fontWeight: "300" },
  { fontFamily: "'IBM Plex Mono', monospace", fontStyle: "normal", fontWeight: "500" },
  { fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: "400" },
  { fontFamily: "'Bodoni Moda', serif", fontStyle: "italic", fontWeight: "700" },
  { fontFamily: "'Bodoni Moda', serif", fontStyle: "normal", fontWeight: "900" },
];
const STYLE_KEYS = ["fontFamily", "fontStyle", "fontWeight"] as const;

/** Distance from the top of a line box to the baseline, for a given voice. */
const baselineOf = (host: HTMLElement, lineHeight: number, style?: Partial<CSSStyleDeclaration>) => {
  const probe = document.createElement("span");
  probe.style.cssText = `position:absolute;visibility:hidden;left:0;top:0;display:inline-block;height:${lineHeight}px;line-height:${lineHeight}px;white-space:nowrap`;
  if (style) STYLE_KEYS.forEach((key) => (probe.style[key] = style[key] as string));
  probe.textContent = "H";
  const marker = document.createElement("span");
  marker.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
  probe.appendChild(marker);
  host.appendChild(probe);
  const baseline = marker.offsetTop;
  probe.remove();
  return baseline;
};

const styles: EffectDef = {
  id: 6,
  name: "Styles",
  hint: "Hover a word",
  create: (ctx) => {
    // Baseline offsets per voice, cached per line height (i.e. per breakpoint)
    // and invalidated once the web fonts finish loading.
    let cacheKey = "";
    let offsets: number[] = [];
    const offsetFor = (l: HTMLSpanElement, n: number) => {
      const lh = l.offsetHeight;
      const key = `${lh}`;
      if (key !== cacheKey) {
        const base = baselineOf(ctx.heading, lh);
        offsets = STYLES.map((s) => base - baselineOf(ctx.heading, lh, s));
        cacheKey = key;
      }
      return offsets[n];
    };
    const invalidate = () => (cacheKey = "");
    document.fonts.addEventListener("loadingdone", invalidate);
    STYLES.forEach((s) => document.fonts.load(`${s.fontStyle} ${s.fontWeight} 40px ${s.fontFamily}`).catch(() => {}));

    return hoverCycle({
      intervalMs: [80, 140],
      settleMs: 650,
      staggerMs: 45,
      begin: () => ({ last: -1 }),
      apply: (l, _i, burst) => {
        const b = burst as { last: number };
        let n = Math.floor(Math.random() * STYLES.length);
        if (n === b.last) n = (n + 1) % STYLES.length;
        b.last = n;
        STYLE_KEYS.forEach((key) => (l.style[key] = STYLES[n][key] as string));
        l.style.transform = `translate3d(0, ${offsetFor(l, n).toFixed(2)}px, 0)`;
      },
      restore: (l) => {
        STYLE_KEYS.forEach((key) => (l.style[key] = ""));
        l.style.transform = "";
      },
      dispose: () => document.fonts.removeEventListener("loadingdone", invalidate),
    })(ctx);
  },
};

// ─── 7. Pixels ──────────────────────────────────────────────────────────────
// The letters under the cursor are resampled into a coarse pixel grid; the
// faster you move, the chunkier the pixels get.
const pixels: EffectDef = {
  id: 7,
  name: "Pixels",
  hint: "Hover a word — faster means chunkier",
  create: maskedFilter({
    padEm: 0.12,
    primitives: `
      <feFlood x="4" y="4" width="2" height="2" />
      <feComposite width="10" height="10" />
      <feTile result="grid" />
      <feComposite in="SourceGraphic" in2="grid" operator="in" />
      <feMorphology operator="dilate" radius="5" />`,
    animate: (filter, { k, speed, fontSize }) => {
      // Even block size keeps the sample dot centred in each block.
      const size = Math.max(2, Math.round((fontSize * 0.07 + speed * 0.6) * k / 2) * 2);
      const flood = filter.querySelector("feFlood")!;
      const tileSource = filter.querySelectorAll("feComposite")[0];
      const dilate = filter.querySelector("feMorphology")!;
      flood.setAttribute("x", String(size / 2 - 1));
      flood.setAttribute("y", String(size / 2 - 1));
      tileSource.setAttribute("width", String(size));
      tileSource.setAttribute("height", String(size));
      dilate.setAttribute("radius", String(size / 2));
    },
  }),
};

// ─── 8. Halftone ────────────────────────────────────────────────────────────
// Print-style black & white halftone under the cursor: the letters are
// blurred into a tone map and re-drawn as a dot screen (bigger dots where
// there's more ink). Moving fast opens the screen into coarser dots.
const DOT_CELL = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><defs><radialGradient id="g"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><circle cx="5" cy="5" r="5" fill="url(#g)"/></svg>`,
);

const halftone: EffectDef = {
  id: 8,
  name: "Halftone",
  hint: "Hover a word — faster means coarser dots",
  create: maskedFilter({
    padEm: 0.12,
    primitives: `
      <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="tone" />
      <feImage href="data:image/svg+xml,${DOT_CELL}" x="0" y="0" width="10" height="10" preserveAspectRatio="none" result="cell" />
      <feTile in="cell" result="screen" />
      <feComposite in="tone" in2="screen" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="dots" />
      <feComponentTransfer in="dots">
        <feFuncR type="linear" slope="0" intercept="1" />
        <feFuncG type="linear" slope="0" intercept="1" />
        <feFuncB type="linear" slope="0" intercept="1" />
        <feFuncA type="linear" slope="12" intercept="-2.4" />
      </feComponentTransfer>`,
    animate: (filter, { k, speed, fontSize }) => {
      const cell = Math.max(6, Math.round(fontSize * 0.15 + speed * 0.5));
      const image = filter.querySelector("feImage")!;
      image.setAttribute("width", String(cell));
      image.setAttribute("height", String(cell));
      // Blur scales with the cell so the dots still trace the letterforms.
      filter.querySelector("feGaussianBlur")!.setAttribute("stdDeviation", (cell * 0.22 * k).toFixed(2));
    },
  }),
};

// ─── 9. Dots ────────────────────────────────────────────────────────────────
// Hovering a word turns it into a dot matrix of itself: the dots gather in
// from a loose cloud, breathe to a beat and get pushed around by the
// pointer; leaving the word melts them back into solid type.
type Dot = { hx: number; hy: number; sx: number; sy: number; phase: number; ox: number; oy: number; vx: number; vy: number };
type DotWord = { k: number; dots: Dot[]; key: string };

/** Dot positions (viewport px) covering a word's glyphs, rendered with its own computed font. */
const sampleWordDots = (word: HTMLElement, fontSize: number): { dots: Dot[]; key: string } => {
  const rect = word.getBoundingClientRect();
  const cs = getComputedStyle(word.firstElementChild ?? word);
  const text = cs.textTransform === "uppercase" ? (word.textContent ?? "").toUpperCase() : word.textContent ?? "";

  // Baseline of the word, via a zero-size marker sitting on it.
  const marker = document.createElement("span");
  marker.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
  word.appendChild(marker);
  const baseline = marker.getBoundingClientRect().top - rect.top;
  marker.remove();

  const pad = Math.ceil(fontSize * 0.3);
  const w = Math.ceil(rect.width) + pad * 2;
  const h = Math.ceil(rect.height) + pad * 2;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  (g as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
  g.fillStyle = "#fff";
  g.textBaseline = "alphabetic";
  g.fillText(text, pad, pad + baseline);

  const step = Math.max(4, Math.round(fontSize / 13));
  const data = g.getImageData(0, 0, w, h).data;
  const dots: Dot[] = [];
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (data[(y * w + x) * 4 + 3] < 128) continue;
      const a = Math.random() * Math.PI * 2;
      const r = fontSize * (0.25 + Math.random() * 0.55);
      dots.push({
        hx: rect.left - pad + x,
        hy: rect.top - pad + y,
        sx: Math.cos(a) * r,
        sy: Math.sin(a) * r,
        phase: Math.random() * Math.PI * 2,
        ox: 0,
        oy: 0,
        vx: 0,
        vy: 0,
      });
    }
  }
  return { dots, key: `${Math.round(rect.left)},${Math.round(rect.top)},${Math.round(rect.width)},${fontSize}` };
};

const dotsEffect: EffectDef = {
  id: 9,
  name: "Dots",
  hint: "Hover a word",
  create: ({ letters, heading, stage, pointer, isDone }) => {
    const words = groupWords(letters);
    const state: DotWord[] = words.map(() => ({ k: 0, dots: [], key: "" }));
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5";
    stage.appendChild(canvas);
    const BEAT = 60 / 96;

    return {
      step: () => {
        const fs = fontSizeOf(heading);
        const on = isDone() && pointer.active;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const cw = stage.clientWidth;
        const ch = stage.clientHeight;
        if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
          canvas.width = Math.round(cw * dpr);
          canvas.height = Math.round(ch * dpr);
        }
        const g = canvas.getContext("2d")!;
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.clearRect(0, 0, cw, ch);
        const sr = stage.getBoundingClientRect();
        const t = performance.now() / 1000;
        const pulse = Math.exp(-((t % BEAT) / BEAT) * 5);
        const radius = Math.max(4, Math.round(fs / 13)) * 0.42;

        words.forEach((w, j) => {
          const s = state[j];
          const hovered = on && overWord(w, pointer, fs);
          s.k += ((hovered ? 1 : 0) - s.k) * (hovered ? 0.16 : 0.1);
          if (s.k < 0.01) {
            s.k = 0;
            w.el.style.opacity = "";
            return;
          }
          if (!s.dots.length || hovered) {
            const r = w.el.getBoundingClientRect();
            const key = `${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.width)},${fs}`;
            if (key !== s.key) Object.assign(s, sampleWordDots(w.el, fs));
          }
          // Solid type fades out as the dots take over (and back in after).
          w.el.style.opacity = Math.max(0, 1 - s.k * 1.6).toFixed(3);

          const gather = smoothstep(Math.min(1, s.k * 1.15));
          g.fillStyle = "#fff";
          for (const d of s.dots) {
            let fx = 0;
            let fy = 0;
            const x0 = d.hx + d.sx * (1 - gather);
            const y0 = d.hy + d.sy * (1 - gather);
            if (hovered) {
              const dx = x0 + d.ox - pointer.x;
              const dy = y0 + d.oy - pointer.y;
              const dist = Math.hypot(dx, dy);
              const reach = fs * 0.9;
              if (dist < reach && dist > 0.1) {
                const f = (1 - dist / reach) ** 2 * fs * 0.35;
                fx = (dx / dist) * f;
                fy = (dy / dist) * f;
              }
            }
            d.vx = (d.vx + (fx - d.ox) * 0.12) * 0.8;
            d.vy = (d.vy + (fy - d.oy) * 0.12) * 0.8;
            d.ox += d.vx;
            d.oy += d.vy;
            const breathe = 1 + pulse * 0.35 * Math.sin(d.phase + t);
            g.globalAlpha = Math.min(1, s.k * 1.3);
            g.beginPath();
            g.arc(x0 + d.ox - sr.left, y0 + d.oy - sr.top, radius * breathe, 0, Math.PI * 2);
            g.fill();
          }
        });
        g.globalAlpha = 1;
      },
      dispose: () => {
        canvas.remove();
        words.forEach((w) => (w.el.style.opacity = ""));
      },
    };
  },
};

export const EFFECTS: EffectDef[] = [inkLens, languages, physics, liquid, magnet, styles, pixels, halftone, dotsEffect];

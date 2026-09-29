import Matter from "matter-js";
import { ARCHIVE } from "@/components/lab-essay/archive";
import { fontSizeOf, groupWords, overWord, smoothstep, type Effect, type EffectContext, type EffectDef, type Word } from "./effects";

/**
 * Word-level reactions: the hovered word responds as a single unit — it's
 * rewritten, filled with work, echoed, re-weighted, attracted, inked or
 * turned into falling pieces. Same contract as ./effects (step + dispose,
 * restoring every style they touch).
 */

/** Per-word hover presence (0–1), eased, plus enter edges. */
const hoverTracker = ({ heading, pointer, isDone }: EffectContext, words: Word[], rate = 0.14) => {
  const k = words.map(() => 0);
  const over = words.map(() => false);
  return (onEnter?: (j: number) => void) => {
    const fs = fontSizeOf(heading);
    const on = isDone() && pointer.active;
    words.forEach((w, j) => {
      const now = on && overWord(w, pointer, fs);
      if (now && !over[j]) onEnter?.(j);
      over[j] = now;
      k[j] += ((now ? 1 : 0) - k[j]) * rate;
      if (k[j] < 0.002) k[j] = 0;
    });
    return { k, over, fs };
  };
};

const lettersOf = (ctx: EffectContext, w: Word) => w.idx.map((i) => ctx.letters[i]);

// ─── 1. Rewrite (and 8. Question) ──────────────────────────────────────────
// The whole question rewrites itself into the next hand-written variant —
// always a sentence that makes sense. Only the words that change roll over
// (in a quick cascade), so the sentence reads as pieces swapping.
const SENTENCES = [
  ["what", "if", "the", "words", "react", "to", "the", "mouse?"],
  ["what", "if", "the", "sounds", "listen", "to", "the", "body?"],
  ["what", "if", "the", "shapes", "move", "with", "the", "hand?"],
  ["what", "if", "the", "letters", "play", "with", "the", "light?"],
  ["what", "if", "the", "images", "respond", "to", "the", "touch?"],
];
const ROLL_MS = 520;
const ROLL_STAGGER_MS = 70;
const ROLL_EASE = "cubic-bezier(.2,.8,.2,1)";
/** Scroll mode: minimum time a question stays before the next rewrite. */
const DWELL_MS = 900;

type RewriteOptions = {
  /**
   * What rewrites the question: entering a word, clicking/tapping one, or
   * the scroll itself (one question per `scroll.stepVh` of scrolling).
   */
  trigger: "hover" | "click" | "scroll";
  /** Scroll mode: scrolled vh (into the pinned wrapper) where the rewrites start, and vh per question. */
  scroll?: { startVh: number; stepVh: number };
  /** Hovered word also thins from black to hairline (the Weight effect). */
  weight?: boolean;
  /** Show a small "01 / 05" counter under the question. */
  counter?: boolean;
  /** Rewrite on its own after this long without interaction (ms). */
  idleMs?: number;
  /** On touch screens, a small line under the question inviting a tap. */
  touchHint?: string;
};

export const makeRewrite =
  (opts: RewriteOptions) =>
  (ctx: EffectContext): Effect => {
    const words = groupWords(ctx.letters);
    const track = hoverTracker(ctx, words, 0.1);
    const original = words.map((w) => (w.el.textContent ?? "").toLowerCase());
    // Only rewrite questions that match the sentence shape.
    const usable = SENTENCES[0].length === words.length && SENTENCES[0].every((t, j) => t === original[j]);
    type S = { alt: HTMLSpanElement | null; baseW: number; text: string; rollingUntil: number };
    const state: S[] = words.map((_, j) => ({ alt: null, baseW: 0, text: original[j], rollingUntil: 0 }));
    const timers: number[] = [];
    let sentence = 0;
    let lastSwap = 0;
    let lastActivity = performance.now();

    // Counter (and, for click mode, the invitation to use it).
    let counter: HTMLParagraphElement | null = null;
    const touch = window.matchMedia("(hover: none)").matches;
    if (opts.counter && usable) {
      counter = document.createElement("p");
      counter.setAttribute("aria-live", "polite");
      counter.style.cssText =
        "margin-top:2.25rem;font:400 13px/1.4 Inter,sans-serif;color:hsl(var(--foreground) / 0.6);font-variant-numeric:tabular-nums;opacity:0;transition:opacity .5s ease";
      ctx.stage.appendChild(counter);
    }
    const renderCounter = () => {
      if (!counter) return;
      const n = String(sentence + 1).padStart(2, "0");
      const total = String(SENTENCES.length).padStart(2, "0");
      const hint = opts.trigger === "click" ? ` · ${touch ? "tap" : "click"} a word to ask another` : "";
      counter.textContent = `${n} / ${total}${hint}`;
    };
    renderCounter();

    const roll = (el: HTMLElement, from: string, to: string, delay: number) => {
      el.style.transition = "none";
      el.style.transform = from;
      void el.offsetWidth;
      el.style.transition = `transform ${ROLL_MS}ms ${ROLL_EASE} ${delay}ms`;
      el.style.transform = to;
    };

    /**
     * Roll word j over to `text` (the original text brings its letters back).
     * dir 1 rolls upwards (forwards), -1 downwards (back).
     */
    const swapTo = (j: number, text: string, delay: number, dir: 1 | -1 = 1) => {
      const w = words[j];
      const s = state[j];
      if (s.text === text) return;
      const el = w.el;
      const originals = lettersOf(ctx, w);
      if (!s.baseW) s.baseW = el.offsetWidth;
      const fromW = el.offsetWidth;
      el.style.position = "relative";
      el.style.clipPath = "inset(0 -0.6em)";
      el.style.verticalAlign = "top";

      const leaving = s.alt;
      const outgoing: HTMLElement[] = leaving ? [leaving] : originals;
      let incoming: HTMLElement[];
      let toW: number;
      if (text === original[j]) {
        originals.forEach((l) => (l.style.visibility = ""));
        incoming = originals;
        el.style.width = "";
        toW = el.offsetWidth;
        s.alt = null;
      } else {
        const sp = document.createElement("span");
        sp.textContent = text;
        sp.style.cssText = "position:absolute;left:0;top:0;display:inline-block;white-space:nowrap";
        el.appendChild(sp);
        incoming = [sp];
        toW = sp.offsetWidth;
        s.alt = sp;
      }
      s.text = text;
      s.rollingUntil = performance.now() + ROLL_MS + delay + 30;

      outgoing.forEach((o) => roll(o, "translateY(0)", `translateY(${-105 * dir}%)`, delay));
      incoming.forEach((o) => roll(o, `translateY(${105 * dir}%)`, "translateY(0)", delay));
      el.style.transition = "none";
      el.style.width = `${fromW}px`;
      void el.offsetWidth;
      el.style.transition = `width ${ROLL_MS}ms ${ROLL_EASE} ${delay}ms`;
      el.style.width = `${toW}px`;

      timers.push(
        window.setTimeout(() => {
          leaving?.remove();
          if (s.alt) originals.forEach((l) => (l.style.visibility = "hidden"));
          else {
            el.style.width = "";
            el.style.transition = "";
          }
        }, ROLL_MS + delay + 30),
      );
    };

    const goTo = (index: number, dir: 1 | -1, guardMs = ROLL_MS + ROLL_STAGGER_MS * 4 + 120) => {
      if (!usable || performance.now() - lastSwap < guardMs) return;
      sentence = index;
      let changed = 0;
      SENTENCES[sentence].forEach((text, j) => {
        if (state[j].text !== text) swapTo(j, text, changed++ * ROLL_STAGGER_MS, dir);
      });
      lastSwap = performance.now();
      lastActivity = lastSwap;
      renderCounter();
    };
    const next = () => goTo((sentence + 1) % SENTENCES.length, 1);

    // Back to the original question at once — also mid-roll: cancel pending
    // clean-ups and drop every rolled-in/rolling-out word, not just the
    // current one, so nothing is left stuck half-way.
    const restore = () => {
      sentence = 0;
      renderCounter();
      timers.forEach(clearTimeout);
      timers.length = 0;
      lastSwap = 0;
      words.forEach((w, j) => {
        const s = state[j];
        w.el.querySelectorAll(":scope > span:not(.inline-block)").forEach((n) => n.remove());
        s.alt = null;
        s.rollingUntil = 0;
        s.text = original[j];
        lettersOf(ctx, w).forEach((l) => {
          l.style.visibility = "";
          l.style.transform = "";
          l.style.transition = "";
        });
        ["position", "clipPath", "verticalAlign", "width", "transition", "fontWeight", "letterSpacing"].forEach(
          (k) => (w.el.style[k as "width"] = ""),
        );
      });
    };

    // Click mode: any click on a word. On touch screens there's no hover, and
    // dragging a finger across the words means scrolling — so there a tap
    // anywhere on the question (a real click, never a scroll) rewrites it.
    const onDown = (e: PointerEvent) => {
      if (opts.trigger !== "click" || !ctx.isDone()) return;
      if (words.some((w) => w.el.contains(e.target as Node))) next();
    };
    const onTap = () => {
      if (opts.trigger === "hover" && touch && ctx.isDone()) next();
    };
    ctx.stage.addEventListener("pointerdown", onDown);
    ctx.heading.addEventListener("click", onTap);

    // Touch hint lives inside the heading so it fades out with it.
    let hint: HTMLSpanElement | null = null;
    if (touch && opts.touchHint && usable) {
      hint = document.createElement("span");
      hint.setAttribute("aria-hidden", "true");
      hint.textContent = opts.touchHint;
      hint.style.cssText =
        "position:absolute;left:0;right:0;top:100%;margin-top:1.75rem;font:400 13px/1.4 Inter,sans-serif;text-transform:none;letter-spacing:0;color:hsl(var(--foreground) / 0.6);opacity:0;transition:opacity .5s ease;pointer-events:none";
      ctx.heading.appendChild(hint);
    }

    let wasDone = false;
    return {
      step: () => {
        const done = ctx.isDone();
        if (wasDone && !done) restore();
        if (!wasDone && done) lastActivity = performance.now();
        wasDone = done;
        if (counter) counter.style.opacity = done ? "1" : "0";
        if (hint) hint.style.opacity = done ? "1" : "0";

        // Scroll mode: the scroll position picks the question, but the
        // animation keeps its own pace — a question never changes sooner
        // than DWELL_MS after the last one. Scrolling faster than that skips
        // the in-between questions and lands straight on the one for where
        // you are, so fast scrollers aren't slowed down and nothing flickers.
        if (opts.trigger === "scroll" && opts.scroll && done && usable) {
          const section = ctx.stage.parentElement as HTMLElement;
          const sVh = (-section.getBoundingClientRect().top / window.innerHeight) * 100;
          const target = Math.min(Math.max(Math.floor((sVh - opts.scroll.startVh) / opts.scroll.stepVh) + 1, 0), SENTENCES.length - 1);
          if (target !== sentence) goTo(target, target > sentence ? 1 : -1, DWELL_MS);
        }

        const { k, over } = track(() => {
          lastActivity = performance.now();
          if (opts.trigger === "hover" && !touch) next();
        });
        if (over.some(Boolean)) lastActivity = performance.now();

        // Weight on hover: set on the word so rolled-in text inherits it.
        if (opts.weight) {
          words.forEach((w, j) => {
            const e = smoothstep(k[j]);
            w.el.style.fontWeight = e === 0 ? "" : String(Math.round(900 - 750 * e));
            w.el.style.letterSpacing = e === 0 ? "" : `${(0.03 * e).toFixed(3)}em`;
            // A rewritten word keeps its box in sync with its (changing) width.
            const s = state[j];
            if (s.alt && performance.now() > s.rollingUntil) {
              w.el.style.transition = "none";
              w.el.style.width = `${s.alt.offsetWidth}px`;
            }
          });
        }

        if (opts.idleMs && done && usable && performance.now() - lastActivity > opts.idleMs) next();
      },
      dispose: () => {
        ctx.stage.removeEventListener("pointerdown", onDown);
        ctx.heading.removeEventListener("click", onTap);
        timers.forEach(clearTimeout);
        restore();
        counter?.remove();
        hint?.remove();
      },
    };
  };

const rewrite: EffectDef = {
  id: 1,
  name: "Rewrite",
  hint: "Hover a word — the question rewrites itself",
  create: makeRewrite({ trigger: "hover", touchHint: "Tap the question to ask another." }),
};

const question: EffectDef = {
  id: 8,
  name: "Question",
  hint: "Hover a word to lighten it · click (or tap) to ask another · or just wait",
  create: makeRewrite({ trigger: "click", weight: true, counter: true, idleMs: 4500 }),
};

// ─── 2. Reveal ──────────────────────────────────────────────────────────────
// The word becomes a window: a piece from the Lab archive shows through its
// letters (the type is the mask), panning gently with the pointer, with a
// small caption naming the piece.
const REVEAL_IMAGES = ARCHIVE.flatMap((a) => (a.media.kind === "image" ? [{ src: a.media.src, title: a.title }] : []));

const reveal: EffectDef = {
  id: 2,
  name: "Reveal",
  hint: "Hover a word — it fills with work",
  create: (ctx) => {
    const words = groupWords(ctx.letters);
    const track = hoverTracker(ctx, words, 0.12);
    const caption = document.createElement("div");
    caption.style.cssText =
      "position:absolute;left:0;top:0;z-index:6;pointer-events:none;font:400 12px/1.3 Inter,sans-serif;color:hsl(var(--foreground));opacity:0;white-space:nowrap";
    ctx.stage.appendChild(caption);
    const primed = words.map(() => false);
    const imageFor = (j: number) => REVEAL_IMAGES[j % REVEAL_IMAGES.length];

    const prime = (j: number) => {
      const w = words[j];
      const img = imageFor(j);
      lettersOf(ctx, w).forEach((l) => {
        l.style.backgroundImage = `url("${img.src}")`;
        l.style.backgroundRepeat = "no-repeat";
        l.style.webkitBackgroundClip = "text";
        l.style.backgroundClip = "text";
        l.style.transition = "color .45s ease";
      });
      primed[j] = true;
    };

    return {
      step: () => {
        const { k, over } = track();
        const sr = ctx.stage.getBoundingClientRect();
        let captionK = 0;
        words.forEach((w, j) => {
          if (k[j] === 0 && !primed[j]) return;
          if (!primed[j]) prime(j);
          const W = w.el.offsetWidth;
          const H = w.el.offsetHeight;
          const S = Math.max(W, H) * 1.25;
          const r = w.el.getBoundingClientRect();
          const px = ((ctx.pointer.x - (r.left + W / 2)) / W) * S * 0.08;
          const py = ((ctx.pointer.y - (r.top + H / 2)) / H) * S * 0.08;
          lettersOf(ctx, w).forEach((l) => {
            const x = l.offsetLeft - w.el.offsetLeft;
            l.style.backgroundSize = `${S}px ${S}px`;
            l.style.backgroundPosition = `${(-x - (S - W) / 2 - px).toFixed(1)}px ${(-(S - H) / 2 - py).toFixed(1)}px`;
            l.style.color = over[j] ? "transparent" : "";
          });
          if (k[j] > captionK) {
            captionK = k[j];
            caption.textContent = imageFor(j).title;
          }
        });
        caption.style.opacity = captionK.toFixed(3);
        caption.style.transform = `translate(${(ctx.pointer.x - sr.left + 18).toFixed(0)}px, ${(ctx.pointer.y - sr.top + 20).toFixed(0)}px)`;
      },
      dispose: () => {
        caption.remove();
        ctx.letters.forEach((l) => {
          ["backgroundImage", "backgroundRepeat", "backgroundSize", "backgroundPosition", "backgroundClip", "webkitBackgroundClip", "color", "transition"].forEach(
            (key) => (l.style[key as "color"] = ""),
          );
        });
      },
    };
  },
};

// ─── 3. Echo ────────────────────────────────────────────────────────────────
// Printed again and again: outlined copies of the hovered word fan out behind
// it, trailing the direction the pointer moves — a screen-print repeat.
const ECHO_COPIES = 5;

const echo: EffectDef = {
  id: 3,
  name: "Echo",
  hint: "Hover and move across a word",
  create: (ctx) => {
    const words = groupWords(ctx.letters);
    const track = hoverTracker(ctx, words, 0.12);
    const copies: HTMLElement[][] = words.map(() => []);
    let dx = 0.6;
    let dy = 0.8;

    const build = (j: number) => {
      const w = words[j];
      w.el.style.position = "relative";
      w.el.style.zIndex = "1";
      for (let i = 1; i <= ECHO_COPIES; i++) {
        const c = w.el.cloneNode(true) as HTMLElement;
        c.setAttribute("aria-hidden", "true");
        c.querySelectorAll<HTMLElement>("*").forEach((n) => n.removeAttribute("style"));
        c.style.cssText = `position:absolute;left:${w.el.offsetLeft}px;top:${w.el.offsetTop}px;margin:0;z-index:0;pointer-events:none;color:transparent;-webkit-text-stroke:max(1px, 0.012em) hsl(var(--foreground));white-space:nowrap`;
        ctx.heading.appendChild(c);
        copies[j].push(c);
      }
    };

    return {
      step: () => {
        const { k, fs } = track();
        const v = Math.hypot(ctx.pointer.vx, ctx.pointer.vy);
        if (v > 1.5) {
          dx += (-ctx.pointer.vx / v - dx) * 0.08;
          dy += (-ctx.pointer.vy / v - dy) * 0.08;
        }
        const n = Math.hypot(dx, dy) || 1;
        words.forEach((w, j) => {
          if (k[j] > 0 && !copies[j].length) build(j);
          if (!copies[j].length) return;
          if (k[j] === 0) {
            copies[j].forEach((c) => c.remove());
            copies[j] = [];
            w.el.style.position = "";
            w.el.style.zIndex = "";
            return;
          }
          const e = smoothstep(k[j]);
          copies[j].forEach((c, i) => {
            const d = (i + 1) * fs * 0.085 * e;
            c.style.left = `${w.el.offsetLeft}px`;
            c.style.top = `${w.el.offsetTop}px`;
            c.style.transform = `translate(${((dx / n) * d).toFixed(1)}px, ${((dy / n) * d).toFixed(1)}px)`;
            c.style.opacity = (e * (1 - i / (ECHO_COPIES + 1)) * 0.9).toFixed(3);
          });
        });
      },
      dispose: () => {
        copies.flat().forEach((c) => c.remove());
        words.forEach((w) => {
          w.el.style.position = "";
          w.el.style.zIndex = "";
        });
      },
    };
  },
};

// ─── 4. Weight ──────────────────────────────────────────────────────────────
// The whole word breathes out: black thins to hairline (variable Inter), the
// line re-centring around it as it lightens.
const weight: EffectDef = {
  id: 4,
  name: "Weight",
  hint: "Hover a word",
  create: (ctx) => {
    const words = groupWords(ctx.letters);
    const track = hoverTracker(ctx, words, 0.1);
    return {
      step: () => {
        const { k } = track();
        words.forEach((w, j) => {
          const e = smoothstep(k[j]);
          const ls = lettersOf(ctx, w);
          if (e === 0) {
            ls.forEach((l) => (l.style.fontWeight = ""));
            w.el.style.letterSpacing = "";
            return;
          }
          ls.forEach((l) => (l.style.fontWeight = String(Math.round(900 - 750 * e))));
          w.el.style.letterSpacing = `${(0.03 * e).toFixed(3)}em`;
        });
      },
      dispose: () => {
        ctx.letters.forEach((l) => (l.style.fontWeight = ""));
        words.forEach((w) => (w.el.style.letterSpacing = ""));
      },
    };
  },
};

// ─── 5. Magnet ──────────────────────────────────────────────────────────────
// Whole words are drawn toward the pointer and spring back — the sentence
// leans into your hand.
const magnetWord: EffectDef = {
  id: 5,
  name: "Magnet",
  hint: "Move near the words",
  create: (ctx) => {
    const words = groupWords(ctx.letters);
    const st = words.map(() => ({ x: 0, y: 0, vx: 0, vy: 0 }));
    return {
      step: () => {
        const fs = fontSizeOf(ctx.heading);
        const on = ctx.isDone() && ctx.pointer.active;
        // Only the word nearest the pointer is attracted — neighbours stay put.
        let nearest = -1;
        let best = Infinity;
        if (on) {
          words.forEach((w, j) => {
            const r = w.el.getBoundingClientRect();
            const d = Math.hypot(ctx.pointer.x - (r.left + r.width / 2 - st[j].x), ctx.pointer.y - (r.top + r.height / 2 - st[j].y));
            if (d < best) {
              best = d;
              nearest = j;
            }
          });
        }
        words.forEach((w, j) => {
          const s = st[j];
          const r = w.el.getBoundingClientRect();
          const cx = r.left + r.width / 2 - s.x;
          const cy = r.top + r.height / 2 - s.y;
          let tx = 0;
          let ty = 0;
          if (on && j === nearest) {
            const dxp = ctx.pointer.x - cx;
            const dyp = ctx.pointer.y - cy;
            const reachX = r.width / 2 + fs * 0.5;
            const reachY = r.height / 2 + fs * 0.25;
            if (Math.abs(dxp) < reachX && Math.abs(dyp) < reachY) {
              // Gentle and capped, so neighbouring words never collide.
              const f = (1 - Math.abs(dxp) / reachX) * (1 - Math.abs(dyp) / reachY);
              const max = fs * 0.18;
              tx = Math.max(-max, Math.min(max, dxp * 0.14 * (0.5 + f)));
              ty = Math.max(-max, Math.min(max, dyp * 0.14 * (0.5 + f)));
            }
          }
          s.vx = (s.vx + (tx - s.x) * 0.09) * 0.8;
          s.vy = (s.vy + (ty - s.y) * 0.09) * 0.8;
          s.x += s.vx;
          s.y += s.vy;
          const rot = (s.x / fs) * 4;
          w.el.style.transform =
            Math.abs(s.x) + Math.abs(s.y) < 0.05 ? "" : `translate3d(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg)`;
        });
      },
      dispose: () => words.forEach((w) => (w.el.style.transform = "")),
    };
  },
};

// ─── 6. Ink ─────────────────────────────────────────────────────────────────
// A marker stroke sweeps across the hovered word and inverts it (difference
// blend: white ink, black type); leaving, the ink wipes off the other way.
const SVG_NS = "http://www.w3.org/2000/svg";

const ink: EffectDef = {
  id: 6,
  name: "Ink",
  hint: "Hover a word",
  create: (ctx) => {
    const words = groupWords(ctx.letters);
    const track = hoverTracker(ctx, words, 0.11);
    type S = { svg: SVGSVGElement; path: SVGPathElement; len: number; dir: 1 | -1; key: string } | null;
    const marks: S[] = words.map(() => null);

    const build = (j: number) => {
      const w = words[j];
      const W = w.el.offsetWidth;
      const H = w.el.offsetHeight;
      const pad = H * 0.25;
      const svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("width", String(W + pad * 2));
      svg.setAttribute("height", String(H + pad));
      svg.style.cssText = `position:absolute;left:${w.el.offsetLeft - pad}px;top:${w.el.offsetTop - pad / 2}px;pointer-events:none;mix-blend-mode:difference;z-index:2;overflow:visible`;
      const path = document.createElementNS(SVG_NS, "path");
      const y = pad / 2 + H * 0.52;
      const wob = H * 0.05;
      path.setAttribute(
        "d",
        `M ${pad * 0.7} ${y + wob} C ${pad + W * 0.3} ${y - wob * 2}, ${pad + W * 0.65} ${y + wob * 2}, ${W + pad * 1.3} ${y - wob}`,
      );
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "#fff");
      path.setAttribute("stroke-width", String(H * 0.8));
      path.setAttribute("stroke-linecap", "round");
      svg.appendChild(path);
      ctx.heading.appendChild(svg);
      const len = path.getTotalLength();
      path.style.strokeDasharray = `${len}`;
      path.style.strokeDashoffset = `${len}`;
      marks[j] = { svg, path, len, dir: 1, key: `${W}x${H}` };
    };

    return {
      step: () => {
        const { k, over } = track();
        words.forEach((w, j) => {
          if (k[j] > 0 && !marks[j]) build(j);
          const m = marks[j];
          if (!m) return;
          if (k[j] === 0) {
            m.svg.remove();
            marks[j] = null;
            return;
          }
          m.dir = over[j] ? 1 : -1;
          const e = smoothstep(k[j]);
          // In: draw left→right. Out: wipe off left→right (negative offset).
          m.path.style.strokeDashoffset = `${(m.dir * m.len * (1 - e)).toFixed(1)}`;
        });
      },
      dispose: () => marks.forEach((m) => m?.svg.remove()),
    };
  },
};

// ─── 7. Pieces ──────────────────────────────────────────────────────────────
// After Matter.js's "mixed" demo: hovering a word shakes loose a handful of
// geometric pieces (circles, blocks, polygons) that fall and pile up; click a
// word and the whole word drops in among them. Drag anything around;
// double-click or scroll back up to tidy up.
const MAX_PIECES = 140;

const pieces: EffectDef = {
  id: 7,
  name: "Pieces",
  hint: "Hover to shake pieces loose · click a word to drop it · double-click to tidy",
  create: (ctx) => {
    const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint } = Matter;
    const { stage } = ctx;
    const words = groupWords(ctx.letters);
    const track = hoverTracker(ctx, words);
    const engine = Engine.create();
    engine.gravity.y = 1;

    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5";
    stage.appendChild(canvas);

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
      ];
      Composite.add(engine.world, walls);
    };
    buildWalls();

    const shapes: { body: Matter.Body; filled: boolean }[] = [];
    const spawn = (j: number) => {
      const r = words[j].el.getBoundingClientRect();
      const sr = stage.getBoundingClientRect();
      const fs = fontSizeOf(ctx.heading);
      const n = 6 + Math.floor(Math.random() * 4);
      for (let i = 0; i < n; i++) {
        const x = r.left - sr.left + Math.random() * r.width;
        const y = r.top - sr.top + Math.random() * r.height;
        const s = fs * (0.12 + Math.random() * 0.16);
        const opts = { restitution: 0.4, friction: 0.2, frictionAir: 0.008 };
        const kind = Math.floor(Math.random() * 3);
        const body =
          kind === 0
            ? Bodies.circle(x, y, s * 0.6, opts)
            : kind === 1
              ? Bodies.rectangle(x, y, s * (0.8 + Math.random()), s * (0.6 + Math.random() * 0.6), { ...opts, chamfer: { radius: s * 0.12 } })
              : Bodies.polygon(x, y, 3 + Math.floor(Math.random() * 4), s * 0.7, opts);
        Body.setVelocity(body, { x: (Math.random() - 0.5) * 8, y: -3 - Math.random() * 6 });
        Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.3);
        Composite.add(engine.world, body);
        shapes.push({ body, filled: Math.random() < 0.5 });
      }
      while (shapes.length > MAX_PIECES) Composite.remove(engine.world, shapes.shift()!.body);
    };

    // Whole words that were dropped.
    type Dropped = { body: Matter.Body | null; bx: number; by: number; x: number; y: number; r: number; returning: boolean };
    const dropped: Dropped[] = words.map(() => ({ body: null, bx: 0, by: 0, x: 0, y: 0, r: 0, returning: false }));
    const drop = (j: number) => {
      const d = dropped[j];
      if (d.body) return;
      const el = words[j].el;
      const prev = el.style.transform;
      el.style.transform = "none";
      const r = el.getBoundingClientRect();
      el.style.transform = prev;
      const sr = stage.getBoundingClientRect();
      d.bx = r.left - sr.left + r.width / 2;
      d.by = r.top - sr.top + r.height / 2;
      d.body = Bodies.rectangle(d.bx + d.x, d.by + d.y, r.width, r.height * 0.78, {
        restitution: 0.2,
        friction: 0.4,
        chamfer: { radius: 6 },
        angle: (d.r * Math.PI) / 180,
      });
      Body.setVelocity(d.body, { x: (Math.random() - 0.5) * 3, y: -4 });
      Body.setAngularVelocity(d.body, (Math.random() - 0.5) * 0.08);
      Composite.add(engine.world, d.body);
      d.returning = false;
    };
    const tidy = () => {
      shapes.splice(0).forEach((s) => Composite.remove(engine.world, s.body));
      dropped.forEach((d) => {
        if (d.body) Composite.remove(engine.world, d.body);
        if (d.body) d.returning = true;
        d.body = null;
      });
    };

    // Drag & throw (mouse only — Matter's touch handlers would block scrolling).
    const mouse = Mouse.create(stage);
    const m = mouse as unknown as Record<string, EventListener>;
    const off = (names: string[], fn: EventListener) => names.forEach((n) => mouse.element.removeEventListener(n, fn));
    off(["wheel", "mousewheel", "DOMMouseScroll"], m.mousewheel);
    off(["touchmove"], m.mousemove);
    off(["touchstart"], m.mousedown);
    off(["touchend"], m.mouseup);
    Composite.add(engine.world, MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, damping: 0.1 } }));

    const onDown = (e: PointerEvent) => {
      if (!ctx.isDone()) return;
      const j = words.findIndex((w) => w.el.contains(e.target as Node));
      if (j >= 0) drop(j);
    };
    stage.addEventListener("pointerdown", onDown);
    stage.addEventListener("dblclick", tidy);
    window.addEventListener("resize", buildWalls);

    return {
      step: () => {
        if (!ctx.isDone() && (shapes.length || dropped.some((d) => d.body))) tidy();
        track((j) => spawn(j));
        Engine.update(engine, 1000 / 60);

        words.forEach((w, j) => {
          const d = dropped[j];
          if (d.body) {
            d.x = d.body.position.x - d.bx;
            d.y = d.body.position.y - d.by;
            d.r = (d.body.angle * 180) / Math.PI;
          } else if (d.returning) {
            d.x *= 0.86;
            d.y *= 0.86;
            const target = Math.round(d.r / 360) * 360;
            d.r += (target - d.r) * 0.14;
            if (Math.abs(d.x) + Math.abs(d.y) < 0.3 && Math.abs(target - d.r) < 0.3) {
              d.x = d.y = d.r = 0;
              d.returning = false;
            }
          }
          w.el.style.transform =
            d.body || d.returning ? `translate3d(${d.x.toFixed(1)}px, ${d.y.toFixed(1)}px, 0) rotate(${d.r.toFixed(2)}deg)` : "";
        });

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
        g.fillStyle = "#fff";
        g.strokeStyle = "#fff";
        g.lineWidth = 1.5;
        for (const { body, filled } of shapes) {
          g.beginPath();
          if (body.circleRadius) g.arc(body.position.x, body.position.y, body.circleRadius, 0, Math.PI * 2);
          else {
            body.vertices.forEach((v, i) => (i ? g.lineTo(v.x, v.y) : g.moveTo(v.x, v.y)));
            g.closePath();
          }
          filled ? g.fill() : g.stroke();
        }
      },
      dispose: () => {
        stage.removeEventListener("pointerdown", onDown);
        stage.removeEventListener("dblclick", tidy);
        window.removeEventListener("resize", buildWalls);
        off(["mousemove"], m.mousemove);
        off(["mousedown"], m.mousedown);
        off(["mouseup"], m.mouseup);
        Composite.clear(engine.world, false);
        Engine.clear(engine);
        canvas.remove();
        words.forEach((w) => (w.el.style.transform = ""));
      },
    };
  },
};

export const WORD_EFFECTS: EffectDef[] = [rewrite, reveal, echo, weight, magnetWord, ink, pieces, question];

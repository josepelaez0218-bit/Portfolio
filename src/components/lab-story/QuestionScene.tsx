import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import type { Effect, EffectDef, Pointer } from "./effects";

const EYEBROW = "Creativity always starts with a question.";
const QUESTION = "What if the words react to the mouse?";

// Scroll progress (0–1 through the pinned wrapper) over which the question types.
const TYPE_RANGE = [0.02, 0.55];

type Token = { char: string; index: number };

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const range = (p: number, [a, b]: number[]) => clamp01((p - a) / (b - a));

/**
 * Opening scene, pinned: the question types itself out as you scroll (the
 * caret blinks in place before the first beat), and once fully written the
 * selected effect makes the letters react to the pointer (mouse or finger).
 */
type Props = {
  effect: EffectDef;
  /** Small line above the question. */
  eyebrow?: ReactNode;
  /**
   * Alternative to `eyebrow`: explicit lines, each in its own mask, so the
   * outro can slide them down out of sight line by line.
   */
  eyebrowLines?: string[];
  question?: string;
  eyebrowClassName?: string;
  headingClassName?: string;
  headingStyle?: CSSProperties;
  /**
   * Word indices after which to break the line on small screens. When set,
   * the question's "\n" breaks apply from the md breakpoint up only.
   */
  mobileBreaks?: number[];
  /** Height of the pinned wrapper (CSS length); defaults to 320vh. */
  height?: string;
  /** Typing range in scrolled viewport-heights (vh) instead of the default fraction. */
  typeVh?: [number, number];
  /**
   * Outro, from `startVh` scrolled: the question's lines slide down behind
   * their masks, then the eyebrow's; then `eyebrow` types itself in its place
   * like a typewriter. Pointer reactions stop. All scrubbed by the scroll.
   */
  outro?: { eyebrow: string; startVh: number };
  /** Called on every scroll with the px scrolled into the pinned wrapper. */
  onScrollPx?: (scrolled: number, viewportHeight: number) => void;
  /** Extra layers inside the pinned stage (e.g. content revealed by the outro). */
  children?: ReactNode;
};

const DEFAULT_EYEBROW_CLASS = "font-sans text-[13px] md:text-[16px] text-foreground/80 tracking-[0.01em] mb-6 md:mb-10";
const DEFAULT_HEADING_CLASS =
  "font-serif font-normal text-foreground text-[44px] leading-[1.08] md:text-[80px] md:leading-[1.02] max-w-[11em]";

const QuestionScene = ({
  effect,
  eyebrow = EYEBROW,
  eyebrowLines,
  question = QUESTION,
  eyebrowClassName = DEFAULT_EYEBROW_CLASS,
  headingClassName = DEFAULT_HEADING_CLASS,
  headingStyle = { letterSpacing: "-0.01em" },
  mobileBreaks,
  height,
  typeVh,
  outro,
  onScrollPx,
  children,
}: Props) => {
  const wrapperRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const outroEyebrowRef = useRef<HTMLParagraphElement>(null);
  const outroCaretRef = useRef<HTMLSpanElement>(null);
  const outroRef = useRef(0);
  // Latest values for the scroll handler (it's bound once).
  const opts = useRef({ typeVh, outro, onScrollPx });
  opts.current = { typeVh, outro, onScrollPx };

  const pointerRef = useRef<Pointer>({ x: 0, y: 0, vx: 0, vy: 0, active: false });
  const doneRef = useRef(false);
  const effectRef = useRef<Effect | null>(null);

  // Words stay unbreakable (nowrap); spaces count as a typing beat too.
  // A "\n" in the question forces a line break after that word.
  const { words, breaks, total } = useMemo(() => {
    let index = 0;
    const words: Token[][] = [];
    const breaks = new Set<number>();
    for (const part of question.split(/( |\n)/)) {
      if (part === "\n") breaks.add(words.length - 1);
      else if (part && part !== " ") words.push(part.split("").map((char) => ({ char, index: index++ })));
    }
    return { words, breaks, total: index + words.length - 1 };
  }, [question]);

  // Scroll-driven typing, pointer tracking and the shared animation loop.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const heading = headingRef.current;
    const caret = caretRef.current;
    if (!wrapper || !heading || !caret) return;

    const letters = letterRefs.current.filter(Boolean) as HTMLSpanElement[];

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      letters.forEach((l) => (l.style.opacity = "1"));
      caret.dataset.state = "hidden";
      return;
    }

    // Letter index -> typing beat (spaces between words take a beat each).
    const beatOf = letters.map((_, i) => {
      let wordIdx = 0;
      let count = 0;
      for (const w of words) {
        if (i < count + w.length) break;
        count += w.length;
        wordIdx++;
      }
      return i + wordIdx;
    });

    const pointer = pointerRef.current;
    let lastX = 0;
    let lastY = 0;
    let inView = false;
    let frame: number | null = null;

    const readScroll = () => {
      const rect = wrapper.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrollable = rect.height - vh;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(scrollable, 0));
      return { p: scrollable > 0 ? scrolled / scrollable : 1, scrolled, vh, sVh: (scrolled / vh) * 100 };
    };

    // offset* (relative to the positioned heading) ignore transforms, so the
    // caret sits on the letters' resting spots whatever the effect is doing.
    const placeCaret = (typed: number) => {
      let last = -1;
      letters.forEach((_, i) => beatOf[i] < typed && (last = i));
      const l = letters[Math.max(last, 0)];
      caret.style.left = `${l.offsetLeft + (last >= 0 ? l.offsetWidth : 0)}px`;
      caret.style.top = `${l.offsetTop}px`;
      caret.style.height = `${l.offsetHeight}px`;
    };

    // ── Outro ──────────────────────────────────────────────────────────────
    const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
    const wordEls = () => [...heading.querySelectorAll<HTMLElement>(":scope > span > span.inline-block")];
    let outroApplied = false;
    const applyOutro = (sVh: number, s0: number) => {
      outroRef.current = sVh > s0 ? 1 : 0;
      const active = sVh > s0;

      // 1. The question, line by line, slides down behind each word's mask.
      const ws = wordEls();
      const tops = [...new Set(ws.map((w) => w.offsetTop))].sort((a, b) => a - b);
      ws.forEach((w) => {
        const li = tops.indexOf(w.offsetTop);
        const v = easeInOut(range(sVh, [s0 + li * 3, s0 + 14 + li * 3]));
        if (active) w.style.clipPath = "inset(0 -0.6em)";
        else if (outroApplied) w.style.clipPath = "";
        [...w.children].forEach((c) => {
          (c as HTMLElement).style.transform = v > 0 ? `translateY(${(v * 112).toFixed(1)}%)` : active || outroApplied ? "" : (c as HTMLElement).style.transform;
        });
      });

      // 2. Then the eyebrow's lines do the same.
      eyebrowRef.current?.querySelectorAll<HTMLElement>("[data-mask-line]").forEach((line, i) => {
        const v = easeInOut(range(sVh, [s0 + 6 + i * 3, s0 + 20 + i * 3]));
        line.style.transform = v > 0 ? `translateY(${(v * 112).toFixed(1)}%)` : "";
      });

      // 3. And the new line types itself in their place.
      const chars = outroEyebrowRef.current ? [...outroEyebrowRef.current.querySelectorAll<HTMLElement>("[data-char]")] : [];
      const t = range(sVh, [s0 + 22, s0 + 38]);
      const n = Math.round(t * chars.length);
      chars.forEach((c, i) => (c.style.opacity = i < n ? "1" : "0"));
      const oc = outroCaretRef.current;
      if (oc && chars.length) {
        oc.dataset.state = t > 0 && t < 1 ? "typing" : "hidden";
        const last = chars[Math.max(n - 1, 0)];
        oc.style.left = `${last.offsetLeft + (n > 0 ? last.offsetWidth : 0)}px`;
        oc.style.top = `${last.offsetTop}px`;
        oc.style.height = `${last.offsetHeight}px`;
      }
      outroApplied = active;
    };

    const applyScroll = () => {
      const { p, scrolled, vh, sVh } = readScroll();
      const { typeVh: tv, outro: out, onScrollPx: cb } = opts.current;
      const typed = Math.round((tv ? range(sVh, tv) : range(p, TYPE_RANGE)) * total);
      letters.forEach((l, i) => (l.style.opacity = beatOf[i] < typed ? "1" : "0"));
      doneRef.current = typed >= total;
      // Blinks while waiting/typing; disappears once the question is complete.
      caret.dataset.state = doneRef.current ? "hidden" : "typing";
      placeCaret(typed);

      if (out) applyOutro(sVh, out.startVh);
      cb?.(scrolled, vh);
    };

    const loop = () => {
      frame = null;
      if (!inView) return;
      pointer.vx = pointer.active ? pointer.x - lastX : 0;
      pointer.vy = pointer.active ? pointer.y - lastY : 0;
      lastX = pointer.x;
      lastY = pointer.y;
      // Reactions pause once the outro takes over.
      if (outroRef.current <= 0) effectRef.current?.step();
      frame = requestAnimationFrame(loop);
    };

    const setPointer = (x: number, y: number) => {
      if (!pointer.active) {
        lastX = x;
        lastY = y;
      }
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
    };
    const onPointerMove = (e: PointerEvent) => setPointer(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) setPointer(t.clientX, t.clientY);
    };
    const release = () => (pointer.active = false);

    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) {
        applyScroll();
        if (frame === null) frame = requestAnimationFrame(loop);
      }
    });
    io.observe(wrapper);

    applyScroll();
    window.addEventListener("scroll", applyScroll, { passive: true });
    window.addEventListener("resize", applyScroll);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", release);
    window.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("touchend", release);

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", applyScroll);
      window.removeEventListener("resize", applyScroll);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", release);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend", release);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [words, total]);

  // Swap the pointer reaction; each effect restores the letters on dispose.
  useEffect(() => {
    const heading = headingRef.current;
    const stage = stageRef.current;
    if (!heading || !stage) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const instance = effect.create({
      letters: letterRefs.current.filter(Boolean) as HTMLSpanElement[],
      heading,
      stage,
      pointer: pointerRef.current,
      isDone: () => doneRef.current,
    });
    effectRef.current = instance;
    return () => {
      effectRef.current = null;
      instance.dispose();
    };
  }, [effect]);

  let letterIdx = 0;

  return (
    <section ref={wrapperRef} className={height ? "relative" : "relative h-[320vh]"} style={height ? { height } : undefined}>
      <style>{`
        @keyframes lab-caret-blink { 0%, 49% { opacity: 1 } 50%, 100% { opacity: 0 } }
        .lab-caret { opacity: 0; }
        .lab-caret[data-state="typing"] { animation: lab-caret-blink 1s step-end infinite; }
      `}</style>
      <div
        ref={stageRef}
        className="sticky top-0 h-screen overflow-hidden flex flex-col items-center justify-center px-6 text-center"
      >
        {/* Eyebrow and its outro replacement share one grid cell (same spot). */}
        <div className={`grid ${eyebrowClassName} animate-fade-up`}>
          <p ref={eyebrowRef} className="[grid-area:1/1]">
            {eyebrowLines
              ? eyebrowLines.map((line, i) => (
                  <span key={i} className="block overflow-hidden">
                    <span data-mask-line className="block will-change-transform">
                      {line}
                    </span>
                  </span>
                ))
              : eyebrow}
          </p>
          {outro && (
            <p ref={outroEyebrowRef} aria-label={outro.eyebrow} className="[grid-area:1/1] self-center relative">
              {Array.from(outro.eyebrow).map((ch, i) => (
                <span key={i} data-char aria-hidden="true" style={{ opacity: 0 }}>
                  {ch}
                </span>
              ))}
              <span ref={outroCaretRef} aria-hidden="true" className="lab-caret absolute w-[2px] bg-foreground" />
            </p>
          )}
        </div>
        <h1
          ref={headingRef}
          aria-label={question.replace(/\n/g, " ")}
          className={`relative select-none ${headingClassName}`}
          style={headingStyle}
        >
          {words.map((word, w) => (
            <span key={w} aria-hidden="true">
              <span className="inline-block whitespace-nowrap">
                {word.map((t) => {
                  const i = letterIdx++;
                  return (
                    <span
                      key={t.index}
                      ref={(el) => (letterRefs.current[i] = el)}
                      className="inline-block will-change-transform"
                      style={{ opacity: 0 }}
                    >
                      {t.char}
                    </span>
                  );
                })}
              </span>
              {w < words.length - 1 &&
                (mobileBreaks ? (
                  <>
                    {" "}
                    {breaks.has(w) && mobileBreaks.includes(w) ? (
                      <br />
                    ) : breaks.has(w) ? (
                      <br className="hidden md:inline" />
                    ) : mobileBreaks.includes(w) ? (
                      <br className="md:hidden" />
                    ) : null}
                  </>
                ) : breaks.has(w) ? (
                  <br />
                ) : (
                  " "
                ))}
            </span>
          ))}
          <span
            ref={caretRef}
            aria-hidden="true"
            className="lab-caret absolute w-[2px] md:w-[3px] bg-foreground"
          />
        </h1>
        {children}
      </div>
    </section>
  );
};

export default QuestionScene;

import { useEffect, useRef } from "react";

const SRCS = [
  "/hero-trail/01.jpg",
  "/hero-trail/02.jpg",
  "/hero-trail/03.jpg",
  "/hero-trail/04.jpg",
  "/hero-trail/05.jpg",
  "/hero-trail/06.jpg",
];

// Source images are all 4:5 portrait — keep the pool boxes close to that
// ratio so object-cover doesn't crop them aggressively.
const DIMS = [
  { w: 440, h: 550 },
  { w: 500, h: 625 },
  { w: 400, h: 500 },
];

// Smaller on mobile — at full desktop size they cover almost the whole
// hero and hide the headline behind them.
const DIMS_MOBILE = [
  { w: 190, h: 238 },
  { w: 215, h: 269 },
  { w: 175, h: 219 },
];

const THRESHOLD = 75;
const MIN_SPAWN_INTERVAL = 110;
const HIDE_AFTER = 1400;
const FADE_DURATION = 600;

// Ambient autoplay: fills the hero with the same trail on its own, so it
// never sits dead — on mobile (no cursor) it's the only way this effect is
// ever seen, and on desktop it fills in before the pointer moves and
// resumes a couple of seconds after it stops.
const AUTOPLAY_INTERVAL = 1900;
const AUTOPLAY_IDLE_DELAY = 1800;

type PoolItem = {
  el: HTMLDivElement;
  w: number;
  h: number;
  visible: boolean;
  z: number;
  tid: ReturnType<typeof setTimeout> | null;
};

const dist = (x1: number, y1: number, x2: number, y2: number) => {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Cursor image trail for the hero: as the pointer moves, an image spawns
 * near it and stays put, fading out after a moment. Runs on its own
 * (ambient autoplay) on mobile and whenever the pointer has been idle for
 * a bit, so the hero is never empty. Disabled under prefers-reduced-motion.
 */
const ImageTrailHero = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const poolRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const hero = heroRef.current;
    if (!hero) return;

    const isDesktop = window.matchMedia("(min-width: 769px)").matches;
    const dims = isDesktop ? DIMS : DIMS_MOBILE;

    SRCS.forEach((s) => {
      const img = new Image();
      img.src = s;
    });

    const pool: PoolItem[] = dims.map((dim, i) => {
      const el = poolRefs.current[i];
      if (!el) throw new Error("pool ref missing");
      el.style.width = `${dim.w}px`;
      el.style.height = `${dim.h}px`;
      return { el, w: dim.w, h: dim.h, visible: false, z: 0, tid: null };
    });

    let zC = 0;
    let lastX = -9999;
    let lastY = -9999;
    let lastSpawnTime = 0;
    let lastRealMoveTime = 0;
    let seq = 0;

    // Cached instead of read on every mousemove — getBoundingClientRect()
    // forces a layout recalc, and doing that on every raw pointer event
    // is what was causing the stutter.
    let rect = hero.getBoundingClientRect();
    const updateRect = () => {
      rect = hero.getBoundingClientRect();
    };
    window.addEventListener("resize", updateRect);

    const getSlot = () => pool.find((p) => !p.visible) ?? pool.reduce((m, p) => (p.z < m.z ? p : m), pool[0]);

    const toHero = (cx: number, cy: number) => ({ x: cx - rect.left, y: cy - rect.top });

    const spawn = (hx: number, hy: number) => {
      const s = getSlot();
      if (s.tid) {
        clearTimeout(s.tid);
        s.tid = null;
      }
      seq = (seq + 1) % SRCS.length;
      const img = s.el.querySelector("img");
      if (img) img.src = SRCS[seq];
      zC++;
      s.z = zC;
      s.visible = true;
      s.el.style.zIndex = String(zC);
      s.el.style.transform = `translate(${hx - s.w / 2}px,${hy - s.h / 2}px)`;
      s.el.style.transition = `opacity ${FADE_DURATION}ms cubic-bezier(0.4,0,0.2,1)`;
      s.el.style.opacity = "1";
      s.tid = setTimeout(() => {
        s.el.style.opacity = "0";
        setTimeout(() => {
          s.visible = false;
        }, FADE_DURATION);
      }, HIDE_AFTER);
      lastX = hx;
      lastY = hy;
      lastSpawnTime = performance.now();
    };

    const hideAll = () => {
      pool.forEach((s) => {
        if (s.tid) {
          clearTimeout(s.tid);
          s.tid = null;
        }
        s.el.style.opacity = "0";
        s.visible = false;
      });
      lastX = lastY = -9999;
    };

    // Raw mousemove can fire well over 100x/sec — only act on the latest
    // position once per animation frame, so spawning never competes with
    // the browser's paint/composite work for the same frame.
    let pendingEvent: MouseEvent | null = null;
    let rafId: number | null = null;

    const processMove = () => {
      rafId = null;
      const e = pendingEvent;
      if (!e) return;
      const { x, y } = toHero(e.clientX, e.clientY);
      const sinceLastSpawn = performance.now() - lastSpawnTime;
      if (dist(x, y, lastX, lastY) > THRESHOLD && sinceLastSpawn > MIN_SPAWN_INTERVAL) spawn(x, y);
    };

    const onMouseMove = (e: MouseEvent) => {
      lastRealMoveTime = performance.now();
      pendingEvent = e;
      if (rafId === null) rafId = requestAnimationFrame(processMove);
    };

    hero.addEventListener("mousemove", onMouseMove, { passive: true });
    hero.addEventListener("mouseleave", hideAll);

    // Once the hero scrolls out of view, stop spawning (autoplay would
    // otherwise keep firing forever) and clear anything still fading out,
    // so nothing lingers or pops in at the bottom edge while scrolling.
    let heroVisible = true;
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        heroVisible = entry.isIntersecting;
        if (!heroVisible) hideAll();
      },
      { threshold: 0 },
    );
    visibilityObserver.observe(hero);

    // Ambient autoplay — spawns at a wandering point on its own whenever
    // there's no cursor to follow (mobile) or the cursor has been idle.
    let autoX = 0;
    let autoY = 0;
    let autoInit = false;
    const autoplayTick = () => {
      if (!heroVisible) return;
      const idle = !isDesktop || performance.now() - lastRealMoveTime > AUTOPLAY_IDLE_DELAY;
      if (!idle || rect.width === 0 || rect.height === 0) return;
      const marginX = Math.min(120, rect.width * 0.2);
      const marginY = Math.min(120, rect.height * 0.2);
      if (!autoInit) {
        autoX = rect.width / 2;
        autoY = rect.height / 2;
        autoInit = true;
      }
      // Wander from the last autoplay point instead of jumping randomly,
      // so ambient spawns still read as a loose trail rather than confetti.
      autoX += (Math.random() - 0.5) * rect.width * 0.35;
      autoY += (Math.random() - 0.5) * rect.height * 0.35;
      autoX = Math.min(rect.width - marginX, Math.max(marginX, autoX));
      autoY = Math.min(rect.height - marginY, Math.max(marginY, autoY));
      spawn(autoX, autoY);
    };
    const autoplayId = window.setInterval(autoplayTick, AUTOPLAY_INTERVAL);
    // Kick off the first one shortly after mount instead of waiting a full
    // interval, so the hero isn't blank on load.
    const autoplayStartId = window.setTimeout(autoplayTick, 500);

    return () => {
      window.removeEventListener("resize", updateRect);
      hero.removeEventListener("mousemove", onMouseMove);
      hero.removeEventListener("mouseleave", hideAll);
      visibilityObserver.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.clearInterval(autoplayId);
      window.clearTimeout(autoplayStartId);
      pool.forEach((s) => {
        if (s.tid) clearTimeout(s.tid);
      });
    };
  }, []);

  return (
    <div ref={heroRef} className="absolute inset-0 z-10" aria-hidden="true">
      {DIMS.map((_, i) => (
        <div
          key={i}
          ref={(el) => (poolRefs.current[i] = el)}
          className="absolute top-0 left-0 opacity-0 pointer-events-none overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.12)] will-change-transform"
        >
          <img src={SRCS[i]} alt="" draggable={false} className="w-full h-full object-cover pointer-events-none select-none" />
        </div>
      ))}
    </div>
  );
};

export default ImageTrailHero;

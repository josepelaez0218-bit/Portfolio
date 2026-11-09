import { useEffect, useMemo, useRef, useState } from "react";
import { Img, type Pic } from "./pieces";

const SIDE = 12, GAP_Y = 56, DRIFT = 0.75;
// A rhythm of sizes (share of a lane's width) and nudges inside the lane, so
// big and small alternate and nothing lines up like a grid. Fixed, so the
// layout is the same each visit.
const SIZE = [0.98, 0.62, 0.84, 0.55, 0.95, 0.66, 0.78, 0.58, 0.92, 0.6, 0.86, 0.52];
const NUDGE = [0.1, 0.85, 0.4, 0.7, 0.05, 0.9, 0.3, 0.6, 0.2, 0.75];
const START = [24, 150, 80];

type Spot = { x: number; y: number; w: number; h: number; speed: number; lane: number };

/** Each piece into the emptiest lane, one under the other with room between, so they never pile up. */
const layout = (pieces: Pic[], width: number) => {
  const lanes = width < 640 ? 2 : 3;
  const lane = (width - 2 * SIDE) / lanes;
  const bottoms = START.slice(0, lanes);
  const spots: Spot[] = pieces.map((pic, i) => {
    const c = bottoms.indexOf(Math.min(...bottoms));
    // Sized by area, so tall pieces don't tower over the rest
    const side = lane * SIZE[i % SIZE.length];
    let w = Math.min(lane * 0.96, side * Math.sqrt(pic.ratio));
    let h = w / pic.ratio;
    if (h > lane * 1.15) {
      h = lane * 1.15;
      w = h * pic.ratio;
    }
    const x = SIDE + c * lane + (lane - w) * NUDGE[i % NUDGE.length];
    const y = bottoms[c];
    bottoms[c] = y + h + GAP_Y;
    // Layers: the bigger, the nearer, so the faster it passes; small ones lag behind
    const k = w / lane;
    return { x, y, w, h, speed: 0.55 + k * 0.95, lane: c };
  });
  // Square the lanes off: spread each short lane's shortfall over its gaps, so
  // they all end together instead of leaving a hole under one of them
  const end = Math.max(...bottoms);
  bottoms.forEach((b, c) => {
    const mine = spots.filter((s) => s.lane === c);
    const step = (end - b) / Math.max(1, mine.length);
    mine.forEach((s, j) => (s.y += step * (j + 0.5)));
  });
  return { spots, height: end };
};

/**
 * The work on phones: the pieces loose on black, big and small, in layers
 * that drift past at different speeds as you scroll (transform only, and only
 * while on screen). Lighter than the card file, which stays on wide screens.
 */
const Parallax = ({ pieces }: { pieces: Pic[] }) => {
  const box = useRef<HTMLDivElement>(null);
  const els = useRef<(HTMLDivElement | null)[]>([]);
  const [width, setWidth] = useState(() => document.documentElement.clientWidth);
  const { spots, height } = useMemo(() => layout(pieces, width), [pieces, width]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0, on = false;
    const tick = () => {
      raf = 0;
      const b = box.current;
      if (!b || !on) return;
      const r = b.getBoundingClientRect(), vh = window.innerHeight;
      els.current.forEach((el, i) => {
        const sp = spots[i];
        if (!el || !sp) return;
        // Each piece sits in its own place as it crosses the middle of the
        // screen, and drifts off it (near ones ahead, far ones behind) away from
        // there; the drift fades out at the gallery's ends, so no gaps open there
        const mid = sp.y + sp.h / 2;
        const q = (r.top + mid - vh / 2) / vh;
        const amp = Math.min(1, Math.min(mid, height - mid) / (vh * 0.45));
        el.style.transform = `translate3d(0,${q * vh * (sp.speed - 1) * DRIFT * amp}px,0)`;
      });
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    // Only the width matters: the address bar changing the height doesn't re-lay it out
    const resize = () => setWidth(document.documentElement.clientWidth);
    const io = new IntersectionObserver(([e]) => {
      on = e.isIntersecting;
      kick();
    });
    io.observe(box.current!);
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, [spots, height]);

  return (
    <div ref={box} className="relative overflow-hidden" style={{ height: height + 40 }}>
      {pieces.map((pic, i) => {
        const s = spots[i];
        if (!s) return null;
        return (
          <div
            key={pic.src}
            ref={(el) => (els.current[i] = el)}
            className="absolute overflow-hidden rounded-[3px] will-change-transform"
            style={{ left: s.x, top: s.y, width: s.w, height: s.h, zIndex: Math.round(s.speed * 10) }}
          >
            <Img pic={pic} />
          </div>
        );
      })}
    </div>
  );
};

export default Parallax;

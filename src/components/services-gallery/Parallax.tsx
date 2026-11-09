import { useEffect, useRef } from "react";
import { Img, type Pic } from "./pieces";

const SHIFT = 70; // px each column travels, in opposite directions, while the gallery crosses the screen

/**
 * The work on phones: two columns of pieces, each at its own proportion, that
 * drift apart as you scroll (transform only, and only while on screen). Lighter
 * than the card file, which stays on wide screens.
 */
const Parallax = ({ pieces }: { pieces: Pic[] }) => {
  const box = useRef<HTMLDivElement>(null);
  const cols = useRef<(HTMLDivElement | null)[]>([]);
  const split = [pieces.filter((_, i) => i % 2 === 0), pieces.filter((_, i) => i % 2 === 1)];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = box.current!;
    let raf = 0;
    const loop = () => {
      const r = el.getBoundingClientRect();
      // -1 when its centre is a screen below the middle, +1 a screen above
      const p = (window.innerHeight / 2 - (r.top + r.height / 2)) / window.innerHeight;
      cols.current.forEach((c, i) => c?.style.setProperty("transform", `translate3d(0, ${(i ? -1 : 1) * p * SHIFT}px, 0)`));
      raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting) raf = requestAnimationFrame(loop);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={box} className="overflow-hidden px-3 pb-24">
      <div className="grid grid-cols-2 gap-3">
        {split.map((col, i) => (
          // The second column starts lower, so the two never line up
          <div key={i} ref={(n) => (cols.current[i] = n)} className={`flex flex-col gap-3 will-change-transform ${i ? "pt-24" : ""}`}>
            {col.map((pic) => (
              <div key={pic.src} className="overflow-hidden rounded-[3px] bg-foreground/5" style={{ aspectRatio: String(pic.ratio) }}>
                <Img pic={pic} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Parallax;

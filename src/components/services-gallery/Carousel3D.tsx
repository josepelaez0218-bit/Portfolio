import { useEffect, useRef } from "react";
import { Img, type Pic } from "./pieces";

const TURN_S = 36; // seconds per turn
// Only a few, as leaves: with fewer, each can be bigger. All the leaves are
// 3:2, so these are pieces that sit well in that shape (no tall ones).
const PICKS = ["steamy-bambini", "f4b2223a", "seedtag-creativity", "ekcorr-cards", "fanfan", "design-system", "dkp-chat", "seedtag-preview"];

/**
 * The work as a card file: a few pieces as leaves around one axis, always
 * turning in 3D (CSS only), which gives the page a beat; scrolling spins it
 * on. On wide screens the axis stands upright; on phones it lies flat, like a
 * rolodex, so each leaf can take the screen's width and the spin follows the
 * thumb. Each leaf has two faces, so a picture is never seen mirrored from behind.
 */
const Carousel3D = ({ pieces, upright = true }: { pieces: Pic[]; upright?: boolean }) => {
  const spin = useRef<HTMLDivElement>(null);
  const leaves = PICKS.map((k) => pieces.find((p) => p.src.includes(k))).filter((p): p is Pic => !!p);

  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // A thumb scrolls in bigger jumps than a wheel: a softer push on phones
    const kick = upright ? 0.018 : 0.012;
    let raf = 0, rot = 0, push = 0, last = performance.now(), lastY = window.scrollY;
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      // The scroll gives it a push on top of its own pace, which fades out
      const dy = window.scrollY - lastY;
      lastY = window.scrollY;
      push = push * 0.92 + dy * kick;
      if (!still) rot += (dt / TURN_S) * 360 + push;
      spin.current?.style.setProperty("transform", upright ? `rotateX(-12deg) rotateY(${rot}deg)` : `rotateY(6deg) rotateX(${-rot}deg)`);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [upright]);

  const W = upright ? "min(32vw, 480px)" : "min(72vw, 400px)";
  const HOLE = upright ? "min(4vw, 60px)" : "min(5vw, 28px)";
  const face = "absolute inset-0 overflow-hidden rounded-[3px] bg-[#171717] [backface-visibility:hidden]";
  return (
    // Room below, before the contact covers it. On wide screens the section
    // stops with its top line at the top of the screen; on phones the list is
    // long, so it goes on until the whole card file is on screen (data-sheet-keep)
    <div
      data-sheet-keep={upright ? undefined : ""}
      className={`relative overflow-hidden ${upright ? "-mt-32 mb-[18svh] h-[80svh] min-h-[600px]" : "-mt-16 mb-[10svh] h-[min(150vw,640px)]"}`}
      style={{ perspective: upright ? "2000px" : "1800px" }}
    >
      <div ref={spin} className="absolute left-1/2 top-1/2" style={{ transformStyle: "preserve-3d" }}>
        {leaves.map((pic, i) => {
          const a = (i / leaves.length) * 360;
          return (
            <div
              key={pic.src}
              className="absolute left-0 top-0"
              style={{
                width: W,
                aspectRatio: "3 / 2",
                transformStyle: "preserve-3d",
                // A little room around the axis, so the leaves don't all meet in one line
                transformOrigin: upright ? "left center" : "center top",
                transform: upright ? `translateY(-50%) rotateY(${a}deg) translateX(${HOLE})` : `translateX(-50%) rotateX(${a}deg) translateY(${HOLE})`,
              }}
            >
              {[0, 180].map((turn) => (
                <div key={turn} className={face} style={{ transform: turn ? (upright ? "rotateY(180deg)" : "rotateX(180deg)") : undefined }}>
                  <Img pic={pic} />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Carousel3D;

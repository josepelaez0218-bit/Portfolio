import { useEffect, useRef } from "react";
import { Img, type Pic } from "./pieces";

const TURN_S = 36; // seconds per turn
// Only a few, as leaves: with fewer, each can be bigger. All the leaves are
// 3:2, so these are pieces that sit well in that shape (no tall ones).
const PICKS = ["steamy-bambini", "f4b2223a", "seedtag-creativity", "ekcorr-cards", "fanfan", "design-system", "dkp-chat", "seedtag-preview"];

/**
 * The work as a card file: a few pieces as leaves around one upright axis,
 * always turning in 3D (CSS only), which gives the page a beat; scrolling
 * spins it on. Each leaf has two faces, so a picture is never seen mirrored from behind.
 */
const Carousel3D = ({ pieces }: { pieces: Pic[] }) => {
  const spin = useRef<HTMLDivElement>(null);
  const leaves = PICKS.map((k) => pieces.find((p) => p.src.includes(k))).filter((p): p is Pic => !!p);

  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, rot = 0, push = 0, last = performance.now(), lastY = window.scrollY;
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      // The scroll gives it a push on top of its own pace, which fades out
      const dy = window.scrollY - lastY;
      lastY = window.scrollY;
      push = push * 0.92 + dy * 0.04;
      if (!still) rot += (dt / TURN_S) * 360 + push;
      spin.current?.style.setProperty("transform", `rotateX(-12deg) rotateY(${rot}deg)`);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const W = "min(32vw, 480px)";
  const HOLE = "min(4vw, 60px)";
  const face = "absolute inset-0 overflow-hidden rounded-[3px] bg-[#171717] [backface-visibility:hidden]";
  return (
    // Room below, so the section scrolls up until the whole card file is on
    // screen (the services' numbers go off the top) before the contact covers it
    <div className="relative -mt-10 mb-[18svh] h-[80svh] min-h-[600px] overflow-hidden" style={{ perspective: "2000px" }}>
      <div ref={spin} className="absolute left-1/2 top-1/2" style={{ transformStyle: "preserve-3d" }}>
        {leaves.map((pic, i) => (
          <div
            key={pic.src}
            className="absolute left-0 top-0"
            style={{
              width: W,
              aspectRatio: "3 / 2",
              transformStyle: "preserve-3d",
              transformOrigin: "left center",
              // A little room around the axis, so the leaves don't all meet in one line
              transform: `translateY(-50%) rotateY(${(i / leaves.length) * 360}deg) translateX(${HOLE})`,
            }}
          >
            {[0, 180].map((turn) => (
              <div key={turn} className={face} style={{ transform: turn ? "rotateY(180deg)" : undefined }}>
                <Img pic={pic} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Carousel3D;

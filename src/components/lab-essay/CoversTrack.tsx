import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { fetchLabItems } from "@/lib/sanity/queries";
import { urlForImage } from "@/lib/sanity/image";
import type { SanityLabItem } from "@/lib/sanity/types";
import { ease, prefersReducedMotion, range } from "./lib";

export type CoversTrackHandle = {
  /** Drive the track from the pinned scene's scroll (px scrolled, viewport height). */
  update: (scrolled: number, vh: number) => void;
};

type Props = {
  /** Scrolled vh over which the covers rise in from the bottom. */
  riseVh: [number, number];
  /** Scrolled vh at which the horizontal travel starts (1px scroll = 1px travel). */
  travelStartVh: number;
  /** Reports how far (px) the track has to travel, so the scene can size itself. */
  onTravel: (px: number) => void;
};

/**
 * The Lab covers, living inside the question's pinned stage: they rise in
 * from below (staggered) as the answers to the question, then travel
 * horizontally with the scroll.
 */
const CoversTrack = forwardRef<CoversTrackHandle, Props>(({ riseVh, travelStartVh, onTravel }, ref) => {
  const [items, setItems] = useState<SanityLabItem[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const travel = useRef(0);

  useEffect(() => {
    let cancelled = false;
    fetchLabItems()
      .then((data) => !cancelled && setItems(data))
      .catch((err) => console.error("Failed to load lab items from Sanity:", err));
    return () => {
      cancelled = true;
    };
  }, []);

  // Measure how far the track overflows the viewport.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !items.length) return;
    const measure = () => {
      travel.current = Math.max(0, track.scrollWidth - window.innerWidth);
      onTravel(travel.current);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [items.length, onTravel]);

  useImperativeHandle(
    ref,
    () => ({
      update: (scrolled, vh) => {
        const track = trackRef.current;
        if (!track) return;
        const sVh = (scrolled / vh) * 100;
        const reduced = prefersReducedMotion();
        const rise = reduced ? 1 : range(sVh, riseVh[0], riseVh[1]);
        cardRefs.current.forEach((card, i) => {
          if (!card) return;
          // Staggered: each cover starts rising a little after the previous one.
          const r = ease(Math.min(Math.max(rise * 1.5 - i * 0.07, 0), 1));
          card.style.transform = r >= 1 ? "" : `translate3d(0, ${((1 - r) * vh * 0.75).toFixed(1)}px, 0)`;
          card.style.opacity = r >= 1 ? "" : Math.min(1, r * 2).toFixed(3);
        });
        const x = Math.min(Math.max(scrolled - (travelStartVh / 100) * vh, 0), travel.current);
        track.style.transform = `translate3d(${(-x).toFixed(1)}px, 0, 0)`;
      },
    }),
    [riseVh, travelStartVh],
  );

  if (!items.length) return null;

  return (
    <div className="absolute inset-x-0 top-[48vh] md:top-[36vh] pointer-events-none" aria-label="Lab pieces" role="list">
      <div ref={trackRef} className="flex items-start gap-2 px-3 will-change-transform w-max">
        {items.map((item, i) => (
          <figure
            key={item._id}
            ref={(el) => (cardRefs.current[i] = el)}
            role="listitem"
            className="shrink-0 overflow-hidden rounded-[4px] bg-background border border-white/10 h-[42vh] md:h-[52vh] aspect-square"
            style={{ opacity: 0 }}
          >
            <img
              src={urlForImage(item.image).width(900).quality(85).url()}
              alt={item.alt}
              loading="lazy"
              className="w-full h-full object-contain"
            />
          </figure>
        ))}
      </div>
    </div>
  );
});

CoversTrack.displayName = "CoversTrack";

export default CoversTrack;

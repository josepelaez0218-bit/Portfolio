import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { ease, prefersReducedMotion, range } from "./lib";
import { CARD_CLASS, LabMedia, useLabItems, type GalleryHandle, type GalleryProps } from "./galleries/shared";

export type CoversTrackHandle = GalleryHandle;

/**
 * The Lab covers, living inside the question's pinned stage: they rise in
 * from below (staggered) as the answers to the question, then travel
 * horizontally with the scroll.
 */
const CoversTrack = forwardRef<GalleryHandle, GalleryProps>(({ riseVh, travelStartVh, onTravel }, ref) => {
  const items = useLabItems();
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const travel = useRef(0);

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
    // Once the question has gone the covers own the stage: vertically centred,
    // almost full height on desktop, almost full width on phones.
    <div className="absolute inset-0 flex items-center pointer-events-none" aria-label="Lab pieces" role="list">
      <div ref={trackRef} className="flex items-center gap-2 px-3 will-change-transform w-max">
        {items.map((item, i) => (
          <figure
            key={item._id}
            ref={(el) => (cardRefs.current[i] = el)}
            role="listitem"
            className={`shrink-0 ${CARD_CLASS} w-[min(88vw,72vh)] md:w-auto md:h-[min(80vh,calc(100vw-24px))] aspect-square`}
            style={{ opacity: 0 }}
          >
            <LabMedia item={item} />
          </figure>
        ))}
      </div>
    </div>
  );
});

CoversTrack.displayName = "CoversTrack";

export default CoversTrack;

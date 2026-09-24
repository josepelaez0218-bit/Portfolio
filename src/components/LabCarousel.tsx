import { useEffect, useRef, useState } from "react";
import { fetchLabItems } from "@/lib/sanity/queries";
import { urlForImage } from "@/lib/sanity/image";
import type { SanityLabItem } from "@/lib/sanity/types";

/**
 * Playground carousel — personal, off-the-cuff pieces that don't rise to a
 * full case study. Horizontal, driven by vertical scroll: the wrapper is
 * tall enough to cover the track's full width, a sticky viewport pins in
 * place, and the track translates left as you scroll through it.
 */
const LabCarousel = () => {
  const [items, setItems] = useState<SanityLabItem[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const extraScroll = useRef(0);

  useEffect(() => {
    let cancelled = false;
    fetchLabItems()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err) => console.error("Failed to load lab items from Sanity:", err));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const wrapper = wrapperRef.current;
    const track = trackRef.current;
    if (!wrapper || !track) return;

    const measure = () => {
      extraScroll.current = Math.max(0, track.scrollWidth - window.innerWidth);
      wrapper.style.height = `calc(100vh + ${extraScroll.current}px)`;
    };

    const update = () => {
      const rect = wrapper.getBoundingClientRect();
      const progress = Math.min(Math.max(-rect.top / extraScroll.current, 0), 1);
      track.style.transform = `translate3d(${-progress * extraScroll.current}px, 0, 0)`;
      frame.current = null;
    };

    const onScroll = () => {
      if (frame.current !== null) return;
      frame.current = requestAnimationFrame(update);
    };

    measure();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <section ref={wrapperRef} className="relative w-full">
      <div className="sticky top-0 h-screen overflow-hidden flex items-center">
        <div ref={trackRef} className="flex items-center gap-4 md:gap-6 pl-6 md:pl-8 pr-6 md:pr-8 will-change-transform">
          {items.map((item) => (
            <figure key={item._id} className="flex flex-col gap-3 shrink-0">
              <div className="overflow-hidden rounded-[4px] bg-background border border-white/10 h-[56vh] md:h-[68vh] aspect-square">
                <img
                  src={urlForImage(item.image).width(1000).quality(85).url()}
                  alt={item.alt}
                  loading="lazy"
                  className="w-full h-full object-contain"
                />
              </div>
              {item.caption && (
                <figcaption className="text-[13px] font-light text-foreground/60 tracking-[0.01em]">
                  {item.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LabCarousel;

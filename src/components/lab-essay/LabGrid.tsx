import { useEffect, useRef } from "react";
import { LabMedia, useLabItems } from "./galleries/shared";

/**
 * The Lab pieces on the /lab page: a plain editorial grid, normal scroll.
 * Every piece keeps its own format (tall, square, wide) and fades up as it
 * comes into view; videos loop on their own.
 */
const LabGrid = () => {
  const items = useLabItems();
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (!items.length) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }),
      { rootMargin: "0px 0px -10% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [items.length]);

  if (!items.length) return null;

  return (
    <section className="bg-background text-foreground px-3 pt-24 pb-32 md:pt-32" aria-label="Lab pieces">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-12 md:gap-y-16 items-start">
        {items.map((item, i) => (
          <figure
            key={item._id}
            ref={(el) => (refs.current[i] = el)}
            className="reveal"
            style={{ transitionDelay: `${(i % 2) * 100}ms` }}
          >
            <div
              className="overflow-hidden rounded-[4px] bg-white/[0.04]"
              style={{ aspectRatio: String(item.aspect ?? 1) }}
            >
              <LabMedia item={item} fit="cover" />
            </div>
            {(item.caption || item.alt) && (
              <figcaption className="mt-3 text-[14px] tracking-[0.01em] text-foreground/60">{item.caption || item.alt}</figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
};

export default LabGrid;

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProjects } from "@/lib/sanity/queries";
import { urlForImage } from "@/lib/sanity/image";
import type { SanityProject } from "@/lib/sanity/types";

const pad = (i: number) => String(i + 1).padStart(2, "0");

/** Cover image or looping video, cropped to its box. */
const Cover = ({ p }: { p: SanityProject }) =>
  p.coverVideoUrl ? (
    <video src={p.coverVideoUrl} autoPlay muted loop playsInline className="w-full h-full object-cover" />
  ) : (
    <img src={urlForImage(p.cover).width(900).quality(80).url()} alt={p.title} loading="lazy" className="w-full h-full object-cover" />
  );

/**
 * The work as an index: one big name per row. On hover the other rows dim
 * and the project's cover follows the pointer, opening from its middle; on
 * phones (no hover) each cover sits under its name.
 */
const ProjectsGallery = () => {
  const [projects, setProjects] = useState<SanityProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState<number | null>(null);
  const preview = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  useEffect(() => {
    let cancelled = false;
    fetchProjects()
      .then((data) => {
        if (!cancelled) setProjects(data);
      })
      .catch((err) => console.error("Failed to load projects from Sanity:", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // The preview trails the pointer a little, so it glides rather than sticks
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const s = pos.current;
      s.x += (s.tx - s.x) * 0.14;
      s.y += (s.ty - s.y) * 0.14;
      if (preview.current) preview.current.style.transform = `translate3d(${s.x}px,${s.y}px,0) translate(-50%,-50%)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const move = (e: PointerEvent) => {
      pos.current.tx = e.clientX;
      pos.current.ty = e.clientY;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
    };
  }, []);

  return (
    <section id="work" className="relative z-10 w-full bg-background">
      {!loading && projects.length === 0 ? (
        <p className="px-5 md:px-10 text-[14px] font-normal text-foreground/60">No projects published yet.</p>
      ) : (
        <div className="px-5 md:px-10 pt-0 pb-20 md:pb-32" onMouseLeave={() => setHover(null)}>
          <ol className="border-t border-foreground/15">
            {projects.map((p, i) => (
              <li key={p._id} className="border-b border-foreground/15">
                <Link
                  to={`/work/${p.slug}`}
                  onMouseEnter={() => setHover(i)}
                  className={`group grid grid-cols-[2.5rem_1fr] md:grid-cols-[4rem_1fr_auto] items-baseline gap-x-4 py-5 md:py-7 transition-colors duration-300 ${
                    hover !== null && hover !== i ? "text-foreground/25" : "text-foreground"
                  }`}
                >
                  <span className="text-[14px] text-foreground/60 tabular-nums tracking-[0.01em]">{pad(i)}</span>
                  <h2 className="font-sans font-black uppercase leading-[0.95] tracking-[-0.01em] text-[clamp(2rem,6vw,6.5rem)] transition-transform duration-500 group-hover:translate-x-3">
                    {p.title}
                  </h2>
                  <span className="hidden md:block text-[14px] text-foreground/60">{(p.tags ?? []).join(" · ")}</span>
                  <span className="md:hidden col-start-2 mt-4 block aspect-[3/2] overflow-hidden rounded-[4px] bg-secondary">
                    <Cover p={p} />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          <div
            ref={preview}
            aria-hidden="true"
            className="hidden md:block fixed left-0 top-0 z-30 pointer-events-none w-[30vw] aspect-[3/2] overflow-hidden rounded-[4px] transition-[opacity,clip-path] duration-500"
            style={{ opacity: hover === null ? 0 : 1, clipPath: hover === null ? "inset(50% 0 50% 0)" : "inset(0 0 0 0)" }}
          >
            {projects.map((p, i) => (
              <div key={p._id} className="absolute inset-0 transition-opacity duration-300" style={{ opacity: hover === i ? 1 : 0 }}>
                <Cover p={p} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default ProjectsGallery;

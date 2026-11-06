import { useEffect, useRef, useState, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { fetchProjects } from "@/lib/sanity/queries";
import { urlForImage } from "@/lib/sanity/image";
import type { SanityProject } from "@/lib/sanity/types";
import { localizeProject, useLang, useT } from "@/lib/i18n";

const pad = (i: number) => String(i + 1).padStart(2, "0");

// The case pages are closed for now: the rows show the work but don't open
// it (set back to true to link them again; App.tsx sends /work/… home too)
export const CASES_OPEN = false;

// Each project's preview has its own shape (width / height), so moving down
// the list changes the rhythm. Covers that are mockups keep the proportion
// they were laid out at, so none of them is cropped; photos and collages
// take the other shapes (CECI square, ISOLA tall).
export const SHAPES: Record<string, number> = {
  "seedtag-design-system": 16 / 9,
  "ceci-makeup": 1,
  mosaic: 3 / 2, // mockup, 900×600
  "seedtag-events": 16 / 10, // mockup, 2880×1800
  "seedtag-emotion-quotient": 3 / 2, // mockup, 1600×1067
  isola: 4 / 5,
};

// Same area for every shape: that of a 3:2 box 32vw (at most 600px) wide
const previewSize = (ratio: number) => {
  const k = Math.sqrt(ratio / 1.5);
  return { width: `min(${(32 * k).toFixed(2)}vw, ${Math.round(600 * k)}px)`, height: `min(${((32 * k) / ratio).toFixed(2)}vw, ${Math.round((600 * k) / ratio)}px)` };
};

/** Cover image or looping video, cropped to its box. */
const Cover = ({ p }: { p: SanityProject }) =>
  p.coverVideoUrl ? (
    <video src={p.coverVideoUrl} autoPlay muted loop playsInline className="w-full h-full object-cover" />
  ) : (
    <img src={urlForImage(p.cover).width(900).quality(80).url()} alt={p.title} loading="lazy" className="w-full h-full object-cover" />
  );

/** A row of the index: a link to its case, or just the row while cases are closed. */
const Row = ({ to, onClick, ...rest }: { to: string; onClick: (e: MouseEvent<HTMLAnchorElement>) => void; onMouseEnter: () => void; className: string; children: React.ReactNode }) =>
  CASES_OPEN ? <Link to={to} onClick={onClick} {...rest} /> : <div {...rest} />;

/**
 * The work as an index: one big name per row. On hover the other rows dim
 * and the project's cover follows the pointer, opening from its middle; on
 * phones (no hover) each cover sits under its name.
 */
const ProjectsGallery = () => {
  const [raw, setProjects] = useState<SanityProject[]>([]);
  const lang = useLang();
  const t = useT();
  const projects = raw.map((p) => localizeProject(p, lang));
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState<number | null>(null);
  const navigate = useNavigate();
  // Opening a project: the row slides up into the case page's header and the
  // cover under the pointer grows into its big image (a view
  // transition where the browser has them; a plain page change elsewhere).
  const open = (e: MouseEvent<HTMLAnchorElement>, slug: string, i: number) => {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (!doc.startViewTransition || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    const row = e.currentTarget;
    row.style.setProperty("view-transition-name", "project-row");
    // The cover that follows the pointer grows into the case's big image
    if (window.matchMedia("(hover: hover)").matches) preview.current?.style.setProperty("view-transition-name", "project-cover");
    doc.startViewTransition(() => {
      flushSync(() => navigate(`/work/${slug}`, { state: { index: i } }));
      window.scrollTo(0, 0);
    });
  };
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
    <section id="work" className="relative z-10 w-full bg-background text-foreground">
      {/* Edge-to-edge line where the projects sheet begins: it parts it from the hero */}
      <div aria-hidden="true" className="absolute top-0 inset-x-0 h-px bg-foreground/15" />
      {!loading && projects.length === 0 ? (
        <p className="px-3 text-[14px] font-normal text-foreground/60">No projects published yet.</p>
      ) : (
        <div className="px-3 pt-20 pb-20 md:pt-28 md:pb-32" onMouseLeave={() => setHover(null)}>
          <ol>
            {projects.map((p, i) => (
              <li key={p._id} className="-mx-3 px-3 border-b border-foreground/15">
                <Row
                  to={`/work/${p.slug}`}
                  onMouseEnter={() => setHover(i)}
                  onClick={(e: MouseEvent<HTMLAnchorElement>) => open(e, p.slug, i)}
                  className={`group grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[4rem_minmax(0,1fr)_auto] items-baseline gap-x-4 py-6 md:py-8 transition-colors duration-300 ${
                    hover !== null && hover !== i ? "text-foreground/25" : "text-foreground"
                  }`}
                >
                  {/* Phones: the number goes to the right of the name, so the cover can take the full width */}
                  <span className="order-2 md:order-none justify-self-end md:justify-self-auto text-[14px] opacity-60 tabular-nums tracking-[0.01em]">{pad(i)}</span>
                  {/* One line per name, so every row is the same height */}
                  <h2 className="order-1 md:order-none font-display font-normal leading-[1.15] tracking-[-0.02em] text-[clamp(1.5rem,4.2vw,4.75rem)] whitespace-nowrap overflow-hidden text-ellipsis transition-transform duration-500 group-hover:translate-x-3">
                    {p.title}
                  </h2>
                  <span className="hidden md:block text-[14px] opacity-60">{(p.tags ?? []).join(" · ")}</span>
                  <span className="md:hidden order-3 col-span-2 mt-4 block aspect-[3/2] overflow-hidden rounded-[4px] bg-secondary">
                    <Cover p={p} />
                  </span>
                </Row>
              </li>
            ))}
          </ol>
          <div
            ref={preview}
            aria-hidden="true"
            className="hidden md:block fixed left-0 top-0 z-30 pointer-events-none overflow-hidden rounded-[4px] transition-[opacity,clip-path,width,height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              ...previewSize(SHAPES[projects[hover ?? -1]?.slug ?? ""] ?? 1.5),
              opacity: hover === null ? 0 : 1,
              clipPath: hover === null ? "inset(50% 0 50% 0)" : "inset(0 0 0 0)",
            }}
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

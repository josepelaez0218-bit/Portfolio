import { useEffect, useRef, useState, type CSSProperties } from "react";
import { localizeProject, useLang } from "@/lib/i18n";
import { fetchProjects } from "@/lib/sanity/queries";
import { urlForImage } from "@/lib/sanity/image";
import type { SanityProject } from "@/lib/sanity/types";
import { SHAPES } from "@/components/ProjectsGallery";

// Taken from Jose's CV: nothing here is rounded up or made up
const COPY = {
  en: {
    title: "Product, brand & web.",
    lead: "Product designer working across systems, AI and brand — bridging product and marketing to build digital experiences that scale, and seeing them through to launch.",
    services: [
      { name: "Product design", line: "UX/UI for internal tools and AI-driven products, from user flows and research to the final interface." },
      { name: "Design systems", line: "Components, patterns and tone shared across products, so teams build faster and stay consistent." },
      { name: "Brand identity", line: "Naming, logo and visual identity, with an editorial eye from a background in photography." },
      { name: "Web", line: "Websites and landing pages designed and built end to end, ready to grow with the business." },
    ],
  },
  es: {
    title: "Producto, marca y web.",
    lead: "Diseñador de producto entre sistemas, IA y marca. Conecto producto y marketing para crear experiencias digitales que escalan, y las acompaño hasta el lanzamiento.",
    services: [
      { name: "Diseño de producto", line: "UX/UI para herramientas internas y productos con IA, desde los flujos y la investigación hasta la interfaz final." },
      { name: "Sistemas de diseño", line: "Componentes, patrones y tono compartidos entre productos, para que los equipos construyan más rápido y con coherencia." },
      { name: "Identidad de marca", line: "Naming, logotipo e identidad visual, con una mirada editorial que viene de la fotografía." },
      { name: "Web", line: "Webs y landings diseñadas y desarrolladas de principio a fin, listas para crecer con el negocio." },
    ],
  },
} as const;

// The section's own colours (HSL, like the site's tokens), so every
// text-foreground/… inside takes them: a black sheet between the white ones
const vars = { ["--background" as string]: "0 0% 4%", ["--foreground" as string]: "0 0% 96%" } as CSSProperties;

const pad = (i: number) => String(i + 1).padStart(2, "0");

// How the pictures open out before settling: "row" (side by side) or "fan"
const OPEN: "row" | "fan" = "row";

// The project shown under each service, in order
const PICTURES = ["mosaic", "seedtag-design-system", "ceci-makeup", "seedtag-events"];

const Cover = ({ p }: { p: SanityProject }) =>
  p.coverVideoUrl ? (
    <video src={p.coverVideoUrl} autoPlay muted loop playsInline className="w-full h-full object-cover" />
  ) : (
    <img src={urlForImage(p.cover).width(1000).quality(80).url()} alt={p.title} loading="lazy" className="w-full h-full object-cover" />
  );

type Rect = { x: number; y: number; w: number; h: number };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (a: Rect, b: Rect, t: number): Rect => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) });
// Sine in-out: gentle at both ends
const ease = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const span = (p: number, a: number, b: number) => Math.min(1, Math.max(0, (p - a) / (b - a)));

/**
 * What Jose does and the experience behind it, between the work and the
 * contact, on a black sheet: a big title, then the four services in a
 * staggered row, each with a picture of a project that shows it.
 */
const Services = () => {
  const lang = useLang();
  const c = COPY[lang];
  const [projects, setProjects] = useState<SanityProject[]>([]);
  const pictures = PICTURES.map((slug) => projects.find((p) => p.slug === slug)).map((p) => p && localizeProject(p, lang));
  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch((err) => console.error("Failed to load projects from Sanity:", err));
  }, []);

  // Wide screens: the services hold still while the scroll plays the pictures —
  // one rises from the bottom, the others fan out from behind it, then each
  // settles under its own column
  const [wide, setWide] = useState(() => window.matchMedia("(min-width: 1024px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const wrap = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const cards = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!wide) return;
    // Where each picture is now; every frame it eases towards where the
    // scroll wants it, so it moves with some weight instead of being dragged
    const now: (Rect & { r: number })[] = [];
    const lift: number[] = [];
    let raf = 0;
    let visible = false;
    const tick = () => {
      raf = 0;
      const w = wrap.current, st = stage.current;
      if (!w || !st) return;
      const vh = window.innerHeight, vw = st.clientWidth;
      const box = st.getBoundingClientRect();
      const r = w.getBoundingClientRect();
      // Text first: the pictures wait until the block has slid all the way up
      // over the title, so nothing lands on the texts while they come in
      const p = Math.min(1, Math.max(0, -r.top / (r.height - vh)));
      const base = Math.min(vw * 0.24, 380);
      const pileH = base / 1.25;
      let moving = false;
      // The texts start as a staircase and rise into one line as the
      // pictures settle, each column a beat after the one before
      items.current.forEach((el, i) => {
        if (!el) return;
        const goal = (48 + i * 64) * (1 - ease(span(p - i * 0.03, 0, 0.85)));
        lift[i] ??= goal;
        lift[i] += (goal - lift[i]) * 0.12;
        if (Math.abs(goal - lift[i]) > 0.3) moving = true;
        el.style.transform = `translate3d(0,${lift[i]}px,0)`;
      });
      const textBottom = Math.max(...items.current.map((el) => el?.getBoundingClientRect().bottom ?? 0));
      cards.current.forEach((el, i) => {
        const li = items.current[i];
        if (!el || !li) return;
        const ratio = SHAPES[PICTURES[i]] ?? 1.5;
        // Each picture runs a little behind the one before it
        const order = [2, 0, 1, 3][i];
        const q = Math.min(1, Math.max(0, (p - order * 0.035) / (1 - 0.105)));
        // At the end: under its column, at its own proportion, all their tops
        // on one line below the longest text
        const col = li.getBoundingClientRect();
        const end: Rect = { x: col.left - box.left, y: textBottom - box.top + 32, w: col.width, h: col.width / ratio };
        // The pile: all together in the middle, below the bottom edge
        // (measured from the screen's bottom edge, not the block's, since the
        // block may still be sliding up)
        const bottom = vh - box.top;
        const hidden: Rect = { x: vw / 2 - base / 2, y: bottom + 40, w: base, h: pileH };
        const risen: Rect = { ...hidden, y: bottom - pileH * 0.85 };
        const off = [-1.5, -0.5, 0.5, 1.5][i];
        // Opening out: a straight row, side by side at the same height (or,
        // with OPEN = "fan", held like a hand of cards, the middle two in front)
        const k = OPEN === "fan" && Math.abs(off) > 1 ? 0.8 : 1;
        const fan: Rect =
          OPEN === "fan"
            ? { x: vw / 2 - (base * k) / 2 + off * base * 0.62, y: bottom - pileH * k * 0.95 + Math.abs(off) * 14, w: base * k, h: pileH * k }
            : { x: vw / 2 - base / 2 + off * (base + 12), y: bottom - pileH * 0.95, w: base, h: pileH };
        // Overlapping phases with soft curves, so there are no corners
        const up = ease(span(q, 0, 0.24));
        const open = ease(span(q, 0.2, 0.55));
        const settle = ease(span(q, 0.48, 0.92));
        const target = mix(mix(mix(hidden, risen, up), fan, open), end, settle);
        const tilt = OPEN === "fan" ? off * 4 * open * (1 - settle) : 0;
        // Ease towards the target: weight, a touch of drag
        const c = (now[i] ??= { ...target, r: tilt });
        const f = 0.12;
        c.x += (target.x - c.x) * f;
        c.y += (target.y - c.y) * f;
        c.w += (target.w - c.w) * f;
        c.h += (target.h - c.h) * f;
        c.r += (tilt - c.r) * f;
        if (Math.abs(target.y - c.y) + Math.abs(target.x - c.x) + Math.abs(target.w - c.w) > 0.3) moving = true;
        el.style.transform = `translate3d(${c.x}px,${c.y}px,0) rotate(${c.r}deg)`;
        el.style.width = `${c.w}px`;
        el.style.height = `${c.h}px`;
      });
      // Keep going while something still has to arrive
      if (visible && moving) raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) kick();
    });
    if (wrap.current) io.observe(wrap.current);
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      cancelAnimationFrame(raf);
    };
  }, [wide, projects.length]);

  return (
    <section id="services" className="relative w-full bg-background text-foreground" style={vars}>
      {/* The title holds at the top while the services slide up over it */}
      <div className="sticky top-0 z-0 px-3 pt-20 md:pt-28 pb-16 md:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-6 items-end">
          <h2 className="lg:col-span-8 font-display font-normal leading-[0.95] tracking-[-0.03em] text-[clamp(3rem,9vw,9rem)] text-balance">
            {c.title}
          </h2>
          <p className="lg:col-span-4 text-[16px] md:text-[18px] leading-[1.5] text-foreground/80 max-w-[44ch] lg:justify-self-end lg:text-right">
            {c.lead}
          </p>
        </div>
      </div>

      {/* The services, each a little lower than the one before. On wide
          screens this block is three screens tall and its content holds still
          while the pictures play; it slides up over the title first. */}
      <div ref={wrap} className="relative z-10 bg-background border-t border-foreground/20" style={wide ? { height: "300svh" } : undefined}>
        <div ref={stage} className={wide ? "sticky top-0 h-[100svh] overflow-hidden" : "min-h-[100svh]"}>
          <ol className="px-3 pt-8 md:pt-10 pb-20 md:pb-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {c.services.map((s, i) => (
              <li key={s.name} className={`flex flex-col gap-3 self-start ${wide ? "" : ["", "md:mt-16", "", "md:mt-16"][i]}`}>
                <div ref={(el) => (items.current[i] = el as HTMLLIElement | null)} className="flex flex-col gap-3">
                  <span className="text-[14px] text-foreground/60 tabular-nums tracking-[0.01em]">{pad(i)}</span>
                  <h3 className="font-display font-normal leading-[1.1] tracking-[-0.02em] text-[28px] md:text-[32px]">{s.name}</h3>
                  <p className="text-[14px] leading-[1.5] tracking-[0.01em] text-foreground/70 max-w-[38ch]">{s.line}</p>
                </div>
                {/* Phones and tablets: the picture simply sits under its text */}
                {!wide && pictures[i] && (
                  <div className="mt-3 overflow-hidden rounded-[4px] bg-secondary" style={{ aspectRatio: String(SHAPES[PICTURES[i]] ?? 1.5) }}>
                    <Cover p={pictures[i]!} />
                  </div>
                )}
              </li>
            ))}
          </ol>
          {wide &&
            pictures.map((p, i) =>
              p ? (
                <div
                  key={p._id}
                  ref={(el) => (cards.current[i] = el)}
                  aria-hidden="true"
                  className="absolute left-0 top-0 origin-bottom overflow-hidden rounded-[4px] bg-secondary will-change-transform"
                  style={{ zIndex: [1, 3, 2, 0][i], transform: "translate3d(0,100vh,0)" }}
                >
                  <Cover p={p} />
                </div>
              ) : null,
            )}
        </div>
      </div>

    </section>
  );
};

export default Services;

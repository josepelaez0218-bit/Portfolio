import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { contactEmail } from "@/lib/siteTexts";
import {
  DATA_NEEDED,
  DS_STATS,
  FIGURES,
  GREYS_ALL,
  HEADINGS_HOME,
  PER_SITE,
  RADII,
  REDS_ALL,
  SIZES_ALL,
  SIZES_IDEAL,
  SIZES_MAIN,
  IMG,
  PHASES,
  REDS,
  SCORE,
  SHOTS,
  SOCIAL,
  STATE_LABEL,
  TECH,
  UNITS,
  CONFIDENCE_LABEL,
  FAMILIES,
  FUNNEL,
  IMPACT,
  PRIORITY_LABEL,
  TYPE_SITES,
  WEIGHTS,
  QUICK_WINS_TAGGED,
  TAGS,
  type Confidence,
  type Priority,
  type Shot,
  type State,
} from "./nebrijaData";

/**
 * /informes/nebrija — a brand audit written for one reader (Universidad
 * Nebrija), unlisted and out of search engines. Built from the site's own
 * pieces: Funnel Display titles, Platypi leads, Inter 14/16px, hairlines,
 * #f5f5f5 plates with 10px corners, black pills, the case-page nav card.
 * Reading aids: a side index that follows the scroll (a bar with a sheet on
 * phones), a reading-progress line, a 30-second summary that links into each
 * section, and pictures that open full screen.
 */

const SECTIONS = [
  { id: "resumen", label: "En 30 segundos" },
  { id: "cifras", label: "Nebrija en cifras" },
  { id: "arquitectura", label: "Arquitectura de marca" },
  { id: "logotipo", label: "Logotipo" },
  { id: "color", label: "Color" },
  { id: "tipografia", label: "Tipografía" },
  { id: "sistema", label: "Sistema de diseño" },
  { id: "fotografia", label: "Fotografía" },
  { id: "web", label: "Web principal" },
  { id: "movil", label: "Móvil" },
  { id: "institutos", label: "Institutos y servicios" },
  { id: "tecnica", label: "Calidad técnica" },
  { id: "redes", label: "Redes sociales" },
  { id: "fortalezas", label: "Lo que funciona" },
  { id: "propuesta", label: "Propuesta" },
  { id: "impacto", label: "Impacto esperado" },
  { id: "siguiente", label: "Siguiente paso" },
] as const;

const num = (id: string) => String(SECTIONS.findIndex((s) => s.id === id) + 1).padStart(2, "0");


// ——— Small pieces ———

const STATE_LOOK: Record<State, { chip: string; dot: string }> = {
  critico: { chip: "bg-[#FDECEC] text-[#B42318]", dot: "bg-[#D92D20]" },
  mejorable: { chip: "bg-[#FEF4E6] text-[#A15C07]", dot: "bg-[#F79009]" },
  correcto: { chip: "bg-[#E8F6EE] text-[#067647]", dot: "bg-[#17B26A]" },
};

const Chip = ({ state }: { state: State }) => (
  <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium tracking-[0.01em] ${STATE_LOOK[state].chip}`}>
    <span aria-hidden="true" className={`size-1.5 rounded-full ${STATE_LOOK[state].dot}`} />
    {STATE_LABEL[state]}
  </span>
);

const PRIORITY_LOOK: Record<Priority, string> = {
  1: "bg-foreground text-background",
  2: "border border-foreground/40 text-foreground",
  3: "border border-foreground/15 text-foreground/60",
};

const PriorityTag = ({ p, short = false }: { p: Priority; short?: boolean }) => (
  <span className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[12px] font-medium tracking-[0.01em] tabular-nums ${PRIORITY_LOOK[p]}`}>
    {short ? `P${p}` : `P${p} · ${PRIORITY_LABEL[p]}`}
  </span>
);

const Tag = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex shrink-0 items-center rounded-full bg-[#f5f5f5] px-3 py-1 text-[12px] font-medium tracking-[0.01em] text-foreground/70">{children}</span>
);

const Label = ({ children }: { children: ReactNode }) => (
  <p className="text-[14px] font-medium text-foreground/60 tracking-[0.01em]">{children}</p>
);

const Body = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <p className={`text-[16px] leading-[1.6] text-foreground/70 max-w-[60ch] ${className}`}>{children}</p>
);

/** "Por qué importa" / "Qué propongo": the two lines every section ends on */
const Takeaway = ({ why, what }: { why: string; what: string }) => (
  <div className="grid gap-6 md:grid-cols-2 md:gap-10 border-t border-foreground/15 pt-6">
    <div className="flex flex-col gap-2">
      <Label>Por qué importa</Label>
      <p className="text-[16px] leading-[1.6] text-foreground">{why}</p>
    </div>
    <div className="flex flex-col gap-2">
      <Label>Qué propongo</Label>
      <p className="text-[16px] leading-[1.6] text-foreground">{what}</p>
    </div>
  </div>
);

const Figure = ({ shot, onOpen, className = "", tall = false }: { shot: Shot; onOpen: (s: Shot) => void; className?: string; tall?: boolean }) => (
  <figure className={`flex flex-col gap-3 min-w-0 ${className}`}>
    <button
      type="button"
      onClick={() => onOpen(shot)}
      aria-label={`Ampliar: ${shot.title}`}
      className="group relative block overflow-hidden rounded-[10px] bg-[#f5f5f5] after:pointer-events-none after:absolute after:inset-0 after:rounded-[10px] after:border after:border-foreground/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground cursor-zoom-in"
    >
      <img
        src={shot.src}
        width={shot.w}
        height={shot.h}
        alt={shot.alt}
        loading="lazy"
        decoding="async"
        className={`block w-full h-auto transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.015] ${tall ? "max-h-[78vh] object-contain" : ""}`}
      />
    </button>
    <figcaption className="text-[14px] leading-[1.5] text-foreground/60 max-w-[60ch]">
      <span className="font-medium text-foreground">{shot.title}.</span> {shot.caption}
    </figcaption>
  </figure>
);

const Section = ({ id, title, lead, children }: { id: string; title: string; lead?: string; children?: ReactNode }) => (
  <section id={id} data-audit-section className="scroll-mt-20 lg:scroll-mt-6 border-t border-foreground/15 px-3 lg:px-10 py-16 md:py-24 flex flex-col gap-10">
    <header className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="flex flex-col gap-2 min-w-0">
          <span className="text-[14px] text-foreground/60 tabular-nums">{num(id)}</span>
          <h2 className="font-display font-normal leading-[1.1] tracking-[-0.02em] text-[28px] md:text-[40px] text-balance">{title}</h2>
        </div>
        {TAGS[id] && (
          <div className="flex flex-wrap gap-2 md:self-end md:pb-1.5 ml-auto">
            <Chip state={TAGS[id].state} />
            {TAGS[id].priority && <PriorityTag p={TAGS[id].priority!} />}
          </div>
        )}
      </div>
      {lead && <p className="text-lead text-foreground max-w-[40ch] text-balance">{lead}</p>}
    </header>
    {children}
  </section>
);

/** Rows that read as a table on wide screens and as stacked cards on phones */
const Rows = ({ head, rows }: { head: string[]; rows: ReactNode[][] }) => {
  const cols = { "--cols": `repeat(${head.length}, minmax(0,1fr))` } as React.CSSProperties;
  const grid = "grid grid-cols-1 md:[grid-template-columns:var(--cols)] gap-x-6";
  return (
    <div className="border-y border-foreground/15">
      <div className={`hidden md:grid ${grid} py-3 text-[12px] font-medium uppercase tracking-[0.06em] text-foreground/50`} style={cols}>
        {head.map((h) => (
          <span key={h}>{h}</span>
        ))}
      </div>
      {rows.map((r, i) => (
        <div key={i} className={`${grid} gap-y-1 py-4 border-t border-foreground/10 md:items-baseline text-[15px] leading-[1.5]`} style={cols}>
          {r.map((cell, k) => (
            <div key={k} className={`min-w-0 ${k === 0 ? "font-medium text-foreground" : "text-foreground/70"}`}>
              {k > 0 && <span className="md:hidden text-[12px] uppercase tracking-[0.06em] text-foreground/45 mr-2">{head[k]}</span>}
              {cell}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const CONF_LOOK: Record<Confidence, string> = {
  alta: "bg-[#E8F6EE] text-[#067647]",
  media: "bg-[#FEF4E6] text-[#A15C07]",
  baja: "bg-foreground/[0.06] text-foreground/60",
  medir: "border border-foreground/20 text-foreground/70",
};

const ConfidenceTag = ({ c }: { c: Confidence }) => (
  <span className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[12px] font-medium tracking-[0.01em] ${CONF_LOOK[c]}`}>{CONFIDENCE_LABEL[c]}</span>
);

// ——— Charts (plain HTML, drawn to scale from the data) ———

/** Horizontal bars; `ghost` draws a second, lighter value on the same track */
const Bars = ({
  items,
  max,
  unit = "",
  legend,
}: {
  items: { label: string; value: number; ghost?: number; display?: string; strong?: boolean }[];
  max: number;
  unit?: string;
  legend?: [string, string];
}) => (
  <figure className="flex flex-col gap-3">
    {legend && (
      <div className="flex flex-wrap gap-5 text-[13px] text-foreground/60">
        <span className="flex items-center gap-2"><i className="inline-block size-2.5 rounded-[2px] bg-[var(--chart)]" />{legend[0]}</span>
        <span className="flex items-center gap-2"><i className="inline-block size-2.5 rounded-[2px] bg-[var(--chart-soft)]" />{legend[1]}</span>
      </div>
    )}
    <ul className="flex flex-col gap-3">
      {items.map((it) => (
        <li key={it.label} className="grid grid-cols-[minmax(0,9rem)_1fr] md:grid-cols-[12rem_1fr] items-center gap-4">
          <span className={`text-[14px] leading-[1.3] ${it.strong ? "font-medium text-foreground" : "text-foreground/70"}`}>{it.label}</span>
          <span className="flex flex-col gap-1">
            <span className="flex items-center gap-3">
              <span className={`h-3 rounded-[2px] ${it.strong === false ? "bg-[var(--chart-mid)]" : "bg-[var(--chart)]"}`} style={{ width: `${Math.max(0.6, (it.value / max) * 100)}%` }} />
              <span className="text-[14px] tabular-nums whitespace-nowrap">{it.display ?? `${it.value}${unit}`}</span>
            </span>
            {it.ghost !== undefined && (
              <span className="flex items-center gap-3">
                <span className="h-2 rounded-[2px] bg-[var(--chart-soft)]" style={{ width: `${Math.max(0.6, (it.ghost / max) * 100)}%` }} />
                <span className="text-[12px] tabular-nums text-foreground/50">{it.ghost}</span>
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  </figure>
);

/** Every font size found, as ticks on one ruler, against a closed scale */
const TypeRuler = () => {
  const MIN = 10;
  const MAX = 94;
  const x = (v: number) => `${((v - MIN) / (MAX - MIN)) * 100}%`;
  const rows = [
    { label: "Todo el ecosistema", n: SIZES_ALL.length, sizes: SIZES_ALL, tone: "bg-[var(--chart)]" },
    { label: "Solo nebrija.com", n: SIZES_MAIN.length, sizes: SIZES_MAIN, tone: "bg-[var(--chart-mid)]" },
    { label: "Una escala cerrada", n: SIZES_IDEAL.length, sizes: SIZES_IDEAL, tone: "bg-foreground/25" },
  ];
  return (
    <figure className="flex flex-col gap-5">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-1 md:grid-cols-[12rem_1fr] gap-2 md:gap-4 md:items-center">
          <span className="text-[14px] text-foreground/70">
            <span className="font-medium text-foreground tabular-nums">{r.n}</span> · {r.label}
          </span>
          <div className="relative h-10 border-b border-foreground/20">
            {r.sizes.map((s) => (
              <span key={s} title={`${s}px`} className={`absolute bottom-0 w-px ${r.tone}`} style={{ left: x(s), height: `${30 + ((s - MIN) / (MAX - MIN)) * 70}%` }} />
            ))}
          </div>
        </div>
      ))}
      <div className="grid grid-cols-1 md:grid-cols-[12rem_1fr] gap-4">
        <span className="hidden md:block" />
        <div className="relative h-4 text-[12px] text-foreground/50 tabular-nums">
          {[12, 16, 24, 40, 56, 80].map((v) => (
            <span key={v} className="absolute -translate-x-1/2" style={{ left: x(v) }}>{v}px</span>
          ))}
        </div>
      </div>
      <figcaption className="text-[14px] text-foreground/60 max-w-[60ch]">
        Cada línea es un tamaño de letra en uso. Muchos son decimales (12,28 px, 19,1 px, 50,75 px): tamaños calculados sobre la marcha, no elegidos.
      </figcaption>
    </figure>
  );
};

/** Which sizes each heading level takes: the hierarchy, drawn */
const HeadingPlot = () => {
  const MAX = 80;
  return (
    <figure className="flex flex-col gap-4">
      {HEADINGS_HOME.map((h) => (
        <div key={h.tag} className="grid grid-cols-[3rem_1fr] items-center gap-4">
          <span className="text-[14px] font-medium tabular-nums">{h.tag}</span>
          <div className="relative h-12 border-b border-foreground/15">
            {h.sizes.map((s) => (
              <span key={s} className="absolute bottom-0 -translate-x-1/2 flex flex-col items-center gap-1" style={{ left: `${(s / MAX) * 100}%` }}>
                <span className="text-[11px] tabular-nums text-foreground/60">{s}</span>
                <span className="rounded-full bg-[var(--chart)]" style={{ width: 6 + s / 6, height: 6 + s / 6 }} />
              </span>
            ))}
          </div>
        </div>
      ))}
      <figcaption className="text-[14px] text-foreground/60 max-w-[60ch]">
        Tamaños (en px) de cada nivel de título en la portada de nebrija.com. Un H3 y un H4 llegan a 76 px; el H1, el título principal, se queda en 40 px.
      </figcaption>
    </figure>
  );
};

/** N phone screens, drawn as small rectangles */
const Screens = ({ n, label, light = false }: { n: number; label: string; light?: boolean }) => (
  <div className="flex flex-col gap-2">
    <span className="text-[14px] text-foreground/70">
      <span className="font-medium text-foreground tabular-nums">{n}</span> pantallas · {label}
    </span>
    <div className="flex flex-wrap gap-1">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className={`h-7 w-[14px] rounded-[3px] ${light ? "bg-[var(--chart-soft)]" : "bg-[var(--chart)]"}`} />
      ))}
    </div>
  </div>
);


/** Every size a site uses, rendered: the sample word at each size, and how often it appears */
const Waterfall = () => {
  const [id, setId] = useState(TYPE_SITES[0].id);
  const site = TYPE_SITES.find((t) => t.id === id)!;
  const maxUse = Math.max(...site.sizes.map(([, n]) => n), 1);
  const once = site.sizes.filter(([, n]) => n === 1).length;
  const decimals = site.sizes.filter(([s]) => !Number.isInteger(s)).length;
  return (
    <figure className="flex flex-col gap-5">
      <div role="tablist" aria-label="Elegir web" className="flex flex-wrap gap-2">
        {TYPE_SITES.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={t.id === id}
            onClick={() => setId(t.id)}
            className={`rounded-full px-4 py-2 text-[14px] tracking-[0.01em] transition-colors duration-300 ${t.id === id ? "bg-[var(--chart)] text-white" : "bg-[#f5f5f5] text-foreground/70 hover:text-foreground"}`}
          >
            {t.site} <span className="tabular-nums opacity-70">· {t.sizes.length}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-8 gap-y-2 text-[14px] text-foreground/70">
        <span><span className="font-medium text-foreground tabular-nums">{site.sizes.length}</span> tamaños</span>
        {!site.ideal && <span><span className="font-medium text-foreground tabular-nums">{decimals}</span> con decimales</span>}
        {!site.ideal && <span><span className="font-medium text-foreground tabular-nums">{once}</span> usados una sola vez</span>}
        <span>Familia: <span className="font-medium text-foreground">{site.family}</span></span>
      </div>
      <div className="rounded-[10px] border border-foreground/10 overflow-hidden">
        {site.sizes.map(([size, n]) => (
          <div key={size} className="grid grid-cols-[4.5rem_1fr] md:grid-cols-[5rem_1fr_9rem] items-center gap-x-4 border-t border-foreground/10 first:border-t-0 px-4 py-2">
            <span className={`text-[13px] tabular-nums ${Number.isInteger(size) ? "text-foreground/60" : "text-[#A15C07] font-medium"}`}>{String(size).replace(".", ",")} px</span>
            <span className="min-w-0 overflow-hidden whitespace-nowrap leading-[1.15] text-foreground" style={{ fontSize: size, fontFamily: site.css, fontWeight: size > 30 ? 700 : 400 }}>
              Universidad Nebrija
            </span>
            {!site.ideal && (
              <span className="hidden md:flex items-center gap-2 justify-end">
                {n === 1 && <span className="rounded-full bg-[#FEF4E6] px-2 py-0.5 text-[11px] font-medium text-[#A15C07]">1 uso</span>}
                <span className="h-2 rounded-[2px] bg-[var(--chart)]" style={{ width: `${Math.max(4, (n / maxUse) * 64)}px` }} />
                <span className="w-8 text-right text-[12px] tabular-nums text-foreground/60">{n}</span>
              </span>
            )}
          </div>
        ))}
      </div>
      <figcaption className="text-[14px] text-foreground/60 max-w-[62ch]">
        {site.ideal
          ? "Una escala cerrada: ocho tamaños con saltos claros, elegidos una vez y reutilizados en todas las páginas."
          : "Cada fila es un tamaño de letra que aparece en la portada, con el número de textos que lo usan. En ámbar, los tamaños con decimales: calculados al vuelo, no elegidos."}
      </figcaption>
    </figure>
  );
};

/** The six weights in use, from 100 to 900 */
const WeightStrip = () => (
  <figure className="flex flex-col gap-3">
    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
      {WEIGHTS.map((w) => (
        <div key={w} className="rounded-[10px] bg-[#f5f5f5] px-4 py-5 flex flex-col gap-2">
          <span className="text-[44px] leading-none" style={{ fontFamily: "Roboto, sans-serif", fontWeight: w }}>Aa</span>
          <span className="text-[13px] tabular-nums text-foreground/60">{w}</span>
        </div>
      ))}
    </div>
    <figcaption className="text-[14px] text-foreground/60">Seis pesos en uso, de Thin (100) a Black (900). Con tres bastaría.</figcaption>
  </figure>
);

// ——— Page ———

const NebrijaAudit = () => {
  const [active, setActive] = useState<string>(SECTIONS[0].id);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState<Shot | null>(null);
  const [sheet, setSheet] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const email = contactEmail();

  // The section in view drives the index
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-audit-section]"));
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lightbox: Escape closes, focus goes to the close button
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const go = useCallback((id: string) => {
    setSheet(false);
    document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    history.replaceState(null, "", `#${id}`);
  }, []);

  const activeLabel = SECTIONS.find((s) => s.id === active)?.label ?? "";

  return (
    // Platypi in this report only: Light Italic, so the serif leads stay
    // quieter than the section titles. The rest of the site keeps 400.
    <div className="[&_.text-lead]:!font-light [&_.text-lead]:italic" style={{ "--chart": "#2B4CFF", "--chart-mid": "#8FA2FF", "--chart-soft": "#DCE3FF" } as React.CSSProperties}>
      <Helmet>
        <html lang="es" />
        <title>Auditoría de marca · Universidad Nebrija — Jose Peláez</title>
        <meta name="robots" content="noindex, nofollow, noarchive" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Platypi:ital,wght@1,300&family=Roboto:wght@100;300;400;500;700;900&display=swap" />
        <meta name="description" content="Auditoría de la marca y la presencia digital de la Universidad Nebrija, por Jose Peláez." />
        <meta property="og:title" content="Auditoría de marca · Universidad Nebrija" />
        <meta property="og:description" content="Web, institutos y redes: qué no encaja, por qué importa y cómo construir una marca a la altura de sus datos." />
        <meta property="og:image" content={`https://www.josepelaez.es${IMG}/logos.jpg`} />
      </Helmet>

      {/* Reading progress */}
      <div aria-hidden="true" className="print:hidden fixed inset-x-0 top-0 z-[210] h-[2px] bg-transparent">
        <div className="h-full bg-foreground origin-left" style={{ transform: `scaleX(${progress})` }} />
      </div>

      {/* The case pages' nav card */}
      <nav aria-label="Informe" className="print:hidden fixed left-3 top-3 z-[200] flex items-center gap-6 rounded-[4px] bg-white pl-4 pr-4 py-3 text-[14px] tracking-[0.01em]">
        <Link to="/" className="font-medium text-foreground/70 transition-colors duration-300 hover:text-foreground">
          Jose Peláez
        </Link>
        <span className="text-foreground hidden sm:inline">Auditoría · Nebrija</span>
      </nav>

      {/* Phones: where you are, and the index one tap away */}
      <div
        className={`print:hidden lg:hidden fixed inset-x-3 bottom-3 z-[190] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${progress > 0.02 ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0 pointer-events-none"}`}
      >
        <button
          type="button"
          onClick={() => setSheet(true)}
          className="w-full flex items-center justify-between gap-4 rounded-full bg-foreground text-background px-5 py-3.5 text-[14px] font-medium tracking-[0.01em]"
          aria-haspopup="dialog"
        >
          <span className="truncate">
            <span className="tabular-nums text-background/60 mr-2">{num(active)}</span>
            {activeLabel}
          </span>
          <span className="shrink-0 text-background/70">Índice</span>
        </button>
      </div>
      {sheet && (
        <div role="dialog" aria-modal="true" aria-label="Índice" className="lg:hidden fixed inset-0 z-[220] bg-black/40" onClick={() => setSheet(false)}>
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-[16px] bg-white px-5 pt-5 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3">
              <Label>Índice</Label>
              <button type="button" onClick={() => setSheet(false)} className="text-[14px] text-foreground/70 py-2 px-2">
                Cerrar
              </button>
            </div>
            <ol className="flex flex-col">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => go(s.id)}
                    className={`w-full flex items-baseline gap-4 py-3 border-t border-foreground/10 text-left text-[16px] ${s.id === active ? "text-foreground font-medium" : "text-foreground/60"}`}
                  >
                    <span className="tabular-nums text-[14px] w-6">{num(s.id)}</span>
                    {s.label}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* Cover: a 12-column frame. Top line: what it is (left) and the
          ficha (right). Middle: the title (cols 1–8) against the lead and the
          way in (cols 9–12, bottom-aligned). */}
      <header className="px-3 pt-24 md:pt-28 pb-12 md:pb-16 flex flex-col gap-12 md:gap-16">
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-x-6 lg:gap-x-10 gap-y-4 border-b border-foreground/15 pb-5">
          <p className="col-span-2 lg:col-span-6 text-[14px] text-foreground/60 tracking-[0.01em]">Auditoría de marca y presencia digital</p>
          <dl className="col-span-2 lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
            {[
              ["Para", "Universidad Nebrija"],
              ["Por", "Jose Peláez"],
              ["Fecha", "20 nov 2026"],
              ["Lectura", "8 minutos"],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5">
                <dt className="text-[13px] text-foreground/50">{k}</dt>
                <dd className="text-[14px] text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-10 lg:items-end">
          <h1 className="lg:col-span-8 font-display font-normal leading-[1.0] tracking-[-0.03em] text-[clamp(2.6rem,6.4vw,7rem)] text-balance">
            Una universidad con argumentos y sin una marca que los cuente
          </h1>
          <div className="lg:col-span-4 flex flex-col gap-6 lg:pb-3">
            <p className="text-lead text-foreground text-balance">
              Nebrija tiene datos que muchas universidades querrían. Su presencia digital no los transmite: la web, los institutos y las redes parecen de instituciones distintas.
            </p>
            <div className="flex flex-wrap gap-3 print:hidden">
              <button
                type="button"
                onClick={() => go("resumen")}
                className="inline-flex items-center gap-3 rounded-full bg-foreground text-background px-6 py-3.5 text-[14px] font-medium tracking-[0.01em] transition-transform duration-300 hover:scale-[1.04]"
              >
                Empezar por el resumen <span aria-hidden="true">↓</span>
              </button>
            </div>
          </div>
        </div>

      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 print:block">
        {/* Side index (wide screens) */}
        <aside className="print:hidden hidden lg:block lg:col-span-3 border-t border-r border-foreground/15">
          <nav aria-label="Índice del informe" className="sticky top-0 max-h-screen overflow-y-auto px-3 pt-20 pb-10">
            <ol className="flex flex-col">
              {SECTIONS.map((s) => {
                const on = s.id === active;
                return (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        go(s.id);
                      }}
                      aria-current={on ? "true" : undefined}
                      className={`group flex items-center gap-3 py-[7px] text-[14px] tracking-[0.01em] transition-colors duration-300 ${on ? "text-foreground" : "text-foreground/45 hover:text-foreground/80"}`}
                    >
                      <span className={`h-px bg-foreground transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${on ? "w-5" : "w-0"}`} />
                      <span className="tabular-nums w-5">{num(s.id)}</span>
                      <span className="truncate">{s.label}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>
        </aside>

        <main className="lg:col-span-9 print:col-span-12 min-w-0 pb-24 lg:pb-0">
          <Section id="resumen" title="En 30 segundos" lead="Tres ideas para quien solo lea esto.">
            <ol className="grid gap-px bg-foreground/15 border-y border-foreground/15 md:grid-cols-3">
              {[
                ["La marca no tiene un sistema.", "Siete logotipos, ocho rojos, 61 tamaños de letra y 19 estilos de botón: cada unidad ha resuelto su propia versión de Nebrija."],
                ["Los mejores argumentos no se ven.", "Nº1 en inserción laboral y 94,2 % de empleo, a unos 3.000 px del inicio de la portada."],
                ["Hay una base sólida.", "Datos excelentes, un logotipo con historia y una presentación institucional que demuestra que se puede hacer bien."],
              ].map(([t, d], i) => (
                <li key={t} className="bg-background py-6 md:px-6 md:first:pl-0 flex flex-col gap-3">
                  <span className="text-[14px] text-foreground/60 tabular-nums">{i + 1}</span>
                  <p className="font-display text-[22px] leading-[1.2] tracking-[-0.01em]">{t}</p>
                  <p className="text-[15px] leading-[1.55] text-foreground/70">{d}</p>
                </li>
              ))}
            </ol>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <Label>Valoración por áreas · toca una fila para ir a la sección</Label>
                <div className="flex flex-wrap gap-2" aria-label="Leyenda">
                  <Chip state="critico" />
                  <Chip state="mejorable" />
                  <Chip state="correcto" />
                  <PriorityTag p={1} short />
                  <PriorityTag p={2} short />
                  <PriorityTag p={3} short />
                </div>
              </div>
              <ul className="border-y border-foreground/15">
                {SCORE.map((r) => (
                  <li key={r.area} className="border-t border-foreground/10 first:border-t-0">
                    <a
                      href={`#${r.to}`}
                      onClick={(e) => {
                        e.preventDefault();
                        go(r.to);
                      }}
                      className="group grid grid-cols-[1fr_auto] md:grid-cols-[14rem_10rem_1fr_auto] items-center gap-x-6 gap-y-2 py-4"
                    >
                      <span className="text-[16px] font-medium text-foreground">{r.area}</span>
                      <span className="md:order-none order-first col-start-2 row-start-1 md:col-start-auto md:row-start-auto justify-self-end md:justify-self-start">
                        <span className="flex gap-1.5">
                          <Chip state={r.state} />
                          {TAGS[r.to]?.priority && <PriorityTag p={TAGS[r.to].priority!} short />}
                        </span>
                      </span>
                      <span className="col-span-2 md:col-span-1 text-[15px] text-foreground/70">{r.finding}</span>
                      <span aria-hidden="true" className="hidden md:block text-foreground/40 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-foreground">
                        →
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Section>

          <Section id="cifras" title="Nebrija en cifras" lead="El punto de partida es mejor que el de muchos competidores.">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FIGURES.map((f) => (
                <div key={f.value} className="rounded-[4px] bg-[#f5f5f5] px-5 py-5 flex flex-col gap-1.5">
                  <span className="font-display font-normal leading-[1] tracking-[-0.02em] text-[32px] md:text-[40px] tabular-nums">{f.value}</span>
                  <span className="text-[14px] text-foreground/60">{f.label}</span>
                </div>
              ))}
            </div>
            <p className="text-[14px] text-foreground/50">Fuente: presentación institucional Nebrija 2026, con datos de la Memoria 2025/26.</p>
          </Section>

          <Section id="arquitectura" title="Arquitectura de marca" lead="Un ecosistema que ha crecido sin un sistema.">
            <Body>
              Universidad, Business School, institutos, agenda y admisiones tienen cada uno su web, su dominio y su criterio visual. Para un futuro estudiante, pasar de nebrija.com a la web de FP o de idiomas es como cambiar de institución.
            </Body>
            <Rows head={["Unidad", "Dominio", "Plataforma", "Logotipo"]} rows={UNITS.map((u) => [u.unit, <code key="d" className="font-mono text-[13px] break-all">{u.domain}</code>, u.look, u.logo])} />
            <Takeaway
              why="Cada unidad suma su propia imagen en lugar de reforzar una sola marca. El esfuerzo de comunicación se reparte y nadie lo acumula."
              what="Definir una arquitectura: qué es marca madre, qué es submarca y cómo se nombra y se ve cada una, con un solo sistema de plantillas."
            />
          </Section>

          <Section id="logotipo" title="Logotipo" lead="Siete versiones del mismo logotipo.">
            <Figure shot={SHOTS.logos} onOpen={setOpen} />
            <Body>
              La web principal usa solo el texto con serifa. Admisiones, los institutos y Actos añaden el busto. La Business School tiene un bloque rojo propio y en redes el busto aparece en blanco dentro de un círculo. Los descriptores de los institutos usan una sans condensada que no aparece en ninguna otra parte.
            </Body>
            <Takeaway
              why="El logotipo es lo primero que se reconoce. Si cambia en cada canal, no se fija en la memoria."
              what="Una versión principal y sus variantes con reglas claras: cuándo va el busto, cómo se añade un descriptor y en qué tamaño mínimo."
            />
          </Section>

          <Section id="color" title="Color" lead="Tres rojos principales para un solo color de marca.">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {REDS.map((r) => (
                <div key={r.hex} className="flex flex-col overflow-hidden rounded-[10px] border border-foreground/10">
                  <div className="h-28 md:h-36" style={{ background: r.hex }} />
                  <div className="px-4 py-3 flex flex-col gap-0.5">
                    <code className="font-mono text-[14px]">{r.hex}</code>
                    <span className="text-[14px] text-foreground/60">{r.where}</span>
                  </div>
                </div>
              ))}
            </div>
            <Body>
              Los tres más usados, medidos en el código de cada web; en total hay ocho tonos de rojo (ver Sistema de diseño). A ellos se suma un verde para «Inscripciones abiertas» que solo aparece en las fichas de grado. Por separado no se nota; juntos debilitan el único recurso que Nebrija usa en todas partes.
            </Body>
            <Takeaway why="Un color constante es la forma más barata de ser reconocible." what="Un rojo único con su escala de apoyo y colores funcionales (avisos, estados) definidos en el sistema." />
          </Section>

          <Section id="tipografia" title="Tipografía" lead="Fuentes por defecto y una serifa que no se usa.">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {FAMILIES.map((f) => (
                <div key={f.name} className="rounded-[10px] bg-[#f5f5f5] p-6 flex flex-col gap-4">
                  <div className="flex items-baseline justify-between gap-4">
                    <Label>{f.name}</Label>
                    <span className="text-[13px] tabular-nums text-foreground/60">{f.uses} textos</span>
                  </div>
                  <p className="text-[72px] leading-[0.95]" style={{ fontFamily: f.css }}>Aa</p>
                  <p className="text-[18px] leading-[1.3]" style={{ fontFamily: f.css }}>Universidad Nebrija</p>
                  <p className="text-[14px] leading-[1.5] text-foreground/60">{f.note} En {f.where}.</p>
                </div>
              ))}
              <div className="rounded-[10px] border-2 border-dashed border-[var(--chart)] p-6 flex flex-col gap-4">
                <div className="flex items-baseline justify-between gap-4">
                  <Label>La letra de la marca</Label>
                  <span className="text-[13px] font-medium tabular-nums text-[var(--chart)]">0 textos</span>
                </div>
                <img src={`${IMG}/logo-nebrija.png`} width={648} height={252} alt="Logotipo de Universidad Nebrija con su serifa clásica" className="w-full max-w-[240px] h-auto mix-blend-multiply" />
                <p className="text-[14px] leading-[1.5] text-foreground/60">La serifa clásica del logotipo, lo más reconocible de la identidad. No aparece en ningún titular, botón ni pieza de las webs.</p>
              </div>
            </div>
            <p className="text-[13px] text-foreground/50">Muestras en Roboto y en Arial; Arial MT Pro es una variante comercial de Arial.</p>

            <div className="flex flex-col gap-5 pt-4">
              <h3 className="font-display text-[22px] leading-[1.2] tracking-[-0.01em]">Todos los tamaños de cada portada</h3>
              <Waterfall />
            </div>

            <div className="flex flex-col gap-5 pt-4">
              <h3 className="font-display text-[22px] leading-[1.2] tracking-[-0.01em]">Pesos</h3>
              <WeightStrip />
            </div>

            <Takeaway why="La tipografía es la voz de la marca. Con fuentes por defecto y tamaños sin escala, Nebrija suena como cualquier plantilla." what="Una pareja tipográfica propia: una display que herede la serifa del logotipo y una sans de lectura, con una escala cerrada de unos ocho tamaños y tres pesos." />
          </Section>

          <Section id="sistema" title="Sistema de diseño" lead="Un inventario que no cabe en ningún sistema.">
            <Body>
              Hemos medido el estilo real de cada texto, caja y botón visibles en 13 páginas: siete de nebrija.com y las portadas de la Business School, FP, Lenguas Modernas, Competencias, Actos y admisiones. Un sistema de diseño ordenado suele trabajar con unos 8 tamaños de letra, 2 o 3 pesos, un color principal y 3 o 4 estilos de botón.
            </Body>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DS_STATS.map((f) => (
                <div key={f.label} className="rounded-[4px] bg-[#f5f5f5] px-5 py-5 flex flex-col gap-1.5">
                  <span className="font-display font-normal leading-[1] tracking-[-0.02em] text-[32px] md:text-[44px] tabular-nums">{f.value}</span>
                  <span className="text-[14px] text-foreground/60">{f.label}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-5 pt-4">
              <h3 className="font-display text-[22px] leading-[1.2] tracking-[-0.01em]">Tamaños de letra</h3>
              <TypeRuler />
            </div>

            <div className="flex flex-col gap-5 pt-4">
              <h3 className="font-display text-[22px] leading-[1.2] tracking-[-0.01em]">Cada web, sus propias reglas</h3>
              <Bars
                legend={["Tamaños de letra", "Interlineados"]}
                max={26}
                items={PER_SITE.map((p) => ({ label: p.site, value: p.sizes, ghost: p.lh, strong: p.sizes > 12 ? true : undefined }))}
              />
              <p className="text-[14px] text-foreground/60 max-w-[60ch]">
                nebrija.com está más contenida por sí sola: 10 tamaños en siete páginas. El desorden aparece al sumar el resto: FP usa 26 tamaños y 21 interlineados en una sola portada.
              </p>
            </div>

            <div className="flex flex-col gap-5 pt-4">
              <h3 className="font-display text-[22px] leading-[1.2] tracking-[-0.01em]">Una jerarquía al revés</h3>
              <HeadingPlot />
              <p className="text-[14px] text-foreground/60 max-w-[60ch]">
                En Lenguas Modernas, el título de segundo nivel aparece en seis tamaños distintos. En Actos hay doce títulos principales por página, usados como etiquetas de filtros. Para un buscador o un lector de pantalla, la estructura de la página no tiene sentido.
              </p>
            </div>

            <div className="flex flex-col gap-5 pt-4">
              <h3 className="font-display text-[22px] leading-[1.2] tracking-[-0.01em]">Botones</h3>
              <Figure shot={SHOTS.botones} onOpen={setOpen} />
              <Figure shot={SHOTS.admision} onOpen={setOpen} />
            </div>

            <div className="flex flex-col gap-5 pt-4">
              <h3 className="font-display text-[22px] leading-[1.2] tracking-[-0.01em]">Color</h3>
              <div className="flex flex-col gap-2">
                <Label>8 tonos de rojo</Label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
                  {REDS_ALL.map((c) => (
                    <div key={c} className="flex flex-col gap-1.5">
                      <span className="block h-16 rounded-[4px]" style={{ background: c }} />
                      <code className="font-mono text-[11px] text-foreground/60">{c}</code>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>19 tonos de gris</Label>
                <div className="flex h-12 overflow-hidden rounded-[4px] border border-foreground/10">
                  {GREYS_ALL.map((c) => (
                    <span key={c} title={c} className="flex-1" style={{ background: c }} />
                  ))}
                </div>
                <p className="text-[13px] text-foreground/50">Del #111111 al #F1F2F3, muchos casi idénticos entre sí (#191919, #1F1D1B, #212529, #222222).</p>
              </div>
            </div>

            <div className="flex flex-col gap-5 pt-4">
              <h3 className="font-display text-[22px] leading-[1.2] tracking-[-0.01em]">17 radios de esquina</h3>
              <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
                {RADII.map((r) => (
                  <div key={r} className="flex flex-col items-center gap-1.5">
                    <span className="block aspect-square w-full max-w-[64px] border-2 border-foreground" style={{ borderRadius: r === "50%" ? "50%" : r }} />
                    <span className="text-[11px] tabular-nums text-foreground/60">{r}</span>
                  </div>
                ))}
              </div>
              <p className="text-[14px] text-foreground/60 max-w-[60ch]">Desde esquinas casi rectas de 3 px hasta pastillas de 60 px y círculos. A esto se suman 7 sombras distintas y tres sistemas de iconos.</p>
            </div>

            <Takeaway
              why="Sin un sistema, cada página se diseña desde cero: más coste, más tiempo y una marca que nunca termina de parecerse a sí misma."
              what="Un sistema de diseño con una escala tipográfica cerrada, un color principal con su paleta, tres estilos de botón y componentes compartidos por todas las webs."
            />
          </Section>

          <Section id="fotografia" title="Fotografía e iconografía" lead="Sin dirección de arte.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-8">
              <Figure shot={SHOTS.home} onOpen={setOpen} />
              <Figure shot={SHOTS.grado} onOpen={setOpen} />
            </div>
            <Body>
              Velos blancos que restan contraste, imágenes con aspecto de banco de fotos, un collage de banderas en Idiomas y formas diagonales en Competencias. Conviven tres sistemas de iconos (propios, Font Awesome y Glyphicons) y un emoji hace de elemento gráfico en la portada.
            </Body>
            <Takeaway why="Las fotos son lo que más espacio ocupa. Sin un criterio, cada pieza cuenta una universidad distinta." what="Una dirección fotográfica (luz, encuadre, personas reales de Nebrija) y un único set de iconos." />
          </Section>

          <Section id="web" title="Web principal" lead="Una portada larga que esconde lo importante.">
            <Figure shot={SHOTS.completa} onOpen={setOpen} />
            <Body>
              La portada mide unos 21.000 px de alto, con más de 25 bloques y cinco estilos de botón. La jornada de puertas abiertas ocupa la primera pantalla; los argumentos para elegir Nebrija llegan mucho después.
            </Body>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-8">
              <Figure shot={SHOTS.bandaRoja} onOpen={setOpen} />
              <Figure shot={SHOTS.empleabilidad} onOpen={setOpen} />
              <Figure shot={SHOTS.tarjetas} onOpen={setOpen} />
              <Figure shot={SHOTS.campus} onOpen={setOpen} />
              <Figure shot={SHOTS.comunicacion} onOpen={setOpen} />
              <Figure shot={SHOTS.pruebas} onOpen={setOpen} />
              <Figure shot={SHOTS.faq} onOpen={setOpen} />
              <Figure shot={SHOTS.noticias} onOpen={setOpen} />
            </div>
            <Takeaway
              why="Quien llega a la portada decide en segundos si sigue. Si lo primero que ve es un evento, no ve por qué elegir Nebrija."
              what="Una portada corta con un relato: por qué Nebrija, qué estudiar y cómo empezar, y cada perfil a su camino en dos clics."
            />
          </Section>

          <Section id="movil" title="Móvil" lead="26 pantallas de scroll.">
            <Body>
              La mayoría de futuros estudiantes llega desde el móvil. En un iPhone 13 la portada de nebrija.com mide unos 21.700 px y la de FP, unas 23 pantallas.
            </Body>
            <div className="flex flex-col gap-5 rounded-[10px] bg-[#f5f5f5] p-5 md:p-8">
              <Screens n={26} label="portada de nebrija.com" />
              <Screens n={23} label="portada de fpnebrija.com" />
              <Screens n={6} label="una portada de móvil razonable" light />
            </div>
            <div className="grid grid-cols-2 gap-2 max-w-[640px]">
              <Figure shot={SHOTS.movilHome} onOpen={setOpen} tall />
              <Figure shot={SHOTS.movilFp} onOpen={setOpen} tall />
            </div>
            <Takeaway why="En el móvil la paciencia es menor y la pantalla, más pequeña: lo que no aparece pronto no existe." what="Diseñar primero para el móvil: menos bloques, mensajes cortos y una acción clara en la primera pantalla." />
          </Section>

          <Section id="institutos" title="Institutos y servicios" lead="Cada web, una institución distinta.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-8">
              <Figure shot={SHOTS.bschool} onOpen={setOpen} />
              <Figure shot={SHOTS.admisiones} onOpen={setOpen} />
              <Figure shot={SHOTS.fp} onOpen={setOpen} />
              <Figure shot={SHOTS.idiomas} onOpen={setOpen} />
              <Figure shot={SHOTS.competencias} onOpen={setOpen} />
              <Figure shot={SHOTS.actos} onOpen={setOpen} />
            </div>
            <Takeaway why="El paso a admisiones es el momento de más valor; cambiar de imagen justo ahí genera desconfianza." what="Las mismas plantillas para todas las unidades, con un acento propio por instituto dentro del sistema común." />
          </Section>

          <Section id="tecnica" title="Calidad técnica" lead="Accesibilidad, buscadores y rendimiento.">
            <ul className="grid gap-2 md:grid-cols-2">
              {[
                ["Accesibilidad", "En la ficha de grado, 26 de 43 imágenes no tienen texto alternativo; en Actos, 9 de 11."],
                ["Buscadores", "La Business School no tiene meta descripción y usa cuatro H1. Actos usa doce H1 como etiquetas."],
                ["Rendimiento", "La portada carga unos 17 MB, entre seis y diez veces más que el resto de páginas."],
                ["Revisión", "La página de postgrados enlaza a un dominio interno de desarrollo, señal de que no hay revisión antes de publicar."],
              ].map(([t, d]) => (
                <li key={t} className="rounded-[10px] bg-[#f5f5f5] p-5 flex flex-col gap-2">
                  <span className="text-[16px] font-medium">{t}</span>
                  <span className="text-[15px] leading-[1.55] text-foreground/70">{d}</span>
                </li>
              ))}
            </ul>
            <div className="grid gap-10 md:grid-cols-2">
              <div className="flex flex-col gap-4">
                <Label>Peso de cada portada (MB)</Label>
                <Bars
                  max={17}
                  items={TECH.map((r) => {
                    const mb = parseFloat(r.weight.replace("≈", "").replace(",", "."));
                    return { label: r.page, value: mb, display: r.weight, strong: mb > 10 ? true : false };
                  })}
                />
              </div>
              <div className="flex flex-col gap-4">
                <Label>Imágenes sin texto alternativo (%)</Label>
                <Bars
                  max={100}
                  items={TECH.map((r) => {
                    const [a, b] = r.alt.split(" de ").map(Number);
                    const pct = Math.round((a / b) * 100);
                    return { label: r.page, value: pct, display: `${pct} %`, strong: pct >= 50 ? true : false };
                  })}
                />
              </div>
            </div>
            <details className="group border-y border-foreground/15">
              <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
                Ver la medición completa
                <span aria-hidden="true" className="text-foreground/50 transition-transform duration-300 group-open:rotate-45 text-[20px] leading-none">+</span>
              </summary>
              <div className="pb-6 overflow-x-auto">
                <table className="w-full min-w-[640px] text-[14px] tabular-nums">
                  <thead>
                    <tr className="text-left text-[12px] uppercase tracking-[0.06em] text-foreground/50">
                      {["Página", "Peso", "Peticiones", "Sin alt", "H1", "Meta descripción", "Botones"].map((h) => (
                        <th key={h} className="py-2 pr-4 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TECH.map((r) => (
                      <tr key={r.page} className="border-t border-foreground/10">
                        <td className="py-2.5 pr-4 font-medium">{r.page}</td>
                        <td className="py-2.5 pr-4 text-foreground/70">{r.weight}</td>
                        <td className="py-2.5 pr-4 text-foreground/70">{r.reqs}</td>
                        <td className="py-2.5 pr-4 text-foreground/70">{r.alt}</td>
                        <td className="py-2.5 pr-4 text-foreground/70">{r.h1}</td>
                        <td className="py-2.5 pr-4 text-foreground/70">{r.meta}</td>
                        <td className="py-2.5 pr-4 text-foreground/70">{r.buttons}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="pt-4 text-[13px] text-foreground/50">Medición automática de cada portada en escritorio el 20 de noviembre de 2026. Peso aproximado, a partir de las respuestas del servidor.</p>
              </div>
            </details>
            <Takeaway why="Accesibilidad y buscadores también son marca: afectan a quién puede encontrar y usar la web." what="Incluir estos criterios en el sistema de diseño y una revisión de calidad antes de cada publicación." />
          </Section>

          <Section id="redes" title="Redes sociales" lead="Comunidad grande, poco alcance.">
            <div className="grid gap-10 md:grid-cols-2">
              <div className="flex flex-col gap-4">
                <Label>Seguidores por canal</Label>
                <Bars
                  max={65100}
                  items={SOCIAL.map((s) => ({ label: s.channel, value: Number(s.followers.replace(".", "")), display: s.followers, strong: Number(s.followers.replace(".", "")) > 20000 ? true : false }))}
                />
              </div>
              <div className="flex flex-col gap-4">
                <Label>La comunidad en Instagram, frente a la propia</Label>
                <Bars
                  max={83000}
                  items={[
                    { label: "Estudiantes + antiguos alumnos", value: 82956, display: "≈83.000", strong: false },
                    { label: "Seguidores en Instagram", value: 65100, display: "65.100", strong: true },
                  ]}
                />
                <p className="text-[13px] text-foreground/50">Aunque no todos los seguidores sean alumnos, el tamaño de la comunidad es menor que el de la propia universidad.</p>
              </div>
            </div>
            <Rows head={["Canal", "Seguidores", "Actividad", "Observación"]} rows={SOCIAL.map((s) => [s.channel, <span key="f" className="tabular-nums">{s.followers}</span>, s.activity, s.note])} />
            <Body>
              Instagram tiene 65.100 seguidores y Nebrija, más de 68.000 antiguos alumnos y casi 15.000 estudiantes. Las redes hablan sobre todo a quien ya conoce la universidad. El contenido documenta eventos, cada uno con su propio grafismo, en lugar de construir una imagen reconocible.
            </Body>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-8 items-start">
              <Figure shot={SHOTS.instagram} onOpen={setOpen} />
              <Figure shot={SHOTS.youtube} onOpen={setOpen} />
            </div>
            <Takeaway why="Las redes son el primer contacto de muchos futuros estudiantes, sobre todo TikTok e Instagram." what="Plantillas por tipo de contenido, una cuadrícula con intención y formatos pensados para captar, no solo para documentar." />
          </Section>

          <Section id="fortalezas" title="Lo que funciona" lead="Una base sólida sobre la que construir.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                ["Argumentos reales", "Nº1 en inserción laboral, 5 estrellas QS en empleabilidad, red internacional y cuatro campus temáticos."],
                ["Un activo con historia", "El logotipo con serifa y el busto de Antonio de Nebrija tienen carácter y legitimidad."],
                ["La presentación institucional", "Cuenta los datos con jerarquía, un rojo coherente y buen ritmo."],
                ["Contenido abundante", "No falta material; falta un sistema que lo ordene."],
              ].map(([t, d]) => (
                <div key={t} className="rounded-[10px] bg-[#f5f5f5] p-5 flex flex-col gap-2">
                  <span className="text-[16px] font-medium">{t}</span>
                  <span className="text-[15px] leading-[1.55] text-foreground/70">{d}</span>
                </div>
              ))}
            </div>
            <Figure shot={SHOTS.presentacion} onOpen={setOpen} />
          </Section>

          <Section id="propuesta" title="Propuesta" lead="Diseñar el futuro de la marca, de forma integral.">
            <Body>
              Los problemas no están en una pieza concreta, sino en la falta de un sistema común. Mantener la web tal como está solo añade más piezas sueltas.
            </Body>
            <ol className="border-y border-foreground/15">
              {PHASES.map((p, i) => (
                <li key={p.title} className="grid grid-cols-[2.5rem_1fr] md:grid-cols-[4rem_16rem_1fr] gap-x-6 gap-y-2 py-6 border-t border-foreground/10 first:border-t-0">
                  <span className="text-[14px] text-foreground/60 tabular-nums">Fase {i + 1}</span>
                  <span className="font-display text-[22px] leading-[1.2] tracking-[-0.01em]">{p.title}</span>
                  <span className="col-start-2 md:col-start-3 text-[16px] leading-[1.6] text-foreground/70 max-w-[60ch]">{p.body}</span>
                </li>
              ))}
            </ol>
            <div className="flex flex-col gap-4">
              <Label>Mejoras rápidas, antes del rediseño</Label>
              <ul className="grid gap-2 md:grid-cols-2">
                {QUICK_WINS_TAGGED.map((q) => (
                  <li key={q.text} className="flex flex-col gap-3 rounded-[10px] border border-foreground/10 p-5">
                    <div className="flex flex-wrap gap-1.5">
                      <PriorityTag p={q.priority} />
                      <Tag>{q.effort}</Tag>
                    </div>
                    <span className="text-[16px] leading-[1.5]">{q.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Section>

          <Section id="impacto" title="Impacto esperado" lead="Cuánto podría mejorar cada acción.">
            <Body>
              Cada paso del embudo pierde candidatos. Debajo, el margen de mejora estimado de cada acción, calculado a partir de estudios del sector y con su nivel de fiabilidad. No son una promesa: el resultado real depende del punto de partida de Nebrija, que la fase de diagnóstico mediría con vuestros datos.
            </Body>
            <figure className="flex flex-col gap-4">
              {/* The admissions journey: four steps on one line (a timeline with
                  a dot per step), the actions that move each step underneath */}
              <ol className="grid grid-cols-1 md:grid-cols-4 border-y border-foreground/15">
                {FUNNEL.map((f, i) => (
                  <li key={f.step} className={`relative flex flex-col gap-4 py-6 md:px-5 md:first:pl-0 ${i > 0 ? "border-t md:border-t-0 md:border-l border-foreground/15" : ""}`}>
                    <div className="flex items-center gap-3">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-foreground text-[12px] font-medium text-background tabular-nums">{i + 1}</span>
                      {i < FUNNEL.length - 1 && <span aria-hidden="true" className="hidden md:block h-px flex-1 bg-foreground/20" />}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-display text-[22px] leading-[1.15] tracking-[-0.01em]">{f.step}</span>
                      <span className="text-[14px] leading-[1.45] text-foreground/60">{f.question}</span>
                    </div>
                    <ul className="flex flex-col gap-2 border-t border-foreground/10 pt-4">
                      {f.actions.map((a) => (
                        <li key={a.text}>
                          <a
                            href={`#${a.to}`}
                            onClick={(e) => {
                              e.preventDefault();
                              go(a.to);
                            }}
                            className="group flex items-start justify-between gap-3 text-[14px] leading-[1.45] text-foreground/80 hover:text-foreground"
                          >
                            {a.text}
                            <span aria-hidden="true" className="text-foreground/30 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-foreground">→</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
              <figcaption className="text-[14px] text-foreground/60 max-w-[62ch]">
                El recorrido de un futuro estudiante hasta pedir información, y las acciones de este informe que mejoran cada paso. Con los datos de analítica se pondría la cifra real de cada uno.
              </figcaption>
            </figure>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {IMPACT.map((it) => (
                <li key={it.action} className="rounded-[10px] bg-[#f5f5f5] p-6 flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13px] font-medium text-foreground/60">{it.improves}</span>
                    <PriorityTag p={it.priority} short />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[13px] text-foreground/60">Margen de mejora estimado</span>
                    <span className="font-display font-normal leading-[0.95] tracking-[-0.03em] text-[clamp(2.75rem,5vw,4.5rem)] tabular-nums text-[var(--chart)]">{it.gain}</span>
                    <span className="font-display text-[20px] leading-[1.2] tracking-[-0.01em] text-[var(--chart)]">{it.unit}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-medium text-foreground">Cómo lo calculamos</span>
                      <ConfidenceTag c={it.confidence} />
                    </div>
                    <p className="text-[14px] leading-[1.55] text-foreground/70">{it.basis}</p>
                  </div>
                  <div className="mt-auto flex flex-col gap-3 border-t border-foreground/10 pt-4">
                    <a
                      href={`#${it.to}`}
                      onClick={(e) => {
                        e.preventDefault();
                        go(it.to);
                      }}
                      className="group flex items-start justify-between gap-3 text-[15px] font-medium text-foreground"
                    >
                      {it.action}
                      <span aria-hidden="true" className="text-foreground/40 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-foreground">→</span>
                    </a>
                    <span className="text-[13px] text-foreground/60">Se mide con: {it.measure}</span>
                    <a href={it.url} target="_blank" rel="noopener noreferrer" className="text-[12px] text-foreground/50 underline underline-offset-2 decoration-foreground/20 hover:text-foreground">
                      Fuente: {it.source}
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="siguiente" title="Siguiente paso" lead="Completar el diagnóstico con los datos internos.">
            <Body>Este análisis usa solo información pública. Para medir el impacto real de la marca y fijar objetivos, la siguiente fase necesitaría acceso de lectura a:</Body>
            <ul className="flex flex-col border-y border-foreground/15">
              {DATA_NEEDED.map((d) => (
                <li key={d} className="py-4 border-t border-foreground/10 first:border-t-0 text-[16px] leading-[1.55] text-foreground/80">
                  {d}
                </li>
              ))}
            </ul>
            <div className="rounded-[10px] bg-foreground text-background p-8 md:p-12 flex flex-col gap-6">
              <p className="text-lead max-w-[30ch]">¿Lo vemos juntos? Una conversación de 30 minutos basta para empezar.</p>
              <div className="flex flex-wrap items-center gap-4">
                <a
                  href={`mailto:${email}?subject=${encodeURIComponent("Auditoría de marca Nebrija")}`}
                  className="inline-flex items-center gap-3 rounded-full bg-background text-foreground px-6 py-3.5 text-[14px] font-medium tracking-[0.01em] transition-transform duration-300 hover:scale-[1.04]"
                >
                  Escribir a Jose
                </a>
                <span className="text-[14px] text-background/70 select-all">{email}</span>
              </div>
            </div>
          </Section>

          <div className="border-t border-foreground/15 px-3 lg:px-10 py-10 text-[13px] leading-[1.6] text-foreground/50 flex flex-col gap-2">
            <p>
              Método: capturas, colores, tipografías y métricas tomadas el 20 de noviembre de 2026 con un navegador automatizado (escritorio a 1440 px e iPhone 13). Las cifras de redes son las que muestra cada perfil público ese día.
            </p>
            <p>
              Fuentes:{" "}
              {[
                ["nebrija.com", "https://www.nebrija.com/"],
                ["fpnebrija.com", "https://www.fpnebrija.com/"],
                ["idiomasnebrija.com", "https://www.idiomasnebrija.com/"],
                ["competenciasprofesionalesnebrija.com", "https://www.competenciasprofesionalesnebrija.com/"],
                ["actos.nebrija.es", "https://actos.nebrija.es/"],
                ["presentación institucional 2026", "https://files.griddo.nebrija.com/presentacion-general-universidad-nebrija-2026.pdf"],
                ["Instagram", "https://www.instagram.com/universidad_nebrija/"],
                ["YouTube", "https://www.youtube.com/user/Videonebrija"],
                ["TikTok", "https://www.tiktok.com/@universidadnebrija"],
              ].map(([t, u], i, a) => (
                <span key={u}>
                  <a href={u} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 decoration-foreground/20 hover:text-foreground">
                    {t}
                  </a>
                  {i < a.length - 1 ? ", " : "."}
                </span>
              ))}
            </p>
          </div>
        </main>
      </div>

      {/* Footer, as the site's (in Spanish) */}
      <footer className="relative z-10 w-full bg-[#0b0b0b] text-white">
        <div className="px-3 pt-16 pb-24 lg:pb-10 md:pt-24 flex flex-col gap-16">
          <div className="grid grid-cols-2 md:grid-cols-12 gap-x-6 gap-y-10">
            <div className="col-span-2 md:col-span-6 flex flex-col gap-2">
              <p className="text-[14px] font-medium tracking-[0.01em]">Jose Peláez</p>
              <p className="text-[14px] text-white/70 tracking-[0.01em] max-w-[40ch]">Diseñador de marca y producto en Madrid. Identidades, webs y productos digitales, diseñados y construidos de principio a fin.</p>
            </div>
            <div className="md:col-span-3 flex flex-col gap-3">
              <p className="text-[14px] font-medium text-white/50 tracking-[0.01em]">Contacto</p>
              <a href={`mailto:${email}`} className="text-[14px] text-white/70 tracking-[0.01em] hover:text-white transition-colors duration-300 break-all">
                {email}
              </a>
            </div>
            <div className="md:col-span-3 flex flex-col gap-3">
              <p className="text-[14px] font-medium text-white/50 tracking-[0.01em]">Portfolio</p>
              <Link to="/" className="text-[14px] text-white/70 tracking-[0.01em] hover:text-white transition-colors duration-300">
                josepelaez.es
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-between gap-6 text-[14px] tracking-[0.01em] text-white/50">
            <p>© 2026 Jose Peláez</p>
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="py-2 transition-colors duration-300 hover:text-white">
              Volver arriba ↑
            </button>
          </div>
        </div>
      </footer>

      {/* Lightbox */}
      {open && (
        <div role="dialog" aria-modal="true" aria-label={open.title} className="fixed inset-0 z-[300] bg-black/90 flex flex-col" onClick={() => setOpen(null)}>
          <div className="flex items-center justify-between gap-6 px-4 py-3 text-[14px] text-white/80">
            <span className="truncate">{open.title}</span>
            <button ref={closeRef} type="button" onClick={() => setOpen(null)} className="rounded-full border border-white/30 px-4 py-2 text-white hover:border-white">
              Cerrar
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-auto flex items-start justify-center px-4 pb-6">
            <img src={open.src} alt={open.alt} className="max-w-full h-auto rounded-[6px]" onClick={(e) => e.stopPropagation()} />
          </div>
          <p className="px-4 pb-4 text-[14px] text-white/60 max-w-[80ch]" onClick={(e) => e.stopPropagation()}>
            {open.caption}
          </p>
        </div>
      )}
    </div>
  );
};

export default NebrijaAudit;

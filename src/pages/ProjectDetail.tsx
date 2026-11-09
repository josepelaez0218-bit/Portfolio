import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Footer from "@/components/Footer";
import CaseNav from "@/components/CaseNav";
import CycleIcon from "@/components/CycleIcon";
import { caseOpen } from "@/components/ProjectsGallery";
import { CaseSection } from "@/components/CaseSection";
import { fetchProjectBySlug, fetchProjects } from "@/lib/sanity/queries";
import { urlForImage } from "@/lib/sanity/image";
import type { SanityProject } from "@/lib/sanity/types";
import NotFound from "./NotFound";
import { localizeProject, useLang, useT } from "@/lib/i18n";

// The live-site CTA, as the home's "Start a project": black pill, cycling icon
const LiveCta = ({ href, label, className = "", chess = false }: { href: string; label: string; className?: string; chess?: boolean }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={`inline-flex items-center gap-3 rounded-full bg-foreground text-background px-6 py-3.5 text-[14px] font-medium tracking-[0.01em] transition-transform duration-300 hover:scale-[1.04] ${className}`}
  >
    {label} <CycleIcon chess={chess} />
  </a>
);

const slugifyLabel = (label: string) =>
  label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const ProjectDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [rawProject, setProject] = useState<SanityProject | null | undefined>(undefined);
  const lang = useLang();
  const t = useT();
  const project = rawProject ? localizeProject(rawProject, lang) : rawProject;
  // Its number in the index (passed along when opened from it, else looked up)
  const location = useLocation();
  const [all, setAll] = useState<SanityProject[]>([]);
  useEffect(() => {
    fetchProjects().then(setAll).catch(() => {});
  }, []);
  const found = all.findIndex((p) => p.slug === slug);
  const number = found >= 0 ? found : ((location.state as { index?: number } | null)?.index ?? null);
  // The next one that can actually be opened: an open case or a live site
  const reachable = (p: SanityProject) => caseOpen(p.slug) || Boolean(p.openLive && p.liveUrl);
  const nextRaw =
    found >= 0 ? [...all.slice(found + 1), ...all.slice(0, found)].find((p) => reachable(p)) ?? null : null;
  const next = nextRaw ? localizeProject(nextRaw, lang) : null;



  useEffect(() => {
    window.scrollTo(0, 0);
    if (!slug) {
      setProject(null);
      return;
    }
    setProject(undefined);
    let cancelled = false;
    fetchProjectBySlug(slug)
      .then((data) => {
        if (!cancelled) setProject(data);
      })
      .catch((err) => {
        console.error("Failed to load project from Sanity:", err);
        if (!cancelled) setProject(null);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const sections = project?.sections ?? [];



  useEffect(() => {
    if (!project) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -12% 0px" },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [project]);

  if (project === undefined) return null;
  if (project === null) return <NotFound />;

  const url = `https://www.josepelaez.es/work/${project.slug}`;
  const ogImageUrl = urlForImage(project.hero).width(1200).quality(80).url();
  const heroSrc = urlForImage(project.hero).width(2400).quality(85).url();
  const heroSrcSet = [1200, 1800, 2400, 3200]
    .map((w) => `${urlForImage(project.hero).width(w).quality(85).url()} ${w}w`)
    .join(", ");
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: project.title,
    description: project.description,
    image: ogImageUrl,
    author: { "@type": "Person", name: "Jose Peláez", url: "https://www.josepelaez.es/" },
    url,
  };

  return (
    <>
      <Helmet>
        <title>{`${project.title} — Jose Peláez`}</title>
        <meta name="description" content={project.description} />
        <link rel="canonical" href={url} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={`${project.title} — Jose Peláez`} />
        <meta property="og:description" content={project.description} />
        <meta property="og:url" content={url} />
        <meta property="og:image" content={ogImageUrl} />
        <meta name="twitter:title" content={`${project.title} — Jose Peláez`} />
        <meta name="twitter:description" content={project.description} />
        <meta name="twitter:image" content={ogImageUrl} />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
      </Helmet>

      {/* No navbar on a case: the project's row from the index is the page
          header (same number, name and tags), so opening a project reads as
          one continuous move. The way back lives under the side index. */}
      <CaseNav title={project.title} />
      <header className="px-3 pt-14 bg-background">
        <div
          className="-mx-3 px-3 grid grid-cols-[2.5rem_1fr] md:grid-cols-[4rem_1fr_auto] items-baseline gap-x-4 py-6 md:py-8 border-b border-foreground/15"
          style={{ viewTransitionName: "project-row" } as React.CSSProperties}
        >
          <span className="text-[14px] text-foreground/60 tabular-nums tracking-[0.01em]">
            {number !== null ? String(number + 1).padStart(2, "0") : ""}
          </span>
          <h1 className="font-display font-normal leading-[1.15] tracking-[-0.02em] text-[clamp(1.5rem,4.2vw,4.75rem)] whitespace-nowrap overflow-hidden text-ellipsis">{project.title}</h1>
          <span className="hidden md:flex items-center gap-6 text-[14px] text-foreground/60">
            {(project.tags ?? []).join(" · ")}
            {project.liveUrl && <LiveCta chess={project.slug === "tactica"} href={project.liveUrl} label={t("visitLive")} />}
          </span>
        </div>
      </header>

      {/* Hero, always full bleed: no frame, no grey band around it */}
      <div className="w-full overflow-hidden border-b border-foreground/15 reveal" data-reveal style={{ viewTransitionName: "project-cover" } as React.CSSProperties}>
        {project.heroVideoUrl ? (
          <video src={project.heroVideoUrl} autoPlay playsInline loop muted className="block w-full h-auto" />
        ) : (
          <img src={heroSrc} srcSet={heroSrcSet} sizes="100vw" alt={project.title} className="block w-full h-auto" />
        )}
      </div>

      {/* What it is, in one breath, right after the cover: the project's
          description in the home's lead voice (as the hero card) */}
      <div className="bg-background px-3 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-start-2 lg:col-span-7 flex flex-col items-start gap-8 reveal" data-reveal>
          <p className="text-lead text-foreground max-w-[38ch] text-balance">{project.description}</p>
          {project.liveUrl && <LiveCta chess={project.slug === "tactica"} href={project.liveUrl} label={t("visitLive")} className="md:hidden" />}
        </div>
      </div>

      {/* The sections, one reading axis (see CaseSection) */}
      <main className="bg-background border-t border-foreground/15 px-3">
        {sections.map((s, sIdx) => (
          <section
            key={slugifyLabel(s.label)}
            id={slugifyLabel(s.label)}
            className={`reveal py-16 md:py-24 -mx-3 px-3 ${sIdx > 0 ? "border-t border-foreground/15" : ""}`}
            data-reveal
          >
            <CaseSection s={s} i={sIdx} slug={project.slug} />
          </section>
        ))}
        {project.liveUrl && (
          <div className="-mx-3 px-3 py-16 md:py-24 border-t border-foreground/15 grid grid-cols-1 lg:grid-cols-12 lg:gap-x-10">
            <div className="lg:col-start-2 lg:col-span-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <p className="text-lead text-foreground">{lang === "es" ? "Pruébalo tú mismo." : "Try it yourself."}</p>
              <LiveCta chess={project.slug === "tactica"} href={project.liveUrl} label={t("visitLive")} />
            </div>
          </div>
        )}
      </main>

      {/* Next project: one row of the grid — the label where the index is,
          the project where the content is */}
      {next && (() => {
        const row = (
          <>
          <span className="lg:col-span-3 flex items-baseline gap-3 py-6 lg:py-10 text-[14px] text-foreground/60">
            {t("nextProject")}
            <span className="tabular-nums">{String(all.indexOf(nextRaw!) + 1).padStart(2, "0")}</span>
          </span>
          <span className="lg:col-span-9 flex items-baseline justify-between gap-6 py-6 lg:py-10 min-w-0">
            <span className="font-display font-normal leading-[1.1] tracking-[-0.02em] text-[24px] md:text-[28px] transition-transform duration-500 group-hover:translate-x-2">
              {next.title}
            </span>
            <span className="hidden md:block text-[14px] text-foreground/60">{(next.tags ?? []).join(" · ")}</span>
          </span>
          </>
        );
        // A project set to open its live site goes there, as in the index
        return next.openLive && next.liveUrl ? (
          <a href={next.liveUrl} target="_blank" rel="noopener noreferrer" className="group grid grid-cols-[auto_1fr] lg:grid-cols-12 gap-x-6 lg:gap-x-10 items-baseline px-3 border-y border-foreground/15 bg-background">
            {row}
          </a>
        ) : (
          <Link to={`/work/${next.slug}`} onClick={() => window.scrollTo(0, 0)} className="group grid grid-cols-[auto_1fr] lg:grid-cols-12 gap-x-6 lg:gap-x-10 items-baseline px-3 border-y border-foreground/15 bg-background">
            {row}
          </Link>
        );
      })()}
      <div className="h-20 md:h-28 bg-background" />
      <Footer />
    </>
  );
};

export default ProjectDetail;

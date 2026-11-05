import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Footer from "@/components/Footer";
import { fetchProjectBySlug, fetchProjects } from "@/lib/sanity/queries";
import { urlForImage } from "@/lib/sanity/image";
import type { SanityProject } from "@/lib/sanity/types";
import NotFound from "./NotFound";
import { localizeProject, useLang, useT } from "@/lib/i18n";

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
  const nextRaw = found >= 0 && all.length > 1 ? all[(found + 1) % all.length] : null;
  const next = nextRaw ? localizeProject(nextRaw, lang) : null;
  const [active, setActive] = useState<string>("");

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
    if (!project || sections.length === 0) return;
    setActive(slugifyLabel(sections[0].label));

    const onScroll = () => {
      const offset = window.innerHeight * 0.3;
      let current = slugifyLabel(sections[0].label);
      for (const s of sections) {
        const el = document.getElementById(slugifyLabel(s.label));
        if (!el) continue;
        if (el.getBoundingClientRect().top - offset <= 0) current = slugifyLabel(s.label);
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

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

      {/* No navbar on a case: only the way back, then the project's row from the index, now the page header: same number,
          name and tags, so opening a project reads as one continuous move */}
      <header className="px-3 pt-5 md:pt-7 bg-background">
        <Link to="/#work" className="inline-block py-1 text-[14px] text-foreground/70 tracking-[0.01em] transition-colors duration-300 hover:text-foreground">
          ← {t("back")}
        </Link>
        <div className="h-12 md:h-14" aria-hidden="true" />
        <div
          className="-mx-3 px-3 grid grid-cols-[2.5rem_1fr] md:grid-cols-[4rem_1fr_auto] items-baseline gap-x-4 py-6 md:py-8 border-b border-foreground/15"
          style={{ viewTransitionName: "project-row" } as React.CSSProperties}
        >
          <span className="text-[14px] text-foreground/60 tabular-nums tracking-[0.01em]">
            {number !== null ? String(number + 1).padStart(2, "0") : ""}
          </span>
          <h1 className="font-display font-normal leading-[1.15] tracking-[-0.02em] text-[clamp(1.5rem,4.2vw,4.75rem)] whitespace-nowrap overflow-hidden text-ellipsis">{project.title}</h1>
          <span className="hidden md:block text-[14px] text-foreground/60">{(project.tags ?? []).join(" · ")}</span>
        </div>
      </header>

      {project.heroBleed ? (
        /* Hero, full-bleed — no frame, no gray section */
        <div className="w-full overflow-hidden reveal" data-reveal style={{ viewTransitionName: "project-cover" } as React.CSSProperties}>
          {project.heroVideoUrl ? (
            <video
              src={project.heroVideoUrl}
              autoPlay
              playsInline
              loop
              muted
              className="w-full h-auto object-cover"
            />
          ) : (
            <img
              src={heroSrc}
              srcSet={heroSrcSet}
              sizes="100vw"
              alt={project.title}
              className="w-full h-auto object-cover"
            />
          )}
        </div>
      ) : (
        /* Hero, framed gray section */
        <section className="w-full bg-[#f5f5f5] px-3 pt-10 pb-20 md:pt-14 md:pb-32">
          <div className="max-w-[1900px] mx-auto">
            <div className="w-full overflow-hidden reveal" data-reveal style={{ viewTransitionName: "project-cover" } as React.CSSProperties}>
              {project.heroVideoUrl ? (
                <video
                  src={project.heroVideoUrl}
                  autoPlay
                  playsInline
                  loop
                  muted
                  className="w-full h-auto object-contain"
                />
              ) : (
                <img
                  src={heroSrc}
                  srcSet={heroSrcSet}
                  sizes="(min-width: 1400px) 1400px, 100vw"
                  alt={project.title}
                  className="w-full h-auto object-contain"
                />
              )}
            </div>
          </div>
        </section>
      )}

      {/* The project at a glance, once: role, team, date and the live site */}
      {(() => {
        const ok = (v?: string) => (v && !/TBD/.test(v) ? v : null);
        const facts = [
          [t("role"), ok(project.role)],
          [t("team"), ok(project.team)],
          [t("timeline"), ok(project.timeline)],
        ].filter(([, v]) => v) as [string, string][];
        if (!facts.length && !project.liveUrl) return null;
        return (
          <div className="bg-background px-3 pt-10 md:pt-14">
            <dl className="-mx-3 px-3 grid grid-cols-2 md:grid-cols-12 gap-x-6 gap-y-6 pb-10 md:pb-14 border-b border-foreground/15">
              {facts.map(([k, v]) => (
                <div key={k} className="md:col-span-3 flex flex-col gap-1.5">
                  <dt className="text-[14px] font-medium tracking-[0.01em] text-foreground/70">{k}</dt>
                  <dd className="text-[16px] text-foreground">{v}</dd>
                </div>
              ))}
              {project.liveUrl && (
                <div className="col-span-2 md:col-span-3 md:justify-self-end self-end">
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 rounded-full bg-foreground text-background px-6 py-3.5 text-[14px] font-medium tracking-[0.01em] transition-transform duration-300 hover:scale-[1.04]"
                  >
                    {t("visitLive")} <span aria-hidden="true">↗</span>
                  </a>
                </div>
              )}
            </dl>
          </div>
        );
      })()}

      {/* Content */}
      <main className="bg-background px-3 pt-16 md:pt-24 pb-20 md:pb-32">
        <div className="max-w-[1900px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-12 lg:gap-24">
            {/* Sidebar */}
            <aside className="hidden lg:block">
              <nav className="sticky top-24">
                <ul className="flex flex-col gap-3">
                  {sections.map((s) => {
                    const id = slugifyLabel(s.label);
                    return (
                      <li key={id}>
                        <a
                          href={`#${id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            setActive(id);
                            const el = document.getElementById(id);
                            if (!el) return;
                            const y = el.getBoundingClientRect().top + window.scrollY - 40;
                            window.scrollTo({ top: y, behavior: "smooth" });
                          }}
                          className={`text-[14px] tracking-[0.01em] transition-all duration-300 ${
                            active === id
                              ? "text-foreground font-medium"
                              : "text-foreground/60 hover:text-foreground font-normal"
                          }`}
                        >
                          {s.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </aside>

            {/* Main */}
            <div className="max-w-[820px] space-y-24 md:space-y-32">
              {sections.map((s) => {
                const id = slugifyLabel(s.label);
                return (
                  <section key={id} id={id} className="scroll-mt-10 reveal" data-reveal>
                    <h2 className="text-lead text-foreground mb-6 md:mb-8">
                      {s.label}
                    </h2>
                    {s.stats && s.stats.length > 0 && (
                      <div className="mb-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {s.stats.map((stat, sIndex) => (
                          <div
                            key={sIndex}
                            className="rounded-[4px] bg-[#f5f5f5] px-5 py-4 flex flex-col gap-1"
                          >
                            <span className="font-display font-normal text-foreground leading-[1] tracking-[-0.02em] text-[32px] md:text-[40px]">
                              {stat.value}
                            </span>
                            <span className="text-[14px] font-normal text-foreground/60 tracking-[0.01em]">
                              {stat.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-col gap-5">
                      {s.body.split(/\n{2,}/).map((paragraph, pIndex) => (
                        <p
                          key={pIndex}
                          className="text-[16px] font-normal text-foreground/70 leading-[1.6]"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    {(() => {
                      const hasImages = Boolean(s.images && s.images.length > 0);
                      const hasVideo = Boolean(s.videoUrl);
                      const isVideoFirst = s.mediaOrder === "video-first";
                      // First media block after the body text gets the larger
                      // gap; a second block stacked on top of the first one
                      // uses the same small gap the images grid uses between
                      // its own items, so spacing reads as one consistent
                      // rhythm instead of jumping between 16px and 40px.
                      const imagesMargin = isVideoFirst && hasVideo ? "mt-4" : "mt-10";
                      const videoMargin = !isVideoFirst && hasImages ? "mt-4" : "mt-10";
                      const imagesBlock = s.images && s.images.length > 0 && (
                        <div
                          key="images"
                          className={`${imagesMargin} grid gap-4 ${
                            s.imagesLayout === "stacked"
                              ? "grid-cols-1"
                              : s.imagesLayout === "grid-3"
                                ? "grid-cols-2 sm:grid-cols-3"
                                : s.images.length > 1
                                  ? "grid-cols-1 sm:grid-cols-2"
                                  : "grid-cols-1"
                          }`}
                        >
                          {s.images.map((image, iIndex) => (
                            <div key={iIndex} className="overflow-hidden rounded-[4px]">
                              <img
                                src={urlForImage(image).width(1200).quality(85).url()}
                                alt={image.alt}
                                loading="lazy"
                                className="w-full h-auto object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      );
                      const videoBlock = s.videoUrl && (
                        <div key="video" className={`${videoMargin} overflow-hidden rounded-[4px]`}>
                          <video
                            src={s.videoUrl}
                            autoPlay
                            playsInline
                            loop
                            muted
                            className="w-full h-auto"
                          />
                          {s.videoCaption && (
                            <p className="mt-3 text-[14px] font-normal text-foreground/60 tracking-[0.01em]">
                              {s.videoCaption}
                            </p>
                          )}
                        </div>
                      );
                      return s.mediaOrder === "video-first"
                        ? <>{videoBlock}{imagesBlock}</>
                        : <>{imagesBlock}{videoBlock}</>;
                    })()}
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Next project, as a row of the index */}
      {next && (
        <div className="bg-background px-3 pb-20 md:pb-32">
          <p className="mb-5 text-[14px] font-medium tracking-[0.01em] text-foreground/70">{t("nextProject")}</p>
          <Link
            to={`/work/${next.slug}`}
            onClick={() => window.scrollTo(0, 0)}
            className="-mx-3 px-3 group grid grid-cols-[2.5rem_1fr] md:grid-cols-[4rem_1fr_auto] items-baseline gap-x-4 py-6 md:py-8 border-y border-foreground/15"
          >
            <span className="text-[14px] text-foreground/60 tabular-nums tracking-[0.01em]">{String(((found + 1) % all.length) + 1).padStart(2, "0")}</span>
            <span className="font-display font-normal leading-[1.15] tracking-[-0.02em] text-[clamp(1.5rem,4.2vw,4.75rem)] whitespace-nowrap overflow-hidden text-ellipsis transition-transform duration-500 group-hover:translate-x-3">
              {next.title} <span aria-hidden="true">→</span>
            </span>
            <span className="hidden md:block text-[14px] text-foreground/60">{(next.tags ?? []).join(" · ")}</span>
          </Link>
        </div>
      )}
      <Footer />
    </>
  );
};

export default ProjectDetail;

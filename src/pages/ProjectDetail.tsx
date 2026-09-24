import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import CustomCursor from "@/components/CustomCursor";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import { fetchProjectBySlug } from "@/lib/sanity/queries";
import { urlForImage } from "@/lib/sanity/image";
import type { SanityProject } from "@/lib/sanity/types";
import NotFound from "./NotFound";

const slugifyLabel = (label: string) =>
  label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const ProjectDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<SanityProject | null | undefined>(undefined);
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

  const url = `https://josepelaez.es/work/${project.slug}`;
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
    author: { "@type": "Organization", name: "Jose Peláez", alternateName: "Buen Puerto" },
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
      <CustomCursor />

      <Nav subtitle={project.title} />

      <h1 className="sr-only">{project.title}</h1>

      {project.heroBleed ? (
        /* Hero, full-bleed — no frame, no gray section */
        <div className="w-full overflow-hidden reveal" data-reveal>
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
        <section className="w-full bg-[hsl(0_0%_92%)] px-6 md:px-8 pt-28 pb-20 md:pt-32 md:pb-28">
          <div className="max-w-[1400px] mx-auto">
            <div className="w-full overflow-hidden reveal" data-reveal>
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

      {/* Content */}
      <main className="bg-background px-6 md:px-8 pt-16 md:pt-24 pb-32">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-12 lg:gap-24">
            {/* Sidebar */}
            <aside className="hidden lg:block">
              <nav className="sticky top-24">
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-8 inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-4 py-2 text-[13px] font-medium tracking-[0.01em] transition-opacity duration-300 hover:opacity-80"
                  >
                    Visit live site
                    <span aria-hidden="true">↗</span>
                  </a>
                )}
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
                              ? "text-foreground font-bold"
                              : "text-foreground/40 hover:text-foreground/80 font-light"
                          }`}
                        >
                          {s.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-10 pt-6 border-t border-border/60 w-10">
                  <Link
                    to="/"
                    className="text-[14px] font-light text-foreground/60 tracking-[0.01em] transition-colors duration-300 hover:text-foreground"
                  >
                    Back
                  </Link>
                </div>
              </nav>
            </aside>

            {/* Main */}
            <div className="max-w-[820px] space-y-24 md:space-y-32">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lg:hidden inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-4 py-2 text-[13px] font-medium tracking-[0.01em] transition-opacity duration-300 hover:opacity-80"
                >
                  Visit live site
                  <span aria-hidden="true">↗</span>
                </a>
              )}
              {sections.map((s) => {
                const id = slugifyLabel(s.label);
                return (
                  <section key={id} id={id} className="scroll-mt-10 reveal" data-reveal>
                    <div className="font-mono text-[12px] text-foreground/50 mb-6 tracking-[0.02em]">
                      {project.timeline}
                    </div>
                    <h2
                      className="font-sans font-semibold text-foreground leading-[1.15] tracking-[-0.005em] mb-8"
                      style={{ fontSize: "24px" }}
                    >
                      {s.label}
                    </h2>
                    {s.stats && s.stats.length > 0 && (
                      <div className="mb-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {s.stats.map((stat, sIndex) => (
                          <div
                            key={sIndex}
                            className="rounded-[4px] bg-secondary/60 px-5 py-4 flex flex-col gap-1"
                          >
                            <span className="font-sans font-semibold text-foreground leading-[1.1] tracking-[-0.01em] text-[28px] md:text-[34px]">
                              {stat.value}
                            </span>
                            <span className="text-[12px] font-light text-foreground/55 tracking-[0.01em]">
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
                          className="text-[16px] font-normal text-foreground/75 leading-[1.6]"
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
                            <p className="mt-2 text-[12px] font-light text-foreground/50 tracking-[0.01em]">
                              {s.videoCaption}
                            </p>
                          )}
                          {project.liveUrl && (
                            <a
                              href={project.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-4 py-2 text-[13px] font-medium tracking-[0.01em] transition-opacity duration-300 hover:opacity-80"
                            >
                              Visit live site
                              <span aria-hidden="true">↗</span>
                            </a>
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
    </>
  );
};

export default ProjectDetail;

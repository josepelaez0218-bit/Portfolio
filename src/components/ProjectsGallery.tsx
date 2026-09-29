import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProjects } from "@/lib/sanity/queries";
import { urlForImage } from "@/lib/sanity/image";
import type { SanityProject } from "@/lib/sanity/types";

const ProjectsGallery = () => {
  const [projects, setProjects] = useState<SanityProject[]>([]);
  const [loading, setLoading] = useState(true);

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

  const wrapperRefs = useRef<(HTMLDivElement | null)[]>([]);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const update = () => {
      const vh = window.innerHeight;
      wrapperRefs.current.forEach((el) => {
        if (!el) return;
        const parent = el.parentElement;
        if (!parent) return;
        const rect = parent.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const progress = (center - vh / 2) / vh;
        const clamped = Math.max(-1, Math.min(1, progress));
        const translate = clamped * -20;
        el.style.transform = `translate3d(0, ${translate}px, 0)`;
      });
      frame.current = null;
    };

    const onScroll = () => {
      if (frame.current !== null) return;
      frame.current = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [projects.length]);

  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -15% 0px" },
    );
    cardRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [projects.length]);

  return (
    <section
      id="work"
      className="relative z-10 w-full bg-background px-3 pb-24 md:pb-32"
    >
      <div className="max-w-[1900px] mx-auto">
        {!loading && projects.length === 0 ? (
          <p className="text-[14px] font-light text-foreground/50">
            No projects published yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-10 md:gap-y-12">
            {projects.map((project, i) => (
              <Link
                key={project._id}
                to={`/work/${project.slug}`}
                ref={(el) => (cardRefs.current[i] = el)}
                className="group block reveal"
                style={{ transitionDelay: `${(i % 2) * 100}ms` }}
              >
                {/* Vertical 4:5 covers on phones (more presence), 3:2 from md up —
                    capped to 54% of the viewport height so shorter laptop screens
                    get a slightly wider crop instead of an oversized cover. */}
                <div className="relative aspect-[4/5] md:aspect-[3/2] md:max-h-[54vh] overflow-hidden rounded-[4px] bg-secondary">
                  <div
                    ref={(el) => (wrapperRefs.current[i] = el)}
                    className="absolute inset-x-0 -top-[5%] h-[110%] will-change-transform"
                  >
                    {project.coverVideoUrl ? (
                      <video
                        src={project.coverVideoUrl}
                        autoPlay
                        playsInline
                        loop
                        muted
                        className="w-full h-full object-cover will-change-transform transition-transform duration-[2400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                      />
                    ) : (
                      <picture>
                        {/* Phones get a vertical crop that honours the cover's hotspot. */}
                        <source
                          media="(max-width: 767px)"
                          srcSet={urlForImage(project.cover).width(900).height(1240).fit("crop").quality(80).url()}
                        />
                        <img
                          src={urlForImage(project.cover).width(1200).quality(80).url()}
                          alt={project.title}
                          loading="lazy"
                          className="w-full h-full object-cover will-change-transform transition-transform duration-[2400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                        />
                      </picture>
                    )}
                  </div>
                  {project.coverOverlay && (
                    <img
                      src={urlForImage(project.coverOverlay).width(400).url()}
                      alt=""
                      aria-hidden="true"
                      className="pointer-events-none absolute right-[5%] top-[26%] h-[48%] w-auto z-10"
                    />
                  )}
                </div>
                {/* Title and tags read as one line, left-aligned — tone tells them apart. */}
                <div className="mt-3 text-[14px] tracking-[0.01em]">
                  <h2 className="inline font-normal text-foreground">{project.title}</h2>
                  {(project.tags ?? []).length > 0 && (
                    <span className="font-light text-foreground/50"> {(project.tags ?? []).join(" · ")}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProjectsGallery;

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
      className="relative z-10 -mt-8 md:-mt-14 w-full rounded-t-[28px] md:rounded-t-[40px] bg-background px-6 md:px-8 pt-16 pb-24 md:pt-24 md:pb-32"
    >
      <div className="max-w-[1400px] mx-auto">
        {!loading && projects.length === 0 ? (
          <p className="text-[14px] font-light text-foreground/50">
            No projects published yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-14 md:gap-x-8 md:gap-y-20">
            {projects.map((project, i) => (
              <Link
                key={project._id}
                to={`/work/${project.slug}`}
                ref={(el) => (cardRefs.current[i] = el)}
                className="group block reveal"
                style={{ transitionDelay: `${(i % 2) * 100}ms` }}
              >
                <div className="relative aspect-[3/2] overflow-hidden rounded-[4px] bg-secondary">
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
                      <img
                        src={urlForImage(project.cover).width(1200).quality(80).url()}
                        alt={project.title}
                        loading="lazy"
                        className="w-full h-full object-cover will-change-transform transition-transform duration-[2400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                      />
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-baseline justify-between gap-4">
                  <h2 className="text-[15px] font-medium text-foreground tracking-[0.01em]">
                    {project.title}
                  </h2>
                  <span className="text-[12px] font-light text-foreground/50 tracking-[0.01em]">
                    {(project.tags ?? []).join(" · ")}
                  </span>
                </div>
                <p className="mt-1 text-[13px] font-light text-foreground/60 leading-[1.5] max-w-[420px]">
                  {project.description}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProjectsGallery;

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import CustomCursor from "@/components/CustomCursor";
import Nav from "@/components/Nav";
import ProjectsGallery from "@/components/ProjectsGallery";

const Index = () => {
  const heroTextRef = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const location = useLocation();

  // Arriving from another page via the "Proyectos" nav link (/#work):
  // scroll to the gallery once it's mounted, since a route change alone
  // doesn't auto-scroll to a hash the way a real anchor navigation would.
  useEffect(() => {
    if (location.hash !== "#work") return;
    const id = requestAnimationFrame(() => {
      const el = document.getElementById("work");
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.scrollY - 20;
      window.scrollTo({ top: y, behavior: "smooth" });
    });
    return () => cancelAnimationFrame(id);
  }, [location]);

  // Editorial exit: the headline dissolves and lifts slightly as the
  // next section rises to cover the hero, instead of just cutting off.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const update = () => {
      const vh = window.innerHeight;
      const progress = Math.min(Math.max(window.scrollY / (vh * 0.7), 0), 1);
      const el = heroTextRef.current;
      if (el) {
        el.style.opacity = String(1 - progress);
        el.style.transform = `translate3d(0, ${progress * -28}px, 0)`;
      }
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
  }, []);

  return (
    <>
      <Helmet>
        <title>Buen Puerto — Websites & Brands</title>
        <meta
          name="description"
          content="Buen Puerto — creative studio building websites and brands for growing businesses."
        />
        <link rel="canonical" href="https://josepelaez.es/" />
        <meta property="og:title" content="Buen Puerto — Websites & Brands" />
        <meta
          property="og:description"
          content="Buen Puerto — creative studio building websites and brands for growing businesses."
        />
        <meta property="og:url" content="https://josepelaez.es/" />
        <meta property="og:type" content="website" />
      </Helmet>
      <CustomCursor />
      <Nav subtitle="By Jose Peláez" />

      <section className="relative w-full h-[100dvh] overflow-hidden bg-background flex items-end touch-pan-y">
        <iframe
          src="/cloth-webgl.html"
          title="Cloth animation"
          className="absolute inset-0 w-full h-full border-0 z-10"
          aria-hidden="true"
        />

        <div className="relative z-20 w-full pointer-events-none px-6 pb-[max(40px,env(safe-area-inset-bottom,40px))] md:px-8 md:pb-[max(80px,env(safe-area-inset-bottom,80px))]">
          <div ref={heroTextRef} className="max-w-[1400px] mx-auto will-change-transform">
            <h1
              className="font-sans font-extrabold text-foreground animate-fade-up text-[36px] leading-[38px] md:text-[56px] md:leading-[60px]"
              style={{
                letterSpacing: "-0.02em",
                animationDelay: "0.35s",
                animationDuration: "1.1s",
              }}
            >
              <span className="sr-only">Buen Puerto — </span>Websites
              <br />
              &amp; Brands,
              <br />
              built to grow.
            </h1>
          </div>
        </div>
      </section>

      <ProjectsGallery />
    </>
  );
};

export default Index;

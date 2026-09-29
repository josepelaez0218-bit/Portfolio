import { Fragment, useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import CustomCursor from "@/components/CustomCursor";
import Footer from "@/components/Footer";
import ImageTrailHero from "@/components/ImageTrailHero";
import IntroText from "@/components/IntroText";
import LabEditorial from "@/components/lab-essay/LabEditorial";
import Nav from "@/components/Nav";
import ProjectsGallery from "@/components/ProjectsGallery";
import { fetchHome } from "@/lib/sanity/queries";

// Shown if Sanity has no Home document yet or the request fails.
const FALLBACK_HERO_TITLE = "Brand & website\nstudio.";

/**
 * `lab` swaps in an alternative Lab section (used by the local /preview
 * route to try new Lab designs in context); defaults to LabEditorial.
 */
const Index = ({ lab }: { lab?: ReactNode } = {}) => {
  const location = useLocation();
  // null while loading — the headline mounts (and runs its fade-up) once
  // the text is known, so the fallback never flashes before the real copy.
  const [heroTitle, setHeroTitle] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchHome()
      .then((data) => {
        if (!cancelled) setHeroTitle(data?.heroTitle?.trim() || FALLBACK_HERO_TITLE);
      })
      .catch((err) => {
        console.error("Failed to load home from Sanity:", err);
        if (!cancelled) setHeroTitle(FALLBACK_HERO_TITLE);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Arriving from another page via the "Work" or "Lab" nav link (/#work,
  // /#lab): scroll to that section once it's mounted, since a route change
  // alone doesn't auto-scroll to a hash the way a real anchor navigation
  // would.
  useEffect(() => {
    const targetId = location.hash.replace("#", "");
    if (targetId !== "work" && targetId !== "lab") return;
    const id = requestAnimationFrame(() => {
      const el = document.getElementById(targetId);
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.scrollY - 20;
      window.scrollTo({ top: y, behavior: "smooth" });
    });
    return () => cancelAnimationFrame(id);
  }, [location]);

  return (
    <>
      <Helmet>
        <title>Jose Peláez — Product & Brand Design</title>
        <meta
          name="description"
          content="Jose Peláez — product and brand designer (Buen Puerto) building websites and brands for growing businesses."
        />
        <link rel="canonical" href="https://josepelaez.es/" />
        <meta property="og:title" content="Jose Peláez — Product & Brand Design" />
        <meta
          property="og:description"
          content="Jose Peláez — product and brand designer (Buen Puerto) building websites and brands for growing businesses."
        />
        <meta property="og:url" content="https://josepelaez.es/" />
        <meta property="og:type" content="website" />
      </Helmet>
      <CustomCursor />
      <Nav />

      <section className="relative w-full h-[100dvh] overflow-hidden bg-[#F5F5F5] flex items-center justify-center touch-pan-y">
        <div className="relative z-0 w-full pointer-events-none px-6 flex items-center justify-center">
          {heroTitle !== null && (
            <h1
              className="font-sans font-black uppercase text-white animate-fade-up text-center leading-[0.95]"
              style={{
                fontSize: "clamp(3.5rem, 16vw, 13rem)",
                letterSpacing: "-0.02em",
                animationDelay: "0.35s",
                animationDuration: "1.1s",
              }}
            >
              <span className="sr-only">Jose Peláez — </span>
              {heroTitle.split("\n").map((line, i) => (
                <Fragment key={i}>
                  {i > 0 && <br />}
                  {line}
                </Fragment>
              ))}
            </h1>
          )}
        </div>

        <ImageTrailHero />
      </section>

      <IntroText />
      <ProjectsGallery />
      {lab ?? <LabEditorial />}
      <Footer />
    </>
  );
};

export default Index;

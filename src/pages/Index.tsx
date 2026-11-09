import { Fragment, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import ClosingHello from "@/components/ClosingHello";
import Footer from "@/components/Footer";
import ClothHero from "@/components/ClothHero";
import HeroCard from "@/components/HeroCard";
import CycleIcon from "@/components/CycleIcon";
import ImageTrailHero from "@/components/ImageTrailHero";
import ProjectsGallery from "@/components/ProjectsGallery";
import Services from "@/components/Services";
import StackSheet from "@/components/StackSheet";
import { fetchHome } from "@/lib/sanity/queries";
import { useT } from "@/lib/i18n";
import { ogImage } from "@/lib/siteTexts";

// Shown if Sanity has no Home document yet or the request fails.
const FALLBACK_HERO_TITLE = "Brand & website\nstudio.";

const Index = () => {
  const location = useLocation();
  const t = useT();
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

  // The cloth, or the image trail where WebGL isn't available
  const [hero, setHero] = useState<"cloth" | "trail">(pickHero);


  // Arriving from another page via a nav link (/#work,
  // /#contact): scroll to that section once it's mounted, since a route change
  // alone doesn't auto-scroll to a hash the way a real anchor navigation
  // would.
  useEffect(() => {
    const hash = location.hash.replace("#", "");
    const targetId = hash === "start" ? "contact" : hash;
    if (targetId !== "work" && targetId !== "contact") return;
    // Wait for the projects to load (they set the page's length), then go.
    let tries = 0;
    const id = window.setInterval(() => {
      const el = document.getElementById(targetId);
      const ready = document.querySelectorAll("#work li").length > 0;
      if (!el || (!ready && ++tries < 30)) return;
      window.clearInterval(id);
      const y = el.getBoundingClientRect().top + window.scrollY - (targetId === "work" ? 20 : 0);
      window.scrollTo({ top: y, behavior: "smooth" });
    }, 100);
    return () => window.clearInterval(id);
  }, [location]);

  return (
    <>
      <Helmet>
        <title>{t("seoTitle")}</title>
        <meta name="description" content={t("seoDescription")} />
        <link rel="canonical" href="https://www.josepelaez.es/" />
        <meta property="og:title" content={t("seoTitle")} />
        <meta property="og:description" content={t("seoDescription")} />
        <meta property="og:url" content="https://www.josepelaez.es/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={ogImage() ?? "https://www.josepelaez.es/og-image.png"} />
      </Helmet>

      {/* Three parts stacked like sheets: the hero stays put and the intro and
          projects slide up over it; once the projects end they stay put in turn
          and “Time to say hello” and the footer slide up over them. */}
      <div className="relative">
      <section data-hero className="sticky top-0 z-0 w-full h-[100svh] lg:h-[100dvh] overflow-hidden bg-[#F5F5F5] flex items-center justify-center touch-pan-y">
        <div className="relative z-0 w-full pointer-events-none px-6 flex items-center justify-center">
          {heroTitle !== null && (
            <h1
              className={
                hero === "cloth"
                  ? "sr-only"
                  : "font-sans font-black uppercase text-white animate-fade-up text-center leading-[0.95]"
              }
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

        {hero === "cloth" ? <ClothHero onUnsupported={() => setHero("trail")} /> : <ImageTrailHero />}
        <HeroCard />
        {/* A quiet nudge to keep going */}
        <p
          aria-hidden="true"
          className="pointer-events-none absolute z-10 bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 whitespace-nowrap text-[14px] tracking-[0.01em] text-foreground/60 animate-fade-up"
          style={{ animationDelay: "1.4s", animationFillMode: "backwards" }}
        >
          {t("scrollHint")} <CycleIcon down />
        </p>
      </section>

      <StackSheet className="z-10">
        <ProjectsGallery />
        <Services />
      </StackSheet>
      <div className="relative z-20 bg-background">
        {/* The close: how to get in touch, and me waving in dots */}
        <ClosingHello />
        <Footer />
      </div>
      </div>
    </>
  );
};

// The hero is always the cloth: the projects index already has an image that
// follows the pointer, so the image trail would repeat it. The trail stays as
// the fallback for browsers without WebGL (?hero=trail shows it).
function pickHero(): "cloth" | "trail" {
  return new URLSearchParams(window.location.search).get("hero") === "trail" ? "trail" : "cloth";
}

export default Index;

import { Fragment, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import ClosingHello from "@/components/ClosingHello";
import Footer from "@/components/Footer";
import ClothHero from "@/components/ClothHero";
import HeroCard from "@/components/HeroCard";
import ImageTrailHero from "@/components/ImageTrailHero";
import Nav from "@/components/Nav";
import ProjectsGallery from "@/components/ProjectsGallery";
import StackSheet from "@/components/StackSheet";
import { fetchHome } from "@/lib/sanity/queries";

// Shown if Sanity has no Home document yet or the request fails.
const FALLBACK_HERO_TITLE = "Brand & website\nstudio.";

const Index = () => {
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

  // Each visit draws its hero: the image trail or the cloth in the wind.
  // Kept for the whole visit, so coming back to the home doesn't reshuffle it;
  // ?hero=cloth or ?hero=trail picks one.
  const [hero, setHero] = useState<"cloth" | "trail">(pickHero);

  // Magnetic sheets: stop scrolling near the start of a sheet and the page
  // settles onto it (proximity snap, so the index can still be read freely).
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("snap-sheets");
    return () => html.classList.remove("snap-sheets");
  }, []);

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
        <title>Jose Peláez — Product & Brand Design</title>
        <meta
          name="description"
          content="Jose Peláez — product and brand designer based in Madrid. Brand identities, websites and digital products, designed and built end to end."
        />
        <link rel="canonical" href="https://www.josepelaez.es/" />
        <meta property="og:title" content="Jose Peláez — Product & Brand Design" />
        <meta
          property="og:description"
          content="Jose Peláez — product and brand designer based in Madrid. Brand identities, websites and digital products, designed and built end to end."
        />
        <meta property="og:url" content="https://www.josepelaez.es/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.josepelaez.es/og-image.png" />
      </Helmet>
      <Nav />
      {/* The menu card: fixed, above every sheet */}
      <HeroCard />

      {/* Three parts stacked like sheets: the hero stays put and the intro and
          projects slide up over it; once the projects end they stay put in turn
          and “Time to say hello” and the footer slide up over them. */}
      <div className="relative">
      <div aria-hidden="true" className="snap-point" />
      <section className="sticky top-0 z-0 w-full h-[100dvh] overflow-hidden bg-[#F5F5F5] flex items-center justify-center touch-pan-y">
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
      </section>

      {/* Snap points sit in the normal flow (the sheets themselves are sticky) */}
      <div aria-hidden="true" className="snap-point" />
      <StackSheet className="z-10">
        <ProjectsGallery />
      </StackSheet>
      <div aria-hidden="true" className="snap-point" />
      <div className="relative z-20 bg-background">
        {/* The close: how to get in touch, and me waving in dots */}
        <ClosingHello />
        <Footer />
      </div>
      </div>
    </>
  );
};

const HERO_KEY = "pj-hero";
function pickHero(): "cloth" | "trail" {
  const q = new URLSearchParams(window.location.search).get("hero");
  let pick: "cloth" | "trail" | null = q === "cloth" || q === "trail" ? q : null;
  try {
    const saved = sessionStorage.getItem(HERO_KEY);
    // Dev server: each reload swaps to the other one, to compare them
    if (!pick && import.meta.env.DEV && (saved === "cloth" || saved === "trail")) pick = saved === "cloth" ? "trail" : "cloth";
    if (!pick) pick = saved === "cloth" || saved === "trail" ? saved : null;
    pick ??= Math.random() < 0.5 ? "cloth" : "trail";
    sessionStorage.setItem(HERO_KEY, pick);
  } catch {
    pick ??= Math.random() < 0.5 ? "cloth" : "trail";
  }
  return pick;
}

export default Index;

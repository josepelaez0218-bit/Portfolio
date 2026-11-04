import { useEffect, useState } from "react";
import { onLangChange, readLang, saveLang, type Lang } from "@/lib/lang";
import { useT } from "@/lib/i18n";
import { useHideOnScroll } from "@/lib/useHideOnScroll";

const KEY = "pj-card-closed";

/**
 * The site's menu, always on screen at the top left: a short intro, the way to
 * start a project, and Work · Contact · EN/ES. Solid white on the grey hero,
 * where it opens by default; once the white sheets slide under it, it turns to
 * frosted glass and folds itself down to “Jose Peláez +” (open it any time).
 * Folding it by hand holds for the visit. Phones: only in the hero, at the bottom.
 */
const HeroCard = () => {
  const [open, setOpen] = useState(() => {
    try {
      return sessionStorage.getItem(KEY) !== "1";
    } catch {
      return true;
    }
  });
  // Past the hero: glass, folded on its own (phones: hidden)
  const [past, setPast] = useState(false);
  const [openedPast, setOpenedPast] = useState(false);
  useEffect(() => {
    const check = () => {
      const p = window.scrollY > window.innerHeight * 0.5;
      setPast((was) => {
        if (was !== p) setOpenedPast(false);
        return p;
      });
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);
  const shown = past ? openedPast : open;
  // Like the navbar: out of the way while scrolling down (unless it's open)
  const scrolledAway = useHideOnScroll() && !shown;

  const [lang, setLang] = useState<Lang>(readLang);
  const t = useT();
  useEffect(() => onLangChange(setLang), []);
  const goTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const toggle = () => {
    if (past) return setOpenedPast((o) => !o);
    setOpen((o) => {
      try {
        sessionStorage.setItem(KEY, o ? "1" : "0");
      } catch {
        /* private mode */
      }
      return !o;
    });
  };

  return (
    <div
      className={`fixed z-[205] left-5 bottom-5 md:bottom-auto md:left-10 md:top-6 rounded-[4px] text-foreground animate-fade-up transition-[width,background-color,border-color,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        past
          ? "bg-white/55 backdrop-blur-2xl backdrop-saturate-[1.8] border border-black/[0.06] max-md:opacity-0 max-md:pointer-events-none"
          : "bg-white border border-transparent"
      } ${shown ? "right-5 md:right-auto md:w-[min(44vw,420px)] lg:w-[min(30vw,420px)]" : "w-[180px]"}`}
      style={{
        animationDelay: "0.6s",
        animationFillMode: "backwards",
        translate: scrolledAway ? "0 -140%" : "0 0",
        // One list, so it doesn’t override the width / glass transitions
        transition: ["translate", "width", "background-color", "border-color", "opacity"].map((p) => `${p} 500ms cubic-bezier(0.22,1,0.36,1)`).join(", "),
      }}
    >
      {/* The name is the handle: it folds and unfolds the card */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={shown}
        aria-controls="hero-card-body"
        className={`flex w-full items-center gap-3 text-left ${shown ? "px-5 pt-5 md:px-8 md:pt-8" : "px-4 py-3"}`}
      >
        <span className="text-[14px] font-medium tracking-[0.01em] text-foreground/70">Jose Peláez</span>
        <span aria-hidden="true" className="ml-auto relative block size-3 shrink-0 text-foreground/60">
          <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current" />
          <span className={`absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current transition-transform duration-300 ${shown ? "scale-y-0" : ""}`} />
        </span>
        <span className="sr-only">{shown ? t("closeMenu") : t("openMenu")}</span>
      </button>

      {/* Opens smoothly: a grid row going from 0fr to 1fr */}
      <div
        id="hero-card-body"
        className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ gridTemplateRows: shown ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-3 md:gap-5 px-5 pb-5 pt-3 md:px-8 md:pb-8 md:pt-5">
            <p className="text-lead text-foreground text-balance">{t("heroIntro")}</p>
            <p className="text-[14px] text-foreground/70 tracking-[0.01em] max-w-[52ch]">
              {t("heroLine")}
            </p>
            <a
              href="#start"
              tabIndex={shown ? 0 : -1}
              onClick={(e) => {
                e.preventDefault();
                setOpenedPast(false);
                window.dispatchEvent(new Event("open-brief"));
                document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="mt-1 self-start inline-flex items-center gap-3 rounded-full bg-foreground text-background px-6 py-3.5 text-[14px] font-medium tracking-[0.01em] transition-transform duration-300 hover:scale-[1.04]"
            >
              {t("startProject")} <span aria-hidden="true">→</span>
            </a>
            {/* The menu, on wide screens (phones keep it in the bar at the top) */}
            <nav aria-label="Menu" className="hidden md:flex items-center gap-6 mt-2 pt-5 border-t border-foreground/15 text-[14px] tracking-[0.01em]">
              <a href="#work" tabIndex={shown ? 0 : -1} onClick={(e) => { e.preventDefault(); setOpenedPast(false); goTo("work"); }} className="text-foreground/70 hover:text-foreground">
                {t("work")}
              </a>
              <a href="#contact" tabIndex={shown ? 0 : -1} onClick={(e) => { e.preventDefault(); setOpenedPast(false); goTo("contact"); }} className="text-foreground/70 hover:text-foreground">
                {t("contact")}
              </a>
              <span className="ml-auto flex items-center gap-1.5" role="group" aria-label="Language">
                {(["en", "es"] as const).map((l, i) => (
                  <span key={l} className="flex items-center gap-1.5">
                    {i > 0 && <span aria-hidden="true" className="text-foreground/30">/</span>}
                    <button
                      type="button"
                      lang={l}
                      tabIndex={shown ? 0 : -1}
                      aria-pressed={lang === l}
                      onClick={() => { setLang(l); saveLang(l); }}
                      className={`uppercase ${lang === l ? "text-foreground" : "text-foreground/50 hover:text-foreground"}`}
                    >
                      {l}
                    </button>
                  </span>
                ))}
              </span>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroCard;

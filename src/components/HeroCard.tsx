import { useEffect, useState } from "react";
import { onLangChange, readLang, saveLang, type Lang } from "@/lib/lang";
import { useT } from "@/lib/i18n";
import CycleIcon from "@/components/CycleIcon";

const KEY = "pj-card-closed";

/**
 * The hero's menu card, at the top left on every screen: a short intro, the way to start a
 * project, and Work · Contact · EN/ES. It belongs to the hero, so the projects
 * sheet slides up over it like over the rest of the hero. Opens by default;
 * the visitor can fold it to “Jose Peláez +”, and that holds for the visit.
 */
const HeroCard = () => {
  const [open, setOpen] = useState(() => {
    try {
      return sessionStorage.getItem(KEY) !== "1";
    } catch {
      return true;
    }
  });
  const shown = open;

  const [lang, setLang] = useState<Lang>(readLang);
  const t = useT();
  useEffect(() => onLangChange(setLang), []);
  const goTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const toggle = () => {
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
      data-menu-card
      className={`absolute z-20 left-3 top-3 rounded-[4px] bg-white text-foreground animate-fade-up transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        shown ? "right-3 md:right-auto md:w-[min(44vw,420px)] lg:w-[min(30vw,420px)]" : "w-[180px]"
      }`}
      style={{ animationDelay: "0.6s", animationFillMode: "backwards" }}
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
                window.dispatchEvent(new Event("open-brief"));
                document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="mt-1 self-start inline-flex items-center gap-3 rounded-full bg-foreground text-background px-6 py-3.5 text-[14px] font-medium tracking-[0.01em] transition-transform duration-300 hover:scale-[1.04]"
            >
              {t("startProject")} <CycleIcon />
            </a>
            {/* The menu: the site's only one, on every screen size */}
            <nav aria-label="Menu" className="flex items-center gap-6 mt-2 pt-5 border-t border-foreground/15 text-[14px] tracking-[0.01em]">
              <a href="#work" tabIndex={shown ? 0 : -1} onClick={(e) => { e.preventDefault(); goTo("work"); }} className="text-foreground/70 hover:text-foreground">
                {t("work")}
              </a>
              <a href="#contact" tabIndex={shown ? 0 : -1} onClick={(e) => { e.preventDefault(); goTo("contact"); }} className="text-foreground/70 hover:text-foreground">
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

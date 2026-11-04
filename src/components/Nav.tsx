import { useEffect, useState, type MouseEventHandler } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { onLangChange, readLang, saveLang, type Lang } from "@/lib/lang";
import { useT } from "@/lib/i18n";
import { useHideOnScroll } from "@/lib/useHideOnScroll";

/**
 * Hides while scrolling down and comes back on the way up. Text uses a difference blend, so it reads on the white
 * sheets, the grey hero and the black footer alike. On a case page the
 * middle names the project; the right holds the links and the language switch.
 */
const Nav = ({ subtitle }: { subtitle?: string }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const onHome = pathname === "/";
  const [lang, setLang] = useState<Lang>(readLang);
  const t = useT();
  // Out of the way while scrolling down, back as soon as you scroll up
  const hidden = useHideOnScroll();
  useEffect(() => onLangChange(setLang), []);

  // On the home (wide screens) the card at the top left is the menu, so these
  // links stay out; phones keep them, since the card only shows in the hero.
  const inCard = onHome;

  const goTo =
    (id: string): MouseEventHandler<HTMLAnchorElement> =>
    (e) => {
      e.preventDefault();
      if (onHome) {
        const el = document.getElementById(id);
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - (id === "work" ? 20 : 0), behavior: "smooth" });
      } else {
        // Not on the home page: go there and let Index.tsx scroll to it once mounted
        navigate(`/#${id}`);
      }
    };

  const pickLang = (l: Lang) => {
    setLang(l);
    saveLang(l);
  };

  const LINK = "text-[14px] font-normal text-white/70 tracking-[0.01em] transition-colors duration-300 hover:text-white";

  return (
    <>
      {/* Name on the left, links on the right, all in the same 14px text */}
      <nav
        className="fixed top-0 left-0 right-0 z-[200] px-5 md:px-10 pt-5 md:pt-7 animate-slide-down mix-blend-difference text-white pointer-events-none"
        style={{ translate: hidden ? "0 -100%" : "0 0", transition: "translate 500ms cubic-bezier(0.22,1,0.36,1)" }}
      >
        <div className="relative flex items-center justify-between min-h-[20px]">
          {/* The home's hero card carries the name; elsewhere it's the way home */}
          {onHome ? (
            <span />
          ) : (
            <Link to="/" className="pointer-events-auto text-[14px] font-medium text-white tracking-[0.01em]">
              Jose Peláez
            </Link>
          )}
          {/* On a case page: the project */}
          {subtitle && (
            <span className="hidden md:block absolute left-1/2 -translate-x-1/2 text-[14px] font-normal text-white/70 tracking-[0.01em]">
              {subtitle}
            </span>
          )}
          {/* Only the links take clicks: the bar spans the width, over the hero card */}
          <div
            className={`flex items-center gap-6 transition-opacity duration-500 ${
              inCard ? "md:opacity-0 md:pointer-events-none pointer-events-auto" : "pointer-events-auto"
            }`}
          >
            <Link to="/#work" onClick={goTo("work")} className={LINK}>
              {t("work")}
            </Link>
            <Link to="/#contact" onClick={goTo("contact")} className={LINK}>
              {t("contact")}
            </Link>
            <span className="flex items-center gap-1.5 text-[14px] tracking-[0.01em]" role="group" aria-label="Language">
              {(["en", "es"] as const).map((l, i) => (
                <span key={l} className="flex items-center gap-1.5">
                  {i > 0 && <span aria-hidden="true" className="text-white/40">/</span>}
                  <button
                    type="button"
                    lang={l}
                    aria-pressed={lang === l}
                    onClick={() => pickLang(l)}
                    className={`uppercase transition-colors duration-300 ${lang === l ? "text-white" : "text-white/50 hover:text-white"}`}
                  >
                    {l}
                  </button>
                </span>
              ))}
            </span>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Nav;

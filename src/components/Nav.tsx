import { useEffect, useState, type MouseEventHandler } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logoLetter from "@/assets/logo-letter.svg";

const Nav = ({ subtitle }: { subtitle?: string }) => {
  const [showContact, setShowContact] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const onLab = pathname === "/lab";
  const onHome = pathname === "/";

  // Hide on the way down, come back on the way up (always shown near the top).
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let lastY = window.scrollY;
    let raf: number | null = null;
    const check = () => {
      raf = null;
      const y = window.scrollY;
      const dy = y - lastY;
      if (y < 120) setHidden(false);
      else if (dy > 6) setHidden(true);
      else if (dy < -6) setHidden(false);
      if (Math.abs(dy) > 6 || y < 120) lastY = y;
    };
    const onScroll = () => {
      if (raf === null) raf = requestAnimationFrame(check);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);

  // Frosted-glass logo while it sits over the projects grid.
  const [glass, setGlass] = useState(false);
  useEffect(() => {
    let raf: number | null = null;
    const check = () => {
      raf = null;
      const work = document.getElementById("work");
      if (!work) return setGlass(false);
      const r = work.getBoundingClientRect();
      // The tile spans y 12–60px.
      setGlass(r.top < 60 && r.bottom > 12);
    };
    const onScroll = () => {
      if (raf === null) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [pathname]);

  const scrollToId = (
    id: string,
    e: Parameters<MouseEventHandler<HTMLAnchorElement>>[0],
  ) => {
    if (onHome) {
      e.preventDefault();
      const el = document.getElementById(id);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 20;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    } else {
      // Not on the home page: navigate there and let Index.tsx's own
      // hash effect scroll to the section once it has mounted.
      e.preventDefault();
      navigate(`/#${id}`);
    }
  };

  const handleProjectsClick: MouseEventHandler<HTMLAnchorElement> = (e) =>
    scrollToId("work", e);
  const handleLabClick: MouseEventHandler<HTMLAnchorElement> = (e) =>
    scrollToId("lab", e);

  return (
    <>
      {/* Logo mark: its own fixed layer (outside the nav's difference blend,
          which would invert it) — a 48×48 white tile, 4px radius, with the
          smiling "J." mark (logo-letter.svg), on the site's 12px edge. Over the projects grid it
          turns to frosted glass (same shape) so the covers show through. */}
      <Link
        to="/"
        aria-label="Jose Peláez — home"
        // `translate` (not transform) so it composes with the entrance animation.
        style={{
          translate: hidden ? "0 -72px" : "0 0",
          transition:
            "translate 500ms cubic-bezier(0.22,1,0.36,1), background-color 500ms, backdrop-filter 500ms, transform 300ms",
        }}
        className={`fixed top-3 left-3 z-[201] flex h-12 w-12 items-center justify-center rounded-[4px] animate-slide-down transition-[background-color,backdrop-filter,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${hidden ? "" : "hover:scale-[1.04]"} ${
          glass
            ? "bg-white/45 backdrop-blur-xl backdrop-saturate-150"
            : "bg-white"
        }`}
      >
        {/* Placed exactly as in logo.svg (x 13.9, y 15 in the 48px tile) —
            a hair below geometric centre, optically. */}
        <img
          src={logoLetter}
          alt=""
          width={19}
          height={21}
          className="block translate-x-[-0.6px] translate-y-[1.5px]"
          draggable={false}
        />
      </Link>

      {/* Links (and the page subtitle, if any) keep the difference blend so
        they stay legible over light and dark sections. Vertically centred on
        the logo tile (12px + 48px / 2 = 36px). */}
      <nav
        className={`fixed top-0 left-0 right-0 z-[200] px-3 pt-[24px] animate-slide-down mix-blend-difference text-white `}
        style={{
          translate: hidden ? "0 -100%" : "0 0",
          transition: "translate 500ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <div className="max-w-[1900px] mx-auto flex items-center justify-between">
          <div className="pl-[60px] min-h-[20px] flex items-center">
            {subtitle && (
              <span className="text-[13px] font-light leading-[1.3] text-white/60 tracking-[0.01em]">
                {subtitle}
              </span>
            )}
          </div>
          <div className="flex items-center gap-6">
            <Link
              to="/#work"
              onClick={handleProjectsClick}
              className="text-[13px] font-light text-white/70 tracking-[0.01em] transition-colors duration-300 hover:text-white"
            >
              Work
            </Link>
            <Link
              to="/#lab"
              onClick={handleLabClick}
              className={`text-[13px] tracking-[0.01em] transition-colors duration-300 hover:text-white ${
                onLab ? "font-medium text-white" : "font-light text-white/70"
              }`}
            >
              Lab
            </Link>
            <div className="relative">
              <button
                onClick={() => setShowContact(!showContact)}
                className="text-[13px] font-light text-white/70 tracking-[0.01em] transition-colors duration-300 hover:text-white"
              >
                Contact
              </button>
              {showContact && (
                <div
                  className="absolute top-8 right-0 flex flex-col items-end gap-1.5 animate-fade-up"
                  style={{ animationDuration: "0.3s" }}
                >
                  <a
                    href="tel:+34659274031"
                    className="text-[12px] font-light text-white/60 tracking-[0.01em] transition-colors duration-300 hover:text-white whitespace-nowrap"
                  >
                    +34 659 274 031
                  </a>
                  <a
                    href="mailto:josepelaez0218@gmail.com"
                    className="text-[12px] font-light text-white/60 tracking-[0.01em] transition-colors duration-300 hover:text-white whitespace-nowrap"
                  >
                    josepelaez0218@gmail.com
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Nav;

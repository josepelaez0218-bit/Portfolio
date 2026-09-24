import { useState, type MouseEventHandler } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Nav = ({ subtitle }: { subtitle?: string }) => {
  const [showContact, setShowContact] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const onLab = pathname === "/lab";
  const onHome = pathname === "/";

  const handleProjectsClick: MouseEventHandler<HTMLAnchorElement> = (e) => {
    if (onHome) {
      e.preventDefault();
      const el = document.getElementById("work");
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 20;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    } else {
      // Not on the home page: navigate there and let Index.tsx's own
      // hash effect scroll to #work once the section has mounted.
      e.preventDefault();
      navigate("/#work");
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[200] px-6 md:px-8 pt-7 animate-slide-down mix-blend-difference text-white">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between">
        <div className="flex flex-col">
          <Link
            to="/"
            className="text-[13.5px] font-medium leading-[1.45] tracking-[0.01em]"
          >
            Buen Puerto
          </Link>
          {subtitle && (
            <span className="text-[12px] font-light leading-[1.3] text-white/50 tracking-[0.01em]">
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
            Proyectos
          </Link>
          <Link
            to="/lab"
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
              Contacto
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
  );
};

export default Nav;

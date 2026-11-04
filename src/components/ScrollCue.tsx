import { useEffect, useState } from "react";

/**
 * “Scroll” hint at the foot of the full-screen hero: the hero fills the
 * whole screen, so without it some visitors never find the projects below.
 * A dot runs down a short line; clicking it scrolls to the intro. Fades out
 * as soon as the page moves and comes back at the very top.
 */
const ScrollCue = ({ targetId }: { targetId: string }) => {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onScroll = () => setHidden(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goDown = () => {
    const el = document.getElementById(targetId);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: "smooth" });
  };

  // Centred by the wrapper: the fade-up animation owns the button's transform.
  return (
    <div
      className={`absolute inset-x-0 z-20 flex justify-center transition-opacity duration-500 ${
        hidden ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}
    >
    <button
      type="button"
      onClick={goDown}
      aria-label="Scroll to see the projects"
      tabIndex={hidden ? -1 : 0}
      className="flex flex-col items-center gap-3 px-4 pt-2 pb-3 text-foreground/70 hover:text-foreground animate-fade-up"
      style={{ animationDelay: "1.4s", animationFillMode: "both" }}
    >
      <span className="text-[13px] font-medium tracking-[0.08em] uppercase">Scroll</span>
      <span aria-hidden="true" className="relative block w-px h-10 bg-foreground/20 overflow-hidden">
        <span className="scroll-cue-dot absolute left-0 top-0 w-px h-3 bg-foreground" />
      </span>
    </button>
    </div>
  );
};

export default ScrollCue;

import { useEffect, useRef, type ReactNode } from "react";

/**
 * A block that scrolls normally until its bottom reaches the bottom of the
 * screen, then stays there — so the next block slides up over it instead of
 * pushing it away. (Sticky with a negative top: viewport height minus its own.)
 * It can stop earlier: with the top of [data-sheet-stop] at the top of the
 * screen, as long as [data-sheet-keep] still fits whole above the bottom.
 */
const StackSheet = ({ children, className = "" }: { children: ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current!;
    const fit = () => {
      // Phones scroll plainly: their address bar changes the screen height as
      // it shows and hides, and a sheet that re-fits to it makes the page jump
      if (!window.matchMedia("(min-width: 1024px)").matches) {
        el.style.position = "relative";
        el.style.top = "";
        return;
      }
      el.style.position = "";
      const stop = el.querySelector("[data-sheet-stop]");
      if (!stop) {
        el.style.top = `${Math.min(0, window.innerHeight - el.offsetHeight)}px`;
        return;
      }
      const at = (n: Element | null, edge: "top" | "bottom") => (n ? n.getBoundingClientRect()[edge] - el.getBoundingClientRect().top : 0);
      const keep = at(el.querySelector("[data-sheet-keep]"), "bottom") - window.innerHeight;
      el.style.top = `${Math.min(0, -Math.max(at(stop, "top"), keep))}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, []);

  return (
    <div ref={ref} className={`sticky ${className}`}>
      {children}
    </div>
  );
};

export default StackSheet;

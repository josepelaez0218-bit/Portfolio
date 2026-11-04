import { useEffect, useRef, type ReactNode } from "react";

/**
 * A block that scrolls normally until its bottom reaches the bottom of the
 * screen, then stays there — so the next block slides up over it instead of
 * pushing it away. (Sticky with a negative top: viewport height minus its own.)
 */
const StackSheet = ({ children, className = "" }: { children: ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current!;
    const fit = () => {
      el.style.top = `${Math.min(0, window.innerHeight - el.offsetHeight)}px`;
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

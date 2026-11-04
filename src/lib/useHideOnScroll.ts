import { useEffect, useState } from "react";

/** True while scrolling down (past the top); false as soon as you scroll back up. */
export const useHideOnScroll = (threshold = 120) => {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let lastY = window.scrollY;
    let raf: number | null = null;
    const check = () => {
      raf = null;
      const y = window.scrollY;
      const dy = y - lastY;
      if (y < threshold) setHidden(false);
      else if (dy > 6) setHidden(true);
      else if (dy < -6) setHidden(false);
      if (Math.abs(dy) > 6 || y < threshold) lastY = y;
    };
    const onScroll = () => {
      if (raf === null) raf = requestAnimationFrame(check);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [threshold]);
  return hidden;
};

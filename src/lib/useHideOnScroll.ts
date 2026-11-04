import { useEffect, useState } from "react";

/**
 * True once the visitor scrolls down past the top; false again only when they
 * scroll back up themselves (wheel, finger or keys) or reach the top. Moves the
 * page makes on its own — the magnetic snap between sheets — don't count.
 */
export const useHideOnScroll = (threshold = 120) => {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const atTop = () => window.scrollY < threshold;
    const intent = (dir: number) => {
      if (atTop()) return setHidden(false);
      if (dir > 0) setHidden(true);
      else if (dir < 0) setHidden(false);
    };
    let touchY = 0;
    const onWheel = (e: WheelEvent) => Math.abs(e.deltaY) > 2 && intent(e.deltaY);
    const onTouchStart = (e: TouchEvent) => (touchY = e.touches[0].clientY);
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      if (Math.abs(y - touchY) > 8) {
        intent(touchY - y);
        touchY = y;
      }
    };
    const DOWN = ["ArrowDown", "PageDown", " ", "End"];
    const UP = ["ArrowUp", "PageUp", "Home"];
    const onKey = (e: KeyboardEvent) => (DOWN.includes(e.key) ? intent(1) : UP.includes(e.key) ? intent(-1) : undefined);
    const onScroll = () => atTop() && setHidden(false);

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, [threshold]);
  return hidden;
};

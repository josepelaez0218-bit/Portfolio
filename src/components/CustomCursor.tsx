import { useEffect, useRef } from "react";

const CustomCursor = () => {
  const curRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(max-width: 768px)").matches) return;

    const cur = curRef.current;
    const ring = ringRef.current;
    if (!cur || !ring) return;

    let mx = 0, my = 0, rx = 0, ry = 0;
    let rafId: number;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      cur.style.left = mx + "px";
      cur.style.top = my + "px";
    };

    const tick = () => {
      rx += (mx - rx) * 0.13;
      ry += (my - ry) * 0.13;
      ring.style.left = rx + "px";
      ring.style.top = ry + "px";
      rafId = requestAnimationFrame(tick);
    };

    document.addEventListener("mousemove", onMove, { passive: true });
    rafId = requestAnimationFrame(tick);

    // Hover effects on interactive elements
    const onEnter = () => {
      cur.style.width = cur.style.height = "14px";
      ring.style.width = ring.style.height = "50px";
      ring.style.transition = "width .2s ease, height .2s ease";
    };
    const onLeave = () => {
      cur.style.width = cur.style.height = "7px";
      ring.style.width = ring.style.height = "32px";
    };

    const interactives = document.querySelectorAll("a, button");
    interactives.forEach((el) => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    // Iframes (the cloth/hero animations) are a separate document — mouse
    // events inside them never reach this document's "mousemove" listener,
    // so the custom cursor would otherwise freeze in place while the
    // iframe's own native cursor shows on top of it. Hide ours whenever the
    // pointer is over one, and let the iframe's own cursor take over.
    const hideCursor = () => {
      cur.style.opacity = "0";
      ring.style.opacity = "0";
    };
    const showCursor = () => {
      cur.style.opacity = "1";
      ring.style.opacity = "1";
    };
    const iframes = document.querySelectorAll("iframe");
    iframes.forEach((el) => {
      el.addEventListener("mouseenter", hideCursor);
      el.addEventListener("mouseleave", showCursor);
    });

    document.body.style.cursor = "none";

    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
      interactives.forEach((el) => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
      iframes.forEach((el) => {
        el.removeEventListener("mouseenter", hideCursor);
        el.removeEventListener("mouseleave", showCursor);
      });
      document.body.style.cursor = "";
    };
  }, []);

  return (
    <>
      <div ref={curRef} className="custom-cursor" aria-hidden="true" />
      <div ref={ringRef} className="custom-cursor-ring" aria-hidden="true" />
    </>
  );
};

export default CustomCursor;

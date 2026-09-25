import { useEffect, useState } from "react";

// Rough reading time: ~230 wpm plus a beat to register the icon change,
// clamped so short and long phrases both get a reasonable dwell time.
const readingDuration = (text: string) => {
  const words = text.trim().split(/\s+/).length;
  return Math.min(8000, Math.max(3500, 900 + (words / 230) * 60000));
};

const ITEMS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 20h18" />
        <path d="M5 20 11 8l4 6 2-3 2 7" />
        <path d="M11 8V3" />
        <path d="M11 3.5c1-.8 2.2-.8 3 0s2 .8 3 0v4c-1 .8-2.2 .8-3 0s-2-.8-3 0" />
      </svg>
    ),
    text: "A multidisciplinary background, where the tools adapt to each project's goal.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="13" rx="1.5" />
        <path d="M8 21h8" />
        <path d="M12 17v4" />
      </svg>
    ),
    text: "Websites and digital products, designed end-to-end: interfaces, interactions and the systems behind them.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3a14 14 0 0 1 0 18" />
        <path d="M12 3a14 14 0 0 0 0 18" />
      </svg>
    ),
    text: "Projects with international scope, collaborating with teams across different countries.",
  },
];

/**
 * Short intro block between the hero and the projects grid. Clicking an
 * icon swaps the copy below it — multidisciplinary background, web/product
 * design, and international scope.
 */
const IntroText = () => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const duration = readingDuration(ITEMS[active].text);
    const id = setTimeout(() => {
      setActive((i) => (i + 1) % ITEMS.length);
    }, duration);
    return () => clearTimeout(id);
  }, [active]);

  return (
    <section className="relative z-10 w-full bg-background px-6 pt-[104px] pb-[136px]">
      <div className="max-w-[560px] mx-auto flex flex-col items-center text-center">
        <div className="flex items-center gap-3 mb-6">
          {ITEMS.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={active === i}
              aria-label={`Show text ${i + 1}`}
              className={`w-5 h-5 transition-colors duration-300 ${
                active === i ? "text-foreground" : "text-foreground/20 hover:text-foreground/40"
              }`}
            >
              {item.icon}
            </button>
          ))}
        </div>
        <div
          className="flex items-center justify-center"
          style={{
            fontSize: "clamp(1.15rem, 1.5vw + 0.9rem, 1.75rem)",
            lineHeight: 1.4,
            minHeight: "calc(1.4em * 3)",
          }}
        >
          <p
            key={active}
            className="font-serif font-light text-foreground/80 animate-fade-up"
            style={{ animationDuration: "0.4s" }}
          >
            {ITEMS[active].text}
          </p>
        </div>
      </div>
    </section>
  );
};

export default IntroText;

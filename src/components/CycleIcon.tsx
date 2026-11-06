import { useEffect, useState } from "react";

// Drawn on a 16px grid in the button's text colour, 1.5px lines
const ICONS = [
  // Arrow
  <path key="arrow" d="M2.5 8h11M9 3.5 13.5 8 9 12.5" />,
  // Spark
  <path key="spark" d="M8 1.5c.6 3.6 2.9 5.9 6.5 6.5-3.6.6-5.9 2.9-6.5 6.5-.6-3.6-2.9-5.9-6.5-6.5 3.6-.6 5.9-2.9 6.5-6.5Z" />,
  // Smile (the favicon's)
  <g key="smile"><circle cx="5.5" cy="5.5" r=".6" fill="currentColor" /><circle cx="10.5" cy="5.5" r=".6" fill="currentColor" /><path d="M4 9.5c1 1.7 2.3 2.5 4 2.5s3-.8 4-2.5" /></g>,
  // Asterisk
  <path key="asterisk" d="M8 2v12M2.8 5l10.4 6M2.8 11l10.4-6" />,
  // Pencil
  <path key="pencil" d="M10.5 2.5 13.5 5.5 5.5 13.5H2.5V10.5ZM9 4l3 3" />,
];

// The scroll cue: the same arrow pointing down, over and over
const DOWN = [0, 1].map((k) => <path key={k} d="M8 2.5v11M3.5 9 8 13.5 12.5 9" />);
// The case cursor: the same arrow pointing right
const RIGHT = [0, 1].map((k) => <path key={k} d="M2.5 8h11M9 3.5 13.5 8 9 12.5" />);

const EVERY_MS = 1600;

/**
 * The CTA's icon: an arrow that every so often slides up and out, making way
 * for the next small drawing (spark, smile, asterisk, pencil) and back round.
 * With reduced motion it's just the arrow.
 */
const CycleIcon = ({ down = false, right = false, stroke = 1.5 }: { down?: boolean; right?: boolean; stroke?: number }) => {
  const icons = right ? RIGHT : down ? DOWN : ICONS;
  // Down: the arrow drops out of the bottom and the next comes in from the
  // top; right: it leaves on the right and the next comes in from the left
  const out = down || right ? "110%" : "-110%";
  const wait = down || right ? "-110%" : "110%";
  const axis = right ? "X" : "Y";
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % icons.length), EVERY_MS);
    return () => window.clearInterval(id);
  }, [icons.length]);

  return (
    <span aria-hidden="true" className="relative inline-block size-4 overflow-hidden align-[-0.15em]">
      {icons.map((icon, k) => {
        // The one showing sits in place; the one before has gone up, the rest wait below
        const pos = k === i ? "0%" : k === (i - 1 + icons.length) % icons.length ? out : wait;
        return (
          <svg
            key={k}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute inset-0 size-4"
            style={{
              transform: `translate${axis}(${pos})`,
              opacity: k === i ? 1 : 0,
              // Only the two moving get a transition, so the rest jump below unseen
              transition: pos === wait ? "none" : "transform 0.5s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease",
            }}
          >
            {icon}
          </svg>
        );
      })}
    </span>
  );
};

export default CycleIcon;

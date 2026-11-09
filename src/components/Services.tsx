import { useEffect, useState, type CSSProperties } from "react";
import { useLang, useT } from "@/lib/i18n";
import { services as getServices } from "@/lib/siteTexts";
import { LEAD_NAMES, PIECES, type Pic } from "@/components/services-gallery/pieces";
import Carousel3D from "@/components/services-gallery/Carousel3D";
import Parallax from "@/components/services-gallery/Parallax";

// The section's own colours (HSL, like the site's tokens), so every
// text-foreground/… inside takes them: a black sheet between the white ones
const vars = { ["--background" as string]: "0 0% 4%", ["--foreground" as string]: "0 0% 96%" } as CSSProperties;

const pad = (i: number) => String(i + 1).padStart(2, "0");

/**
 * What Jose does and the work behind it, between the projects and the
 * contact, on a black sheet: a big title, the four services, then the work
 * as a card file that never stops turning (on phones, a parallax gallery).
 */
const Services = () => {
  const lang = useLang();
  const t = useT(); // also re-renders when the Sanity texts arrive
  // Texts and pictures from Sanity ("Textos de la web" → Servicios)
  const fromSanity = getServices(lang);
  const list = fromSanity;
  const leads: Pic[] = list.map((s, i) => ({ src: s.src, alt: s.alt, ratio: s.ratio, name: LEAD_NAMES[i] ?? s.name }));
  const pieces: Pic[] = [...leads, ...PIECES.map((p) => ({ src: p.src, ratio: p.ratio, name: p.name, alt: p.alt[lang] }))];

  const [wide, setWide] = useState(() => window.matchMedia("(min-width: 1024px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  return (
    <section id="services" className="relative z-20 w-full bg-background text-foreground" style={vars}>
      {/* The title holds at the top while the services slide up over it */}
      <div className="sticky top-0 z-0 px-3 pt-20 md:pt-28 pb-16 md:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-6 items-end">
          <h2 className="lg:col-span-8 font-display font-normal leading-[0.95] tracking-[-0.03em] text-[clamp(3rem,9vw,9rem)] text-balance">
            {t("servicesTitle")}
          </h2>
          <p className="lg:col-span-4 text-[16px] md:text-[18px] leading-[1.5] text-foreground/80 max-w-[44ch] lg:justify-self-end lg:text-right">
            {t("servicesLead")}
          </p>
        </div>
      </div>

      {/* The sheet stops with this line at the top of the screen (see StackSheet);
          flow-root keeps the card file's bottom margin inside, so the hero never shows below */}
      <div data-sheet-stop className="relative z-10 flow-root bg-background border-t border-foreground/20">
        <ol className="px-3 pt-8 md:pt-10 pb-12 md:pb-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
          {list.map((s, i) => (
            <li key={s.name} className="flex flex-col gap-3">
              <span className="text-[14px] text-foreground/60 tabular-nums tracking-[0.01em]">{pad(i)}</span>
              <h3 className="font-display font-normal leading-[1.1] tracking-[-0.02em] text-[28px] md:text-[32px]">{s.name}</h3>
              <p className="text-[14px] leading-[1.5] tracking-[0.01em] text-foreground/70 max-w-[38ch]">{s.line}</p>
            </li>
          ))}
        </ol>

        {/* Phones get a lighter gallery: two columns drifting apart as you scroll */}
        {wide ? <Carousel3D pieces={pieces} /> : <Parallax pieces={pieces.slice(0, 12)} />}
      </div>
    </section>
  );
};

export default Services;

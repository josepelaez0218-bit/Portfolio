import type { ReactNode } from "react";
import { urlForImage } from "@/lib/sanity/image";
import type { SanitySectionBlock } from "@/lib/sanity/types";

type Media = { kind: "img"; im: NonNullable<SanitySectionBlock["images"]>[number] } | { kind: "video"; src: string; caption?: string };
const mediaOf = (s: SanitySectionBlock): Media[] => {
  const imgs: Media[] = (s.images ?? []).map((im) => ({ kind: "img", im }));
  const vids: Media[] = [
    ...(s.videoUrl ? [{ kind: "video" as const, src: s.videoUrl, caption: s.videoCaption }] : []),
    ...(s.video2Url ? [{ kind: "video" as const, src: s.video2Url }] : []),
  ];
  return s.mediaOrder === "video-first" ? [...vids, ...imgs] : [...imgs, ...vids];
};


const pad = (i: number) => String(i + 1).padStart(2, "0");
const Num = ({ i, label, headline }: { i: number; label: string; headline?: string }) => (
  <span className="text-[14px] text-foreground/60 tabular-nums">
    {pad(i)}
    {headline && <span className="ml-3">{label}</span>}
  </span>
);
const Title = ({ children }: { children: ReactNode }) => (
  <h2 className="font-display font-normal leading-[1.1] tracking-[-0.02em] text-[24px] md:text-[28px] text-foreground">{children}</h2>
);
const Body = ({ s }: { s: SanitySectionBlock }) => (
  <div className="flex flex-col gap-4">
    {s.body.split(/\n{2,}/).map((p, k) => (
      <p key={k} className="text-[16px] leading-[1.6] text-foreground/70">
        {p}
      </p>
    ))}
  </div>
);
const Stats = ({ s, className = "" }: { s: SanitySectionBlock; className?: string }) =>
  s.stats && s.stats.length > 0 ? (
    <div className={`grid grid-cols-2 sm:grid-cols-3 gap-2 ${className}`}>
      {s.stats.map((st, k) => (
        <div key={k} className="rounded-[4px] bg-[#f5f5f5] px-5 py-5 flex flex-col gap-1.5">
          <span className="font-display font-normal leading-[1] tracking-[-0.02em] text-[32px] md:text-[40px]">{st.value}</span>
          <span className="text-[14px] text-foreground/60">{st.label}</span>
        </div>
      ))}
    </div>
  ) : null;

/**
 * A case section, final version. One reading axis on the home's 12 columns:
 * everything sits in columns 2–11 (≈1170px at 1440), so pictures stay a
 * readable size and never fill the screen edge to edge; pairs share the axis
 * 50/50 at 4:3, a lone picture spans it at 16:9, so all edges line up. Under the
 * pictures, as their caption: number and name (cols 2–4), the text (cols 5–9,
 * ~65 characters a line, 16px, secondary grey).
 */
// bare: no hairline (pieces already sit on their own plates)
export const CaseSection = ({ s, i, bare = false }: { s: SanitySectionBlock; i: number; bare?: boolean }) => {
  const media = mediaOf(s);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-x-10">
      <div className="lg:col-start-2 lg:col-span-10 flex flex-col gap-8 md:gap-10">
        {/* Fixed shapes so every edge lines up: pairs 4:3 side by side (same
            height), a picture on its own 16:9 across the whole axis. Crops
            follow the hotspot set in Sanity. */}
        {media.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {media.map((m, k) => {
              const alone = media.length % 2 === 1 && k === media.length - 1;
              return (
                <div key={k} className={alone ? "md:col-span-2" : ""}>
                  <Framed m={m} ratio={alone ? 16 / 9 : 4 / 3} w={alone ? 2200 : 1200} bare={bare} />
                </div>
              );
            })}
          </div>
        )}
        <Stats s={s} />
        <div className="grid grid-cols-1 md:grid-cols-10 gap-x-10 gap-y-3">
          <div className="md:col-span-3 flex flex-col gap-2">
            <Num i={i} label={s.label} headline={s.headline} />
            <Title>{s.headline || s.label}</Title>
          </div>
          <div className="md:col-span-5 md:col-start-4 md:pt-[1.75rem] max-w-[52ch]">
            <Body s={s} />
          </div>
        </div>
      </div>
    </div>
  );
};

/** A picture or clip cropped to a fixed shape (the Sanity hotspot decides what stays). */
const Framed = ({ m, ratio, w, bare = false }: { m: Media; ratio: number; w: number; bare?: boolean }) => (
  // A 1px hairline drawn over the picture (inside, so sizes don't change):
  // white pieces keep their edge on the white page; on dark ones it's invisible
  <div
    className={`relative overflow-hidden rounded-[4px] bg-[#f5f5f5] ${bare ? "" : "after:pointer-events-none after:absolute after:inset-0 after:rounded-[4px] after:border after:border-foreground/10"}`}
    style={{ aspectRatio: String(ratio) }}
  >
    {m.kind === "video" ? (
      <video src={m.src} autoPlay playsInline loop muted className="block w-full h-full object-cover" />
    ) : (
      <img
        src={urlForImage(m.im).width(w).height(Math.round(w / ratio)).fit("crop").quality(85).url()}
        alt={m.im.alt}
        loading="lazy"
        className="block w-full h-full object-cover"
      />
    )}
  </div>
);

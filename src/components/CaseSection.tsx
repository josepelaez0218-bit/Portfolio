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


const isFull = (m: Media) => m.kind === "img" && Boolean(m.im.full);

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
// Cases whose pictures are all UI captures: shown whole inside the same
// frames (with room around), since cropping one cuts its interface off
const WHOLE = new Set(["seedtag-design-system"]);

export const CaseSection = ({ s, i, bare = false, slug = "" }: { s: SanitySectionBlock; i: number; bare?: boolean; slug?: string }) => {
  const media = mediaOf(s);
  const framed = media.filter((m) => !isFull(m));
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-x-10">
      <div className="lg:col-start-2 lg:col-span-10 flex flex-col gap-8 md:gap-10">
        {/* Fixed shapes so every edge lines up: pairs 4:3 side by side (same
            height), a picture on its own 16:9 across the whole axis. Crops
            follow the hotspot set in Sanity. */}
        {media.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* Pictures marked full go first, across the axis at their own proportion, unframed */}
            {media.filter(isFull).map((m, k) => (
              <div key={`full-${k}`} className="md:col-span-2">
                {m.kind === "img" && <img src={urlForImage(m.im).width(2400).quality(85).url()} alt={m.im.alt} loading="lazy" className="block w-full h-auto" />}
              </div>
            ))}
            {framed.map((m, k) => {
              const alone = framed.length % 2 === 1 && k === framed.length - 1;
              return (
                <div key={k} className={alone ? "md:col-span-2" : ""}>
                  <Framed m={m} ratio={alone ? 16 / 9 : 4 / 3} w={alone ? 2200 : 1200} bare={bare} whole={WHOLE.has(slug)} />
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

/**
 * A picture or clip cropped to a fixed shape (the Sanity hotspot decides what
 * stays) or, when whole, fitted inside it with a margin, nothing cut.
 */
const Framed = ({ m, ratio, w, bare = false, whole = false }: { m: Media; ratio: number; w: number; bare?: boolean; whole?: boolean }) => (
  // A 1px hairline drawn over the picture (inside, so sizes don't change):
  // white pieces keep their edge on the white page; on dark ones it's invisible
  <div
    className={`relative overflow-hidden rounded-[4px] bg-[#f5f5f5] ${bare ? "" : "after:pointer-events-none after:absolute after:inset-0 after:rounded-[4px] after:border after:border-foreground/10"}`}
    style={{ aspectRatio: String(ratio) }}
  >
    <div className={`w-full h-full ${whole ? "p-[6%]" : ""}`}>
      {m.kind === "video" ? (
        <video src={m.src} autoPlay playsInline loop muted className={`block w-full h-full ${whole ? "object-contain" : "object-cover"}`} />
      ) : (
        <img
          src={(whole ? urlForImage(m.im).width(w) : urlForImage(m.im).width(w).height(Math.round(w / ratio)).fit("crop")).quality(85).url()}
          alt={m.im.alt}
          loading="lazy"
          className={`block w-full h-full ${whole ? "object-contain" : "object-cover"}`}
        />
      )}
    </div>
  </div>
);

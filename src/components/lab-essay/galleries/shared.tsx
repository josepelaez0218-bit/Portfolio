import { useEffect, useState } from "react";
import { fetchLabItems } from "@/lib/sanity/queries";
import { urlForImage } from "@/lib/sanity/image";
import type { SanityLabItem } from "@/lib/sanity/types";

/** Same contract for every Lab gallery, so the pinned scene can swap them. */
export type GalleryHandle = {
  /** Drive the gallery from the pinned scene's scroll (px scrolled, viewport height). */
  update: (scrolled: number, vh: number) => void;
};

export type GalleryProps = {
  /** Scrolled vh over which the pieces come in. */
  riseVh: [number, number];
  /** Scrolled vh at which the gallery starts moving with the scroll. */
  travelStartVh: number;
  /** Reports how much scroll (px) the gallery needs after travelStartVh, so the scene can size itself. */
  onTravel: (px: number) => void;
};

// Local-only preview (dev server only, never in production builds): a draft
// Lab piece to judge its video before creating it in Sanity. `posterUrl` is
// only for drafts — Sanity items use their image as the poster.
export type LabCover = SanityLabItem & { posterUrl?: string };
const LOCAL_LAB_DRAFTS: LabCover[] = import.meta.env.DEV
  ? [
      {
        _id: "local-tubo",
        image: "",
        posterUrl: "/local-covers/lab-tubo-poster.jpg",
        videoUrl: "/local-covers/lab-tubo.mp4",
        alt: "A black and white square tube spiralling down, “Don’t forget to play” flowing along it",
        caption: "Don’t forget to play",
        aspect: 1080 / 1350,
      },
      {
        _id: "local-gyro",
        image: "",
        posterUrl: "https://cdn.sanity.io/images/2u19gait/production/9ae5d60d748cbf3a4b815e87fd2924bcca58145c-912x480.jpg",
        videoUrl: "https://cdn.sanity.io/files/2u19gait/production/8049dad4816286f14bfb0dde88b5ea75cd52b2dc.mp4",
        alt: "Jazz Gyro: a landing page that plays as you tilt the phone",
        caption: "Jazz Gyro",
        aspect: 912 / 480,
      },
    ]
  : [];

export const useLabItems = () => {
  const [items, setItems] = useState<LabCover[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetchLabItems()
      .then((data) => !cancelled && setItems([...LOCAL_LAB_DRAFTS, ...data]))
      .catch((err) => console.error("Failed to load lab items from Sanity:", err));
    return () => {
      cancelled = true;
    };
  }, []);
  return items;
};

/** A Lab piece's picture: its looping video if it has one, else the image. */
export const LabMedia = ({ item, fit = "contain" }: { item: LabCover; fit?: "contain" | "cover" }) =>
  item.videoUrl ? (
    <video
      src={item.videoUrl}
      poster={item.posterUrl ?? urlForImage(item.image).width(900).quality(85).url()}
      aria-label={item.alt}
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      className="w-full h-full object-cover"
    />
  ) : (
    <img
      src={urlForImage(item.image).width(1200).quality(85).url()}
      alt={item.alt}
      loading="lazy"
      draggable={false}
      className={`w-full h-full ${fit === "cover" ? "object-cover" : "object-contain"}`}
    />
  );

export const CARD_CLASS = "overflow-hidden rounded-[4px] bg-background border border-white/10";

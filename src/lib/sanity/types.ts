import type { SanityImageSource } from "@sanity/image-url";

export interface SanityStat {
  value: string;
  label: string;
}

export interface SanitySectionBlock {
  label: string;
  body: string;
  stats?: SanityStat[];
  images?: ({ alt: string } & SanityImageSource)[];
  imagesLayout?: "grid" | "grid-3" | "stacked";
  mediaOrder?: "images-first" | "video-first";
  videoUrl?: string;
  videoCaption?: string;
}

export interface SanityAbout {
  photo?: SanityImageSource;
  bio: string;
  services?: string[];
  location?: string;
}

export interface SanityLabItem {
  _id: string;
  image: SanityImageSource;
  alt: string;
  caption?: string;
}

export interface SanityProject {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: "Web" | "Branding" | "Photography" | "Illustration";
  tags: string[];
  cover: SanityImageSource;
  coverVideoUrl?: string;
  coverOverlay?: SanityImageSource;
  hero: SanityImageSource;
  heroBleed?: boolean;
  heroVideoUrl?: string;
  liveUrl?: string;
  timeline?: string;
  role?: string;
  team?: string;
  sections: SanitySectionBlock[];
}

import { useEffect, useState } from "react";
import type { SanityImageSource } from "@sanity/image-url";
import { sanityClient } from "./sanity/client";
import { urlForImage } from "./sanity/image";
import { EMAIL, SERVICES, STRINGS } from "./siteTextsFallback";
import type { Lang } from "./lang";

/**
 * The site's texts from Sanity ("Textos de la web"). Loaded once, shared by
 * every component; until it arrives (or if it fails) the texts written in
 * code are shown, and any empty field in Sanity keeps its code text too.
 */

type Locale = { en?: string; es?: string };
type Service = { name?: Locale; line?: Locale; image?: SanityImageSource & { alt?: Locale }; ratio?: number; url?: string };
export type SiteTexts = Record<string, Locale | undefined> & {
  email?: string;
  services?: Service[];
  ogImageUrl?: string;
};

let texts: SiteTexts | null = null;
const listeners = new Set<() => void>();

const QUERY = /* groq */ `*[_id == "siteTexts"][0]{
  ...,
  "ogImageUrl": ogImage.asset->url,
  services[]{ name, line, image, "ratio": image.asset->metadata.dimensions.aspectRatio }
}`;

let started = false;
export const loadSiteTexts = () => {
  if (started) return;
  started = true;
  sanityClient
    .fetch<SiteTexts | null>(QUERY)
    .then((doc) => {
      if (!doc) return;
      texts = doc;
      listeners.forEach((l) => l());
    })
    .catch((err) => console.error("Failed to load site texts from Sanity:", err));
};

/** Re-renders the component when the Sanity texts arrive. */
export const useSiteTexts = () => {
  const [, bump] = useState(0);
  useEffect(() => {
    loadSiteTexts();
    const l = () => bump((n) => n + 1);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  return texts;
};

export type StringKey = keyof (typeof STRINGS)["en"];

const pick = (v: Locale | undefined, lang: Lang) => (lang === "es" ? v?.es?.trim() || v?.en?.trim() : v?.en?.trim());

/** One text in the visitor's language: Sanity's if it has one, the code's otherwise. */
export const text = (k: StringKey, lang: Lang): string => {
  const v = texts?.[k] as Locale | undefined;
  return (lang === "es" ? v?.es?.trim() : undefined) || (lang === "en" ? v?.en?.trim() : undefined) || STRINGS[lang][k];
};

export const contactEmail = () => texts?.email?.trim() || EMAIL;

/** The services with their pictures, from Sanity when it has them. */
export const services = (lang: Lang) => {
  const fromSanity = texts?.services?.filter((s) => s.name?.en) ?? [];
  if (!fromSanity.length)
    return SERVICES.map((s) => ({ name: s.name[lang], line: s.line[lang], src: s.src, ratio: s.ratio, alt: s.alt[lang] }));
  return fromSanity.map((s, i) => {
    const fb = SERVICES[i];
    return {
      name: pick(s.name, lang) ?? "",
      line: pick(s.line, lang) ?? "",
      src: s.image ? urlForImage(s.image).width(1200).auto("format").quality(85).url() : fb?.src ?? "",
      ratio: s.ratio ?? fb?.ratio ?? 4 / 3,
      alt: pick(s.image?.alt, lang) ?? fb?.alt[lang] ?? "",
    };
  });
};

export const ogImage = () => texts?.ogImageUrl;

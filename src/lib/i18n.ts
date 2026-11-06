import { useEffect, useState } from "react";
import { onLangChange, readLang, type Lang } from "./lang";
import type { SanityProject } from "./sanity/types";
import { text, useSiteTexts, type StringKey } from "./siteTexts";

/** The language the visitor picked (EN / ES), kept in sync across the page. */
export const useLang = (): Lang => {
  const [lang, setLang] = useState<Lang>(readLang);
  useEffect(() => onLangChange(setLang), []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return lang;
};


export type { StringKey };
/** The site's texts in the visitor's language (Sanity first, code as fallback). */
export const useT = () => {
  const lang = useLang();
  useSiteTexts();
  return (k: StringKey) => text(k, lang);
};

type Es = {
  descriptionEs?: string;
  tagsEs?: string[];
  timelineEs?: string;
  roleEs?: string;
  teamEs?: string;
};

/** The project in the visitor's language: Spanish fields where there are any, English otherwise. */
export const localizeProject = (p: SanityProject, lang: Lang): SanityProject => {
  if (lang !== "es") return p;
  const e = p as SanityProject & Es;
  return {
    ...p,
    description: e.descriptionEs || p.description,
    tags: e.tagsEs?.length ? e.tagsEs : p.tags,
    timeline: e.timelineEs || p.timeline,
    role: e.roleEs || p.role,
    team: e.teamEs || p.team,
    sections: (p.sections ?? []).map((s) => {
      const se = s as typeof s & { labelEs?: string; bodyEs?: string; headlineEs?: string };
      return {
        ...s,
        label: se.labelEs || s.label,
        headline: se.headlineEs || s.headline,
        body: se.bodyEs || s.body,
        stats: s.stats?.map((st) => ({ ...st, label: (st as typeof st & { labelEs?: string }).labelEs || st.label })),
        images: s.images?.map((im) => {
          const ie = im as { alt: string; altEs?: string } & Record<string, unknown>;
          return { ...ie, alt: ie.altEs || ie.alt } as typeof im;
        }),
      };
    }),
  };
};

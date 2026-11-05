import { useEffect, useState } from "react";
import { onLangChange, readLang, type Lang } from "./lang";
import type { SanityProject } from "./sanity/types";

/** The language the visitor picked (EN / ES), kept in sync across the page. */
export const useLang = (): Lang => {
  const [lang, setLang] = useState<Lang>(readLang);
  useEffect(() => onLangChange(setLang), []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return lang;
};

// Fixed texts of the site, in both languages
const STRINGS = {
  en: {
    work: "Work",
    contact: "Contact",
    projects: "Projects",
    heroIntro: "I’m Jose, a product and brand designer based in Madrid.",
    heroLine: "I design and build brands and websites\nfor growing businesses.",
    startProject: "Start a project",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    letsTalk: "Let’s talk",
    closeLead: "Have a brand or a website in mind? Let’s make it happen together.",
    closeLine: "I take on a few independent projects a year — brand identities, websites and digital products — and see each one through, from the first idea to the code that ships it.",
    closeMore: "Tell me what you're making and by when. I usually reply within a couple of days, and the first call is always free of commitment.",
    back: "Back",
    seeYourself: "See yourself in dots",
    stopCamera: "Stop camera",
    noCamera: "Camera not available",
    qName: "What’s your name?",
    qEmail: "Where can I reply?",
    qMessage: "What are you working on?",
    pName: "Your name",
    pEmail: "you@company.com",
    pMessage: "A new brand, a website…",
    send: "Send",
    formError: "Add your name, an email I can reply to and a few words.",
    mailSubject: "New project",
    footerBlurb: "Product and brand designer in Madrid. Brands and websites for growing businesses, designed and built end to end.",
    navigate: "Navigate",
    backToTop: "Back to top",
    visitLive: "Visit live site",
    role: "Role",
    team: "Team",
    timeline: "Timeline",
    nextProject: "Next project",
  },
  es: {
    work: "Proyectos",
    contact: "Contacto",
    projects: "Proyectos",
    heroIntro: "Soy Jose, diseñador de producto y de marca en Madrid.",
    heroLine: "Diseño y desarrollo marcas y webs\npara negocios en crecimiento.",
    startProject: "Empezar un proyecto",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
    letsTalk: "Hablemos",
    closeLead: "¿Tienes en mente una marca o una web? Hagámosla realidad juntos.",
    closeLine: "Cada año acepto unos pocos proyectos independientes (identidades de marca, webs y productos digitales) y los acompaño de principio a fin, desde la primera idea hasta el código que los pone en marcha.",
    closeMore: "Cuéntame qué estás haciendo y para cuándo. Suelo responder en un par de días, y la primera llamada nunca compromete a nada.",
    back: "Volver",
    seeYourself: "Mírate en puntos",
    stopCamera: "Parar cámara",
    noCamera: "Cámara no disponible",
    qName: "¿Cómo te llamas?",
    qEmail: "¿Dónde te respondo?",
    qMessage: "¿En qué estás trabajando?",
    pName: "Tu nombre",
    pEmail: "tu@empresa.com",
    pMessage: "Una marca nueva, una web…",
    send: "Enviar",
    formError: "Añade tu nombre, un email al que responderte y unas palabras.",
    mailSubject: "Nuevo proyecto",
    footerBlurb: "Diseñador de producto y de marca en Madrid. Marcas y webs para negocios en crecimiento, diseñadas y desarrolladas de principio a fin.",
    navigate: "Navegar",
    backToTop: "Volver arriba",
    visitLive: "Ver la web",
    role: "Rol",
    team: "Equipo",
    timeline: "Fecha",
    nextProject: "Siguiente proyecto",
  },
} as const;

export type StringKey = keyof (typeof STRINGS)["en"];
export const useT = () => {
  const lang = useLang();
  return (k: StringKey) => STRINGS[lang][k];
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
      const se = s as typeof s & { labelEs?: string; bodyEs?: string };
      return {
        ...s,
        label: se.labelEs || s.label,
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

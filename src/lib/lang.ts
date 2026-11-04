// Language choice, shared by the navbar and the hero card menu. Spanish isn't
// built yet: for now this only remembers the choice and keeps both in sync.
export type Lang = "en" | "es";
const KEY = "pj-lang";
const EVENT = "pj-lang-change";

export const readLang = (): Lang => {
  try {
    return localStorage.getItem(KEY) === "es" ? "es" : "en";
  } catch {
    return "en";
  }
};

export const saveLang = (l: Lang) => {
  try {
    localStorage.setItem(KEY, l);
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new CustomEvent<Lang>(EVENT, { detail: l }));
};

export const onLangChange = (fn: (l: Lang) => void) => {
  const h = (e: Event) => fn((e as CustomEvent<Lang>).detail);
  window.addEventListener(EVENT, h);
  return () => window.removeEventListener(EVENT, h);
};

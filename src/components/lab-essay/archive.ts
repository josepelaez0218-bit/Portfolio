/**
 * Lab archive for the essay prototype — real pieces, each tagged with the
 * languages it speaks and what happens *between* them.
 * NOTE: the "between" lines are first drafts to be rewritten by Jose.
 */
export const LANGUAGES = ["Image", "Sound", "Type", "Code", "Print", "Matter", "Motion"] as const;
export type Language = (typeof LANGUAGES)[number];

export type ArchiveItem = {
  id: string;
  title: string;
  languages: Language[];
  between: string;
  media: { kind: "image"; src: string } | { kind: "video"; src: string } | { kind: "holaAdios" };
  href?: string;
};

const sanity = (id: string) => `https://cdn.sanity.io/images/2u19gait/production/${id}?w=700&auto=format`;

export const ARCHIVE: ArchiveItem[] = [
  {
    id: "jazz",
    title: "Jazz Is About Being In The Moment",
    languages: ["Type", "Motion", "Code"],
    between: "Between a poster and the body.",
    media: { kind: "video", src: "https://cdn.sanity.io/files/2u19gait/production/8049dad4816286f14bfb0dde88b5ea75cd52b2dc.mp4" },
    href: "https://jazz-gyro.netlify.app",
  },
  {
    id: "kooks",
    title: "The Kooks — concert poster",
    languages: ["Type", "Print", "Sound"],
    between: "Between a sound and a wall.",
    media: { kind: "image", src: sanity("b4ad4b5ff00a393c898c933bf110a5b20f6f47af-684x684.png") },
  },
  {
    id: "500",
    title: "500 Años — lettering in stone",
    languages: ["Type", "Matter"],
    between: "Between letters and stone.",
    media: { kind: "image", src: sanity("3c871146a0d2423a8a4d954a83c055921027b06f-684x684.png") },
  },
  {
    id: "hola",
    title: "Hola / Adiós",
    languages: ["Type", "Code", "Motion"],
    between: "Between two words and one border.",
    media: { kind: "holaAdios" },
  },
  {
    id: "eye",
    title: "Halftone eye",
    languages: ["Image", "Print", "Code"],
    between: "Between an eye and a pattern.",
    media: { kind: "image", src: "/hero-trail/05.jpg" },
  },
  {
    id: "portrait-illustration",
    title: "Digital portrait",
    languages: ["Image"],
    between: "Between a face and its colours.",
    media: { kind: "image", src: sanity("a7c39c4582aad61403bfd3f67c17e7eb19983a9f-684x684.png") },
  },
  {
    id: "abismo",
    title: "Yo me abismo — poster",
    languages: ["Type", "Image", "Print"],
    between: "Between a play and its poster.",
    media: { kind: "image", src: sanity("9ca8c11180afe682f8556e19a3d7c18f6a603aac-684x684.png") },
  },
  {
    id: "portrait-photo",
    title: "Portrait",
    languages: ["Image"],
    between: "Between light and a face.",
    media: { kind: "image", src: sanity("3e365b7e72123762f6ad918056a4666f8249c623-684x684.png") },
  },
  {
    id: "black-coffee",
    title: "Black Coffee — packaging",
    languages: ["Type", "Matter", "Print"],
    between: "Between a wordmark and a bag.",
    media: { kind: "image", src: sanity("ed852d62d8bbe8987e26e7a1530873906141dc22-685x684.png") },
  },
];

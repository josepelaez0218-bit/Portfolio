// One-time seed script: pushed the 2 real projects (previously hardcoded in
// src/data/projects.ts, since removed) into Sanity. Safe to re-run — uses
// createOrReplace — but kept mainly as a reference for the document shape.
// Run with: npx sanity exec migrate.ts --with-user-token
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getCliClient } from "sanity/cli";

const client = getCliClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.resolve(__dirname, "../src/assets");

type UploadedAsset = { _id: string };
const assetCache = new Map<string, UploadedAsset>();

async function uploadImage(filename: string): Promise<UploadedAsset> {
  const cached = assetCache.get(filename);
  if (cached) return cached;
  const filePath = path.join(ASSETS_DIR, filename);
  const buffer = readFileSync(filePath);
  console.log(`  Uploading ${filename}...`);
  const asset = await client.assets.upload("image", buffer, { filename });
  assetCache.set(filename, asset);
  return asset;
}

const imageRef = (asset: UploadedAsset) => ({
  _type: "image" as const,
  asset: { _type: "reference" as const, _ref: asset._id },
});

interface SectionInput {
  label: string;
  body: string;
  imageFile?: string;
  imageAlt?: string;
}

interface ProjectInput {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: "Web" | "Branding" | "Photography" | "Illustration";
  tags: string[];
  coverFile: string;
  heroFile: string;
  heroBleed?: boolean;
  timeline: string;
  role: string;
  team: string;
  order: number;
  sections: SectionInput[];
}

const PROJECTS: ProjectInput[] = [
  {
    id: "project-seedtag-emotion-quotient",
    slug: "seedtag-emotion-quotient",
    title: "Emotion Quotient",
    description:
      "A live weekly report ranking the 5 cultural moments the world felt most — built on Seedtag's own content-emotion technology.",
    category: "Web",
    tags: ["Web", "Data-driven"],
    coverFile: "emotion-quotient-cover.png",
    heroFile: "emotion-quotient-hero.png",
    timeline: "Since Aug 2026 — weekly",
    role: "Design & Front-end",
    team: "Solo, reviewed weekly with Seedtag's content team",
    order: 1,
    sections: [
      {
        label: "Context",
        body: "Seedtag runs Liz, an internal content-emotion engine that reads roughly 7.7 million articles across 23 countries to understand what a page is about — and which emotions it triggers — before placing an ad next to it. That signal had never been shown outside the ad product. Emotion Quotient points the same technology outward: a public, recurring report instead of a backend-only tool.",
      },
      {
        label: "Problem",
        body: "Seedtag had a genuinely differentiated capability with no public face. Press, prospects and partners had no way to see what 'emotion-aware' actually meant in practice — and anything built to show it had to earn trust immediately: every number on the page had to be real and checkable, never a guess dressed up as fact.",
      },
      {
        label: "Insights",
        body: "Early drafts just restated the obvious — 'a World Cup match is exciting' isn't a story worth publishing. The report only got interesting once it had hard editorial rules: exclude politics, war, crime and disasters outright to keep it cultural rather than news; require a moment to show up across multiple countries, not just one; and only call something 'unexpected' when the actual emotion data genuinely contradicted the headline, not every week by default.",
      },
      {
        label: "Solution",
        body: "A Next.js 16 site (Tailwind v4, `motion`) where one JSON file is the single source of truth for the entire page — hero copy, gradient, the emotion-pill cluster, and all 5 ranked moment cards. Each card shows real emotion-lift bars against network baseline (e.g. '3.3× more Excitement than usual'), reach and brand-safety stats, and a link to the actual highest-reach source article — never an invented quote.",
      },
      {
        label: "Decisions",
        body: "Nothing publishes automatically. The data pipeline finds candidate moments and pulls their real numbers, but a person reviews the full JSON against a quality checklist and stages it on a preview build before it ever reaches the live site. When a query's results come back unreliable or mixed, the rule is to drop the story entirely rather than publish an uncertain guess — even if it was the week's biggest one.",
      },
      {
        label: "Result",
        body: "Live and shipping weekly since August 2026, now with a growing history archive for week-over-week comparison and optional per-moment deep-dive reports for the stories worth a fuller read. It's become the recurring, public demonstration of what Liz actually sees — the thing Seedtag can point to instead of describing.",
      },
      {
        label: "Reflection",
        body: "The one-JSON-drives-everything decision mattered more than any single visual choice — it's the only reason a new edition can ship every week without the hero, the pills and the cards quietly drifting out of sync with each other. The editorial rules (what to exclude, when 'unexpected' is allowed to fire) turned out to be as much of the design work as any pixel.",
      },
    ],
  },
  {
    id: "project-ceci-makeup",
    slug: "ceci-makeup",
    title: "CECI Makeup",
    description:
      "Logo and naming for a makeup artist launching her own business — built straight from her own name.",
    category: "Branding",
    tags: ["Branding", "Logo & Naming"],
    coverFile: "ceci-makeup-cover.png",
    heroFile: "ceci-makeup-hero.jpg",
    heroBleed: true,
    timeline: "[Timeline TBD]",
    role: "[Role TBD]",
    team: "[Team TBD]",
    order: 2,
    sections: [
      {
        label: "Context",
        body: "Cecilia is a makeup artist starting her own business from zero — no existing brand, no name recognition to build from, just her craft and a client base to open the door to. She had one clear ask going in: her own name, in the logo.",
      },
      {
        label: "Problem",
        body: "Makeup and beauty branding defaults to one visual language almost by reflex: italic serif logotypes, soft script signatures, the same elegant cursive everyone reaches for. It's especially crowded among freelance makeup artists building their own personal brand — nearly every one of them ends up with some variation of the same italic serif. On top of that, a full first name rarely compresses into a mark you'd want to see small, on a business card or an Instagram grid. CECI needed to read as hers and stand apart from that sameness at the same time.",
      },
      {
        label: "Insights",
        body: "The name was already sitting inside her own: 'Cecilia' shortened to 'Ceci' the way anyone who knows her actually says it. That gave the identity its starting point before a single logo sketch — a name people already used, not one invented for the brand. An early direction explored a moodier, jewel-toned mark — the wordmark set into a macro shot of a butterfly wing — before the identity moved toward the lighter, editorial campaign look that became final — [reasoning behind that shift pending].",
        imageFile: "ceci-makeup-exploration-1.jpg",
        imageAlt: "Early CECI logo exploration — the wordmark over a macro shot of a butterfly wing",
      },
      {
        label: "Solution",
        body: "CECI: a lowercase wordmark set inside a circular badge — 'Makeup Artist · Based in Madrid · 1996' — that reads like a stamp rather than a corporate mark. The name itself is the logic: four letters lifted straight from 'Cecilia', doubling as the nickname people already call her.",
      },
      {
        label: "Decisions",
        body: "A clean geometric sans instead of the italic serif the category defaults to — that swap alone does most of the differentiating work, since it's the one detail almost every competing freelance makeup brand shares. Lowercase, not caps, keeps that same restraint personal rather than corporate. The circular badge format borrows from vintage maison marks — a small, self-contained seal rather than a wide logotype — so it holds up as small as a single icon. Getting there meant testing the wordmark against itself: connected-circle letterforms, an oval badge with 'MAKEUP' spelled out, sliced pie-chart lettering, a stacked 'ce/ci' — before the circular seal with the full badge copy running around its edge won out.",
        imageFile: "ceci-makeup-logo-exploration.jpg",
        imageAlt: "CECI logo exploration — eight directions tested before the final circular badge",
      },
      {
        label: "Result",
        body: "Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo — [real result pending].",
      },
      {
        label: "Reflection",
        body: "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores — [real reflection pending].",
      },
    ],
  },
];

async function run() {
  for (const p of PROJECTS) {
    console.log(`Migrating ${p.slug}...`);
    const coverAsset = await uploadImage(p.coverFile);
    const heroAsset = await uploadImage(p.heroFile);

    const sections = [];
    for (const s of p.sections) {
      const section: Record<string, unknown> = {
        _type: "sectionBlock",
        _key: s.label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        label: s.label,
        body: s.body,
      };
      if (s.imageFile) {
        const imgAsset = await uploadImage(s.imageFile);
        section.image = { ...imageRef(imgAsset), alt: s.imageAlt ?? s.label };
      }
      sections.push(section);
    }

    const doc = {
      _id: p.id,
      _type: "project",
      title: p.title,
      slug: { _type: "slug", current: p.slug },
      description: p.description,
      category: p.category,
      tags: p.tags,
      cover: imageRef(coverAsset),
      hero: imageRef(heroAsset),
      heroBleed: p.heroBleed ?? false,
      timeline: p.timeline,
      role: p.role,
      team: p.team,
      order: p.order,
      sections,
    };

    await client.createOrReplace(doc);
    console.log(`  ✔ ${p.slug} done`);
  }
  console.log("Migration complete.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

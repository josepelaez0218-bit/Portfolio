// One-off: rewrites Solution as the real 3-step flow (Analysis -> Annotated
// recommendations -> Generative AI output), attaches 4 real product
// screenshots, and adds a disclaimer that the FedEx/H&M campaign examples
// shown are fictional demo data, not real client work.
// Run with: npx sanity exec patch-mosaic-solution.ts --with-user-token
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getCliClient } from "sanity/cli";

const client = getCliClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const description =
  "A creative-diagnosis tool for Seedtag's neuro-contextual AI — turning dense attention and emotion data into pre-campaign recommendations a creative team can act on. (Campaign examples shown throughout are fictional, built for demonstration only.)";

const solutionBody = [
  "The flow opens with the diagnosis: Liz scores the creative across five lenses — Emotional Impact & Resonance, Attention & Visibility, Format Analysis, Audience Comparison, and a Before & After view that plots all four against a baseline — each broken down into the specific signals behind the number, not just the number itself.",
  "From there, every fix Liz recommends is anchored directly onto the creative it changes — Branding, Composition & Layout, Motion & Editing — tagged in place rather than listed on a separate spec sheet, then grouped into a results view of short, prioritized cards that each state the change and the outcome it's expected to move.",
  "Approved changes are generated as ready variants, previewed per device and handed off with dynamic creative optimization built in — so the same report that diagnosed the ad also ends in something the team can ship.",
  "Note: the campaign examples used to illustrate the flow (FedEx, H&M) are fictional, built to demo the product — not real client deliverables.",
].join("\n\n");

async function run() {
  const files = [
    { file: "mosaic-sol-1.png", key: "img-analysis-overview", alt: "Mosaic analysis overview — Emotional Impact, Format Analysis, Audience Comparison and Before & After cards" },
    { file: "mosaic-sol-2.png", key: "img-before-after", alt: "Mosaic Before & After radar chart comparing creative quality, contextual fit, attention and emotional resonance" },
    { file: "mosaic-sol-3.png", key: "img-annotated-recs", alt: "Mosaic recommendations anchored directly onto the creative — Branding, Composition & Layout, Motion & Editing tags" },
    { file: "mosaic-sol-4.png", key: "img-generated-output", alt: "Mosaic generated creative variant with per-device preview and dynamic creative optimization" },
  ];

  const images = [];
  for (const f of files) {
    const buffer = readFileSync(path.join(__dirname, f.file));
    console.log(`Uploading ${f.file}...`);
    const asset = await client.assets.upload("image", buffer, { filename: f.file });
    images.push({
      _type: "image" as const,
      _key: f.key,
      alt: f.alt,
      asset: { _type: "reference" as const, _ref: asset._id },
    });
  }

  await client
    .patch("project-mosaic")
    .set({
      description,
      "sections[label==\"Solution\"].body": solutionBody,
      "sections[label==\"Solution\"].images": images,
    })
    .commit();
  console.log("✔ Solution rewritten with real product screens + disclaimer.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

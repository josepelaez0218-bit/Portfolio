// One-off: splits the single "Solution" section into three focused steps —
// Analysis, Recommendations, Generative Output — so the sidebar index
// reflects the actual UX/UI flow instead of bundling everything under one
// heading. Reuses the 4 images already uploaded to project-mosaic.
// Run with: npx sanity exec patch-mosaic-split-solution.ts --with-user-token
import { getCliClient } from "sanity/cli";

const client = getCliClient();

async function run() {
  const doc = await client.getDocument("project-mosaic");
  if (!doc) throw new Error("project-mosaic not found");

  const solution = (doc.sections as any[]).find((s) => s.label === "Solution");
  if (!solution) throw new Error("Solution section not found");

  const imagesByKey = Object.fromEntries(
    (solution.images ?? []).map((img: any) => [img._key, img]),
  );

  const newSections = [
    ...(doc.sections as any[]).filter((s) => s.label !== "Solution"),
    {
      _type: "sectionBlock",
      _key: "analysis",
      label: "Analysis",
      body: [
        "The flow opens with the diagnosis: Liz scores the creative across five lenses — Emotional Impact & Resonance, Attention & Visibility, Format Analysis, Audience Comparison, and a Before & After view that plots all four against a baseline — each broken down into the specific signals behind the number, not just the number itself.",
        "Note: the campaign examples used throughout this case study (FedEx, H&M) are fictional, built to demo the product — not real client deliverables.",
      ].join("\n\n"),
      images: [imagesByKey["img-analysis-overview"], imagesByKey["img-before-after"]].filter(Boolean),
    },
    {
      _type: "sectionBlock",
      _key: "recommendations",
      label: "Recommendations",
      body: "From there, every fix Liz recommends is anchored directly onto the creative it changes — Branding, Composition & Layout, Motion & Editing — tagged in place rather than listed on a separate spec sheet, then grouped into a results view of short, prioritized cards that each state the change and the outcome it's expected to move.",
      images: [imagesByKey["img-annotated-recs"]].filter(Boolean),
    },
    {
      _type: "sectionBlock",
      _key: "generative-output",
      label: "Generative Output",
      body: "Approved changes are generated as ready variants, previewed per device and handed off with dynamic creative optimization built in — so the same report that diagnosed the ad also ends in something the team can ship.",
      images: [imagesByKey["img-generated-output"]].filter(Boolean),
    },
  ];

  await client.patch("project-mosaic").set({ sections: newSections }).commit();
  console.log("✔ Solution split into Analysis / Recommendations / Generative Output.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

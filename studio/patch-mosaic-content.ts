// One-off: replaces Mosaic's lorem-ipsum description + sections with real
// copy grounded in the EMEA training deck + Jose's confirmed role
// (designed the Creative Intelligence by Liz interface) and design
// challenge (turning dense neuro-contextual data into actionable output).
// Run with: npx sanity exec patch-mosaic-content.ts --with-user-token
import { getCliClient } from "sanity/cli";

const client = getCliClient();

const description =
  "A creative-diagnosis tool for Seedtag's neuro-contextual AI — turning dense attention and emotion data into pre-campaign recommendations a creative team can act on.";

const sections = [
  {
    _type: "sectionBlock",
    _key: "context",
    label: "Context",
    body: "Seedtag Mosaic is Seedtag's premium creative suite — three tools (Creative Compass, Creative Intelligence, Generative AI) built on Liz, Seedtag's own neuro-contextual AI. Where most creative-scoring tools run an ad through generic eye-tracking benchmarks, Liz reads the emotions, interests and intentions that the content around an ad actually evokes, and turns that into a diagnosis brands can act on before a single euro of media is spent.\n\nI designed the interface for Creative Intelligence by Liz — the module that puts that diagnosis in front of the client.",
  },
  {
    _type: "sectionBlock",
    _key: "problem",
    label: "Problem",
    body: "The diagnosis itself is dense: emotional resonance, attention modelling, format fit and context alignment, each backed by its own scoring layer. Handed over as raw data, none of that changes how a client edits their ad — it just adds another report to read.\n\nThe brief was to turn a neuro-contextual analysis into something a creative team could open, understand and act on in minutes: not a dashboard of scores, but a short set of concrete next steps, each tied to why it matters.",
  },
  {
    _type: "sectionBlock",
    _key: "solution",
    label: "Solution",
    body: "Creative Adjustments: a live preview of the ad sits next to a stack of recommendation cards, grouped by lever — motion & editing, layout, copy. Each card states the fix in plain language and the outcome it's expected to move (\"Increase CTR with client\"), so the reasoning behind every suggestion is visible at a glance, not buried in a score.\n\nBrowsing the cards next to the creative itself — rather than a separate results table — keeps the recommendation tied to exactly what it changes, so a team can act on the report without translating it first.",
  },
];

async function run() {
  await client.patch("project-mosaic").set({ description, sections }).commit();
  console.log("✔ Mosaic content updated.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

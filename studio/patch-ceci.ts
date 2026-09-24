// One-off: trims CECI Makeup down to Context / Problem / Solution, folding
// the old Insights + Decisions text into Solution, with both exploration
// images shown side by side at the end of it.
// Run with: npx sanity exec patch-ceci.ts --with-user-token
import { getCliClient } from "sanity/cli";

const client = getCliClient();

const EXPLORATION_1_REF =
  "image-1ea98641d9d05cd5ac579c4260c39cd0142b9188-1359x1086-jpg";
const LOGO_EXPLORATION_REF =
  "image-e1988b77ca5d8c94682ff0de605b43de5d6ef134-1359x749-jpg";

const solutionBody = [
  "The name was already sitting inside her own: 'Cecilia' shortened to 'Ceci' the way anyone who knows her actually says it. That gave the identity its starting point before a single logo sketch — a name people already used, not one invented for the brand.",
  "CECI: a lowercase wordmark set inside a circular badge — 'Makeup Artist · Based in Madrid · 1996' — that reads like a stamp rather than a corporate mark. The name itself is the logic: four letters lifted straight from 'Cecilia', doubling as the nickname people already call her.",
  "A clean geometric sans instead of the italic serif the category defaults to — that swap alone does most of the differentiating work, since it's the one detail almost every competing freelance makeup brand shares. Lowercase, not caps, keeps that same restraint personal rather than corporate. Getting there meant testing the wordmark against itself: a moodier, jewel-toned direction set into a macro shot of a butterfly wing, then eight more explicit directions — connected-circle letterforms, an oval badge with 'MAKEUP' spelled out, sliced pie-chart lettering, a stacked 'ce/ci' — before the circular seal with the full badge copy running around its edge won out.",
].join("\n\n");

const sections = [
  {
    _type: "sectionBlock",
    _key: "context",
    label: "Context",
    body: "Cecilia is a makeup artist starting her own business from zero — no existing brand, no name recognition to build from, just her craft and a client base to open the door to. She had one clear ask going in: her own name, in the logo.",
  },
  {
    _type: "sectionBlock",
    _key: "problem",
    label: "Problem",
    body: "Makeup and beauty branding defaults to one visual language almost by reflex: italic serif logotypes, soft script signatures, the same elegant cursive everyone reaches for. It's especially crowded among freelance makeup artists building their own personal brand — nearly every one of them ends up with some variation of the same italic serif. On top of that, a full first name rarely compresses into a mark you'd want to see small, on a business card or an Instagram grid. CECI needed to read as hers and stand apart from that sameness at the same time.",
  },
  {
    _type: "sectionBlock",
    _key: "solution",
    label: "Solution",
    body: solutionBody,
    images: [
      {
        _type: "image",
        _key: "img-exploration-1",
        alt: "Early CECI logo exploration — the wordmark over a macro shot of a butterfly wing",
        asset: { _type: "reference", _ref: EXPLORATION_1_REF },
      },
      {
        _type: "image",
        _key: "img-logo-exploration",
        alt: "CECI logo exploration — eight directions tested before the final circular badge",
        asset: { _type: "reference", _ref: LOGO_EXPLORATION_REF },
      },
    ],
  },
];

async function run() {
  await client.patch("project-ceci-makeup").set({ sections }).commit();
  console.log("✔ CECI Makeup trimmed to Context / Problem / Solution.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

// One-off: moves the logo-exploration grid image from Solution to Problem.
// Run with: npx sanity exec patch-ceci-2.ts --with-user-token
import { getCliClient } from "sanity/cli";

const client = getCliClient();

const LOGO_EXPLORATION_REF =
  "image-e1988b77ca5d8c94682ff0de605b43de5d6ef134-1359x749-jpg";

async function run() {
  await client
    .patch("project-ceci-makeup")
    .set({
      "sections[label==\"Problem\"].images": [
        {
          _type: "image",
          _key: "img-logo-exploration",
          alt: "CECI logo exploration — eight directions tested before the final circular badge",
          asset: { _type: "reference", _ref: LOGO_EXPLORATION_REF },
        },
      ],
      "sections[label==\"Solution\"].images": [
        {
          _type: "image",
          _key: "img-exploration-1",
          alt: "Early CECI logo exploration — the wordmark over a macro shot of a butterfly wing",
          asset: {
            _type: "reference",
            _ref: "image-1ea98641d9d05cd5ac579c4260c39cd0142b9188-1359x1086-jpg",
          },
        },
      ],
    })
    .commit();
  console.log("✔ Logo exploration image moved to Problem.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

// One-off: sets Analysis's 2 images to stack vertically instead of a 2-up
// grid, per Jose's feedback that this UX/UI-heavy project reads better with
// full-width screens one after another.
// Run with: npx sanity exec patch-mosaic-stack-images.ts --with-user-token
import { getCliClient } from "sanity/cli";

const client = getCliClient();

async function run() {
  await client
    .patch("project-mosaic")
    .set({ "sections[label==\"Analysis\"].imagesLayout": "stacked" })
    .commit();
  console.log("✔ Analysis images set to stacked layout.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

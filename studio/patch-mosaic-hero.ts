// One-off: sets the real Mosaic hero image (2400x1350, 16:9) and enables
// full-bleed rendering for it.
// Run with: npx sanity exec patch-mosaic-hero.ts --with-user-token
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getCliClient } from "sanity/cli";

const client = getCliClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const filePath = path.join(__dirname, "mosaic-hero.jpg");
  const buffer = readFileSync(filePath);
  console.log("Uploading mosaic-hero.jpg...");
  const asset = await client.assets.upload("image", buffer, {
    filename: "mosaic-hero.jpg",
  });

  await client
    .patch("project-mosaic")
    .set({
      hero: {
        _type: "image" as const,
        asset: { _type: "reference" as const, _ref: asset._id },
      },
      heroBleed: true,
    })
    .commit();
  console.log("✔ Mosaic hero updated + full-bleed enabled.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

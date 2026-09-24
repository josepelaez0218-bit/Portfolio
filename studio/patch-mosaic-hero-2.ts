// One-off: swaps in the higher-resolution Mosaic hero (3600x2025 source)
// so it stays sharp full-bleed on large/retina monitors.
// Run with: npx sanity exec patch-mosaic-hero-2.ts --with-user-token
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getCliClient } from "sanity/cli";

const client = getCliClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const filePath = path.join(__dirname, "mosaic-hero-v2.jpg");
  const buffer = readFileSync(filePath);
  console.log("Uploading mosaic-hero-v2.jpg...");
  const asset = await client.assets.upload("image", buffer, {
    filename: "mosaic-hero-v2.jpg",
  });

  await client
    .patch("project-mosaic")
    .set({
      hero: {
        _type: "image" as const,
        asset: { _type: "reference" as const, _ref: asset._id },
      },
    })
    .commit();
  console.log("✔ Mosaic hero swapped for higher-res version.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

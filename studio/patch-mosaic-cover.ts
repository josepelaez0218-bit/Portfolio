// One-off: swaps the Mosaic cover/hero placeholder for the higher-res image.
// Run with: npx sanity exec patch-mosaic-cover.ts --with-user-token
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getCliClient } from "sanity/cli";

const client = getCliClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const filePath = path.join(__dirname, "mosaic-cover-v2.jpg");
  const buffer = readFileSync(filePath);
  console.log("Uploading mosaic-cover-v2.jpg...");
  const asset = await client.assets.upload("image", buffer, {
    filename: "mosaic-cover-v2.jpg",
  });

  const imageRef = {
    _type: "image" as const,
    asset: { _type: "reference" as const, _ref: asset._id },
  };

  await client
    .patch("project-mosaic")
    .set({ cover: imageRef, hero: imageRef })
    .commit();
  console.log("✔ Mosaic cover/hero updated.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

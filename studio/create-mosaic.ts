// One-off: creates the Mosaic project with a placeholder lorem-ipsum case
// study (Context / Problem / Solution) using the cover image as a temporary
// hero too, until the real hero + narrative are provided.
// Run with: npx sanity exec create-mosaic.ts --with-user-token
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getCliClient } from "sanity/cli";

const client = getCliClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const filePath = path.join(__dirname, "mosaic-cover.jpg");
  const buffer = readFileSync(filePath);
  console.log("Uploading mosaic-cover.jpg...");
  const asset = await client.assets.upload("image", buffer, {
    filename: "mosaic-cover.jpg",
  });

  const imageRef = {
    _type: "image" as const,
    asset: { _type: "reference" as const, _ref: asset._id },
  };

  const doc = {
    _id: "project-mosaic",
    _type: "project",
    title: "Mosaic",
    slug: { _type: "slug", current: "mosaic" },
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit — [one-line positioning pending].",
    category: "Web",
    tags: ["Web", "Product Design"],
    cover: imageRef,
    hero: imageRef,
    heroBleed: false,
    timeline: "[Timeline TBD]",
    role: "[Role TBD]",
    team: "[Team TBD]",
    order: 3,
    sections: [
      {
        _type: "sectionBlock",
        _key: "context",
        label: "Context",
        body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua — [real project context pending].",
      },
      {
        _type: "sectionBlock",
        _key: "problem",
        label: "Problem",
        body: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat — [real problem statement pending].",
      },
      {
        _type: "sectionBlock",
        _key: "solution",
        label: "Solution",
        body: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur — [real solution write-up pending].",
      },
    ],
  };

  await client.createOrReplace(doc);
  console.log("✔ Mosaic created.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

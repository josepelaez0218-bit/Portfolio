// One-off: writes the Spanish version of each project next to the English
// fields (descriptionEs, tagsEs, timelineEs, roleEs, teamEs, and per section
// labelEs / bodyEs / stats[].labelEs / images[].altEs). The site shows them
// when the visitor picks ES, and falls back to English where one is missing.
// Run with: npx sanity exec patch-translations-es.ts --with-user-token
import { readFileSync } from "fs";
import { getCliClient } from "sanity/cli";

const client = getCliClient();
type Section = { labelEs?: string; bodyEs?: string; alts?: Record<string, string>; stats?: Record<string, string> };
type Doc = { descriptionEs?: string; tagsEs?: string[]; timelineEs?: string; roleEs?: string; teamEs?: string; sections?: Record<string, Section> };
const data: Record<string, Doc> = JSON.parse(readFileSync("translations-es.json", "utf8"));

async function run() {
  for (const [id, doc] of Object.entries(data)) {
    const set: Record<string, unknown> = {};
    for (const k of ["descriptionEs", "tagsEs", "timelineEs", "roleEs", "teamEs"] as const) if (doc[k]) set[k] = doc[k];
    for (const [key, s] of Object.entries(doc.sections ?? {})) {
      const base = `sections[_key=="${key}"]`;
      if (s.labelEs) set[`${base}.labelEs`] = s.labelEs;
      if (s.bodyEs) set[`${base}.bodyEs`] = s.bodyEs;
      for (const [ik, alt] of Object.entries(s.alts ?? {})) set[`${base}.images[_key=="${ik}"].altEs`] = alt;
      for (const [sk, label] of Object.entries(s.stats ?? {})) set[`${base}.stats[_key=="${sk}"].labelEs`] = label;
    }
    await client.patch(id).set(set).commit();
    console.log(`✔ ${id}: ${Object.keys(set).length} fields`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

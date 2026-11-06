import { createClient } from "@sanity/client";

// Public dataset, read-only from the site — no token needed. Same project
// as the portfolio Studio (see /studio in this repo).
export const sanityClient = createClient({
  projectId: "2u19gait",
  dataset: "production",
  apiVersion: "2025-01-01",
  // Straight from the live API, not Sanity's CDN: the CDN can keep serving an
  // old copy for a while after a Publish, and Jose edits the texts here
  useCdn: false,
});

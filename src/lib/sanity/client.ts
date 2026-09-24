import { createClient } from "@sanity/client";

// Public dataset, read-only from the site — no token needed. Same project
// created for "Buen Puerto Portfolio" (see /studio in this repo).
export const sanityClient = createClient({
  projectId: "2u19gait",
  dataset: "production",
  apiVersion: "2025-01-01",
  useCdn: true,
});

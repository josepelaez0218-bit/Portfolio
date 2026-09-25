import { sanityClient } from "./client";
import type { SanityAbout, SanityLabItem, SanityProject } from "./types";

const PROJECT_FIELDS = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  description,
  category,
  tags,
  cover,
  "coverVideoUrl": coverVideo.asset->url,
  coverOverlay,
  hero,
  heroBleed,
  "heroVideoUrl": heroVideo.asset->url,
  liveUrl,
  timeline,
  role,
  team,
  sections[]{
    label,
    body,
    stats,
    imagesLayout,
    mediaOrder,
    "images": images[]{..., alt},
    "videoUrl": video.asset->url,
    "videoCaption": video.caption
  }
`;

export const fetchProjects = () =>
  sanityClient.fetch<SanityProject[]>(
    `*[_type == "project" && hidden != true] | order(order asc) { ${PROJECT_FIELDS} }`,
  );

export const fetchProjectBySlug = (slug: string) =>
  sanityClient.fetch<SanityProject | null>(
    `*[_type == "project" && slug.current == $slug][0] { ${PROJECT_FIELDS} }`,
    { slug },
  );

export const fetchAbout = () =>
  sanityClient.fetch<SanityAbout | null>(
    `*[_type == "about"][0] { photo, bio, services, location }`,
  );

export const fetchLabItems = () =>
  sanityClient.fetch<SanityLabItem[]>(
    `*[_type == "labItem"] | order(order asc) { _id, image, alt, caption }`,
  );

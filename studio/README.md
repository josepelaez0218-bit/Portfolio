# Buen Puerto Portfolio — Sanity Studio

Content management for the portfolio's projects (`josepelaez.es`). Editing here updates the live site directly — no code changes, no redeploy needed.

## Editing content

Open **https://buen-puerto-portfolio.sanity.studio/** and log in with the same account used here (Google, josepelaez0218@gmail.com). No local setup required.

## Editing a project

Each **Project** has:

- **Title, slug, description, category, tags** — used in the projects grid.
- **Cover image** — grid thumbnail, designed for a 3:2 crop.
- **Hero image** — big image at the top of the case study.
- **Full-bleed hero** toggle — on: the hero spans edge-to-edge with no frame (used for CECI Makeup); off: the usual framed gray section.
- **Timeline / Role / Team** — shown next to each section.
- **Case study sections** — a free list. Add, remove, reorder, or rename sections per project (e.g. drop "Result"/"Reflection" on a short project instead of forcing all 7). Each section is a label, a body paragraph, and an optional supporting image.
- **Grid order** — lower numbers show first in the homepage grid.

## Local development (optional)

You don't need this to edit content — only if you want to change the schema (add a new field, etc.).

```bash
cd studio
npm install
npm run dev
```

Then open http://localhost:3333.

## Deploying a schema change

```bash
cd studio
npx sanity deploy
```

## Project details

- Project ID: `2u19gait`
- Dataset: `production` (public — the site reads it without a token)
- Separate from the Precopan Sanity project (`ggzesoec`) — different client, different project.

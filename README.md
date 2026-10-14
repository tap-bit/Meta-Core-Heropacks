# Meta Core Heropacks

Static website for **Meta Core**, a Minecraft Bedrock superhero addon. No login, no backend, no build step: it is plain HTML/CSS/JS hosted on GitHub Pages.

## Features
- Auto-scrolling, infinitely looping **Featured Heropacks** carousel in random order (pauses on hover; click a card for details)
- Browse/search all heropacks, with a detail popup for each
- Images, GIFs (stored in the repo), YouTube videos, and external links (Discord, social, CurseForge, MCPEDL)

## Managing posts
All posts live in `data/heropacks.json`. Edit it on GitHub, commit, and the site redeploys automatically. Add **one entry per heropack/creator**; a heropack does not need multiple posts since every heropack is featured randomly in the carousel.

```json
{
  "id": "unique-id",
  "title": "Heropack name",
  "creator": "Creator name",
  "featured": true,
  "description": "About this heropack.",
  "thumbnail": "assets/images/my-pack.png",
  "images": ["assets/images/my-pack.png", "assets/images/demo.gif"],
  "videos": ["https://www.youtube.com/watch?v=VIDEO_ID"],
  "links": [{ "label": "Discord", "url": "https://discord.gg/..." }]
}
```
Upload images/GIFs to `assets/images/` and reference them by path. Set `"featured": false` to leave a post out of the carousel.

## Hosting
In the repo go to **Settings > Pages** and set **Source** to **GitHub Actions** (the included workflow deploys on every push to `main`).

## Local preview
`python3 -m http.server` then open http://localhost:8000

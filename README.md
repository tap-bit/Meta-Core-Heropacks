# Meta Core Heropacks

Website for Meta Core – a Minecraft Bedrock superhero addon. Trusted heropack creators log in (top right) with a private code, then create or edit **one** heropack post (images, videos, GIFs, Discord/social/CurseForge/MCPEDL links). All posts are randomly featured in an auto-scrolling, infinitely looping carousel on the home page.

## Setup
```
npm run install:all
npm run build        # builds the React client into client/dist
npm start            # serves API + site on http://localhost:3001
```
Development: `npm run dev:server` and `npm run dev:client` (Vite proxies `/api` and `/uploads`).

## Managing creators and login codes
Creators are listed in `server/data/creators.json` (`id`, `name`). Generate (or set) a login code, then DM it to the creator:
```
npm run set-code -- <creator-id> [code]
```
Only a salted scrypt hash is stored. Logins are rate-limited (5 failures → 10 minute lockout) and sessions expire after 8 hours.

## Data
Posts are stored in `server/data/posts.json` (JSON, one post per creator) and uploads in `server/uploads/` (PNG/JPG/WEBP/GIF/MP4/WEBM, 25MB max). Both are git-ignored.

## Tests
`npm test`

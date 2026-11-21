# Vice Grid — Cover Maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/receh0910/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/receh0910/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline web app that turns your photos and a caption into multi-panel
poster cover art, exported as a PNG — built for the make.fun
[gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01) bounty
("Make GTA 6 Cover Art").

Pick a panel layout, drop a photo into each panel (or stretch one photo
across them all), drag to position, zoom, choose a colour grade and a
lettering style, and export in the common post sizes. Everything runs in
your browser from static files: your photos are read on your own machine
and never uploaded anywhere.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network: `app/index.html` plus its ES modules, with the
Anton display face vendored under `app/fonts/` (SIL Open Font License,
see `app/fonts/OFL.txt`).

## Features

- **Five panel layouts** — Hero + Duo, Quad Grid, Triptych, Hero + Strip,
  and Full Bleed, all recomputed live for any cover size.
- **Any photo, every panel** — load a different photo per panel, or fill
  the whole grid with one. Drag on the cover to pan, zoom per panel.
  Two sample photos are built in so a cover exists in seconds.
- **Poster lettering** — three styles (Sunset Chrome, Neon Outline,
  Bold Block) set in Anton, with size, letter-spacing, and top/bottom
  band placement. Titles auto-fit the cover width.
- **Colour grades** — Vice Sunset, Neon Night, Golden Hour, and Mono
  Noir, plus vignette and optional film grain.
- **Panel styling** — gutter size, corner radius, border, and backdrop
  colour.
- **One-click export** — PNG at exactly 1920 × 1080, 1080 × 1080, or
  1080 × 1350, rendered offscreen at full resolution.

## How it is put together

- `app/src/layout.js` — panel geometry for the five layouts.
- `app/src/grades.js` — colour grades, vignette, and film grain.
- `app/src/lettering.js` — title fitting and the three lettering styles.
- `app/src/cover.js` — the renderer shared by preview and export.
- `app/src/main.js` — editor state, controls, drag-to-pan, export.
- `app/src/shots.js` — fixed scenes for screenshots (`?shot=cover|editor`).
- `main.ts` — hands the app in: copies `app/` and `screenshots/` to the
  output and writes `dossier.json` with the vendored make.fun library.

All artwork, lettering, and copy in the app are original. No game logos,
artwork, or fonts are used.

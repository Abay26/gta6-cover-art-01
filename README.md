[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Abay26/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Abay26/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Neon Coast Cover Studio

A free, offline web app that turns your own photos and a caption into GTA-style
multi-panel cover art — the iconic poster / loading-screen look with a Vice City
neon-sunset grade — exported as a PNG to share. No upload, no account, no network:
open `app/index.html` in a desktop browser and it just works.

## What it does

- **Multi-panel covers** — four layouts: Hero + 3, Nine Panel (3 × 3 grid),
  Tilted Snaps (three tilted polaroids over a retro striped sun), and Full Bleed.
- **Any photo** — add your own photos from your machine, or use the four bundled
  samples. Click a panel, then a photo, to place it; drag inside a panel to
  reposition the photo and use the zoom slider to crop tighter. Fill all panels
  with one tap, or shuffle the photos across them.
- **Caption lettering** — a bold Anton title (sunset-gradient, solid white, or
  neon outline), a Pacifico neon-script subtitle, and a badge ribbon, all
  editable live. Fonts are vendored under the SIL Open Font License.
- **Colour grades** — Vice Sunset, Neon Night, Palm Teal, Heat Haze, and Noir,
  plus film grain and a vignette for the poster finish.
- **Export in one step** — 1080 × 1080, 1080 × 1350, and 1920 × 1080 PNGs, one
  size at a time or all three at once. Undo / redo included.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

## How it is built

Plain static files under `app/` — `index.html`, `style.css`, and ES modules in
`app/src/` (`main.js` wires the editor, `cover.js` paints the cover on canvas,
`layouts.js` holds the panel geometry, `grades.js` the grades and export sizes).
Everything is original work: no Rockstar Games logo, artwork, or font is used,
and the sample photos are either the kit's free-to-use samples or images made
with an image model. `main.ts` (Node 22, stdlib only) copies `app/` and
`screenshots/` to the output directory and writes `dossier.json` with the
vendored make.fun library.

## License

MIT — see [LICENSE](LICENSE). Fonts under `app/fonts/` are licensed under the
SIL Open Font License 1.1 (see `OFL.txt` and `OFL-pacifico.txt`).

---
Built for the make.fun bounty — try it yourself: https://make.fun/r/qw56w9dq

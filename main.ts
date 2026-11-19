// Neon Coast Cover Studio — the entry program for gta6-cover-art-01 (Node 22, stdlib
// only). It hands the app in: it copies this repository's app/ and screenshots/ to
// /output and writes /output/dossier.json with the vendored make.fun library, so the
// sealed scorer can check the entry and the judge can read it. Outside the grader's
// container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The caps below are the scorer's own (reference/gate.json): text_max_bytes shapes
// the dossier text; the others refuse an entry the scorer would refuse — more than
// 4 screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB of app
// files in all, or a path under app/ over 1000 bytes. app/ counts beside /output's
// own 1000-entry cap, its screenshots/ and dossier.json, so the app stays well
// inside them: a handful of source files, two vendored OFL fonts, four samples.

import { cpSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const appDir = join(here, 'app');
const shotsDir = join(here, 'screenshots');
if (!existsSync(join(appDir, 'index.html'))) {
  throw new Error('app/index.html is missing — the entry has no app to hand in');
}
if (!existsSync(shotsDir) || statSync(shotsDir).isFile()) {
  throw new Error('screenshots/ is missing — the entry has no screenshots to hand in');
}

mkdirSync(out, { recursive: true });
cpSync(appDir, join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

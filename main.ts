// Hand-in contract (Node 22+, standard library only):
//   - The entry is the static game in ./game/ and the real browser renders in ./screenshots/.
//   - MAKEFUN_OUTPUT_DIR (default /output) receives exactly three things: game/, screenshots/
//     and dossier.json. No build step, no network and no other output are needed.
//   - dossier.json must be byte-for-byte what buildDossier from the unchanged kit library
//     writes from those two directories under the scorer's caps, so the grader can reproduce it.
//   - Runs are idempotent and deterministic: rerunning into the same directory overwrites
//     cleanly and produces the same dossier bytes.
// Safe on a read-only materialised repo: copied files inherit mode 0444, so make the
// destination writable BEFORE copying into it, and make fresh copies writable AFTER copying.
import { chmodSync, cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Recursively grant write permission to an output tree. Also called before a copy:
// an existing 0444 destination file would otherwise make cpSync fail with EACCES.
function makeWritable(dir) {
  try { chmodSync(dir, 0o755); }
  catch (err) { if (err.code !== 'ENOENT') throw err; }
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) makeWritable(p);
    else chmodSync(p, 0o644);
  }
}

function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  makeWritable(to);
  cpSync(from, to, { recursive: true, force: true });
  makeWritable(to);
}

mkdirSync(out, { recursive: true });
makeWritable(out);
copyTree(join(here, 'game'), join(out, 'game'));
mkdirSync(join(out, 'screenshots'), { recursive: true });
makeWritable(join(out, 'screenshots'));
if (existsSync(join(here, 'screenshots'))) copyTree(join(here, 'screenshots'), join(out, 'screenshots'));

// The scorer's caps: only text_max_bytes shapes the bytes; the others refuse an entry
// the scorer would refuse. Leave room under /output's own 1000-entry and 64 MiB caps.
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
const dossierPath = join(out, 'dossier.json');
if (existsSync(dossierPath)) chmodSync(dossierPath, 0o644);
writeFileSync(dossierPath, dossier);
console.log(`EMBERWEAVE handed in: ${dossier.length} dossier bytes to ${out}`);

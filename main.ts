// Hand-in program: copy the static game and its screenshots to /output, then write the
// dossier with the kit's unchanged vendored library. Safe on a read-only materialised repo:
// copied files inherit mode 0444, so chmod the destination before any overwrite.
import { chmodSync, cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true, force: true });
  // Make every copied file writable so a later write (or a second run) cannot hit EACCES.
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      chmodSync(p, entry.isDirectory() ? 0o755 : 0o644);
      if (entry.isDirectory()) walk(p);
    }
  };
  walk(to);
}

mkdirSync(out, { recursive: true });
chmodSync(out, 0o755);
copyTree(join(here, 'game'), join(out, 'game'));
mkdirSync(join(out, 'screenshots'), { recursive: true });
chmodSync(join(out, 'screenshots'), 0o755);
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

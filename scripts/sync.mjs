#!/usr/bin/env node
// Pull every HackMD note in scripts/sources.json and import NEW writeups as hidden
// drafts marked `pending: true`. Published posts are never changed. Drafts still
// marked `autosync: true` are refreshed when their HackMD section changes.
//
//   npm run sync            import new/changed writeups as drafts
//   npm run sync -- --dry   show what would be imported
//
// Pending drafts are then reviewed (summary, difficulty, remediation, captions)
// and published by hand or by the scheduled Claude task; see README.

import { readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { ROOT } from './lib/hackmd.mjs';

const dry = process.argv.includes('--dry');
const { notes, aliases = {} } = JSON.parse(readFileSync(path.join(ROOT, 'scripts', 'sources.json'), 'utf8'));
const log = path.join(os.tmpdir(), `sync-imported-${process.pid}.txt`);
rmSync(log, { force: true });

let failed = 0;
for (const n of notes) {
  const args = [path.join(ROOT, 'scripts', 'import-collection.mjs'), n.url, '--section', n.section, '--level', String(n.level), '--draft'];
  if (n.season) args.push('--season', String(n.season));
  if (n.difficulty) args.push('--difficulty', n.difficulty);
  if (dry) args.push('--dry');
  console.log(`\n# ${n.name}`);
  try {
    const out = execFileSync(process.execPath, args, {
      env: { ...process.env, IMPORTED: log, SLUG_ALIASES: JSON.stringify(aliases) },
      encoding: 'utf8',
    });
    // keep the log short: only show lines that changed something
    const changed = out.split('\n').filter((l) => /^(✓|↻|would write|  !)/.test(l));
    console.log(changed.length ? changed.join('\n') : '  (nothing new)');
  } catch (err) {
    failed++;
    console.error(`  ✗ ${n.name}: ${(err.stderr || err.message).toString().trim()}`);
  }
}

const imported = existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n').filter(Boolean) : [];
rmSync(log, { force: true });
const summary = dry
  ? 'Dry run: nothing was written (see "would write" lines above).'
  : imported.length
    ? `Imported ${imported.length} writeup(s) as drafts:\n${imported.map((p) => `- ${p}`).join('\n')}`
    : 'No new or changed writeups.';
console.log(`\n${summary}${failed ? `\n${failed} note(s) failed to download.` : ''}`);
if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, `### HackMD sync\n\n${summary}\n`, { flag: 'a' });
if (failed === notes.length) process.exit(1); // every note failed: surface it

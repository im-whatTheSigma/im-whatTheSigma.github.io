#!/usr/bin/env node
// Apply a review batch to pending drafts: set metadata, append a remediation /
// detection section, and publish or keep as draft.
//
//   node scripts/review/apply-review.mjs scripts/review/enrich-<date>.json
//
// Each key is a post id ("machines/principal"); values:
//   publish      true  -> remove draft/pending/autosync/sourceHash (goes live)
//                false -> keep draft + autosync, clear pending (waits for the author)
//   os, date, difficulty, summary, tags   front-matter fields to set
//   remediation  markdown appended to the end of the post (skipped if a section exists)
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { OUT } from '../lib/hackmd.mjs';

const batch = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const q = (v) => JSON.stringify(v);

for (const [id, r] of Object.entries(batch)) {
  const file = path.join(OUT, id, 'index.md');
  const text = readFileSync(file, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) throw new Error(`${id}: no front matter`);
  let fm = m[1].split('\n');
  let body = text.slice(m[0].length);

  const set = (key, value) => {
    const line = `${key}: ${key === 'date' ? value : q(value)}`;
    const i = fm.findIndex((l) => l.startsWith(`${key}:`));
    if (i >= 0) fm[i] = line;
    else {
      // keep the usual order: put new fields before tags
      const t = fm.findIndex((l) => l.startsWith('tags:'));
      fm.splice(t >= 0 ? t : fm.length, 0, line);
    }
  };
  for (const k of ['os', 'difficulty', 'date', 'summary', 'tags']) if (r[k] !== undefined) set(k, r[k]);

  const drop = (key) => (fm = fm.filter((l) => !l.startsWith(`${key}:`)));
  drop('pending');
  if (r.publish) ['draft', 'autosync', 'sourceHash'].forEach(drop);

  if (r.remediation && !/^## (Remediation|Detection & mitigation|Sources)$/m.test(body)) {
    body = body.trimEnd() + '\n\n' + r.remediation.trim() + '\n';
  }
  writeFileSync(file, `---\n${fm.join('\n')}\n---\n\n${body.replace(/^\n+/, '')}`);
  console.log(`${r.publish ? 'published' : 'kept draft'}  ${id}`);
}

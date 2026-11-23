#!/usr/bin/env node
// Insert a muted caption directly under screenshots.
//
//   node scripts/review/add-captions.mjs captions.json
//
// captions.json maps "<post-id>/<img-file>" to the caption text, e.g.
//   { "machines/principal/img-03.png": "The bundle leaks the JWT/JWE scheme …" }
// Captions become <span class="caption">…</span> on the line after the image,
// indented to stay inside the same list item. Already-captioned images are skipped.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { OUT } from '../lib/hackmd.mjs';

const caps = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const byPost = {};
for (const [key, text] of Object.entries(caps)) {
  const slash = key.lastIndexOf('/');
  (byPost[key.slice(0, slash)] ??= []).push([key.slice(slash + 1), text]);
}

let added = 0;
for (const [post, list] of Object.entries(byPost)) {
  const file = path.join(OUT, post, 'index.md');
  const L = readFileSync(file, 'utf8').split('\n');
  for (const [img, text] of list) {
    const i = L.findIndex((l) => l.includes(`](./${img})`));
    if (i < 0) throw new Error(`${post}: ${img} not found`);
    if ((L[i + 1] ?? '').includes('class="caption"')) continue;
    const m = L[i].match(/^(\s*)([-*+]\s+|\d+[.)]\s+)?/);
    const indent = m[1] + ' '.repeat(m[2] ? m[2].length : 0);
    L.splice(i + 1, 0, `${indent}<span class="caption">${text}</span>`);
    added++;
  }
  writeFileSync(file, L.join('\n'));
}
console.log(`added ${added} caption(s)`);

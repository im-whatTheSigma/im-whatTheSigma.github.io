#!/usr/bin/env node
// List screenshots with little or no explanation around them (no caption yet,
// and nothing but a heading, another screenshot or a few words before them).
//
//   node scripts/review/weak-images.mjs machines/principal
//   node scripts/review/weak-images.mjs sherlocks          (whole section)
//
// Prints "<post-id>/<img-file> | <question or nearest heading>" per screenshot.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { OUT } from '../lib/hackmd.mjs';

const prefix = process.argv[2] ?? '';
const IMG = /!\[[^\]]*\]\(\.\/(img-\d+\.\w+)\)/;
const words = (s) => s.replace(IMG, '').replace(/[`*_>#-]/g, ' ').trim().split(/\s+/).filter(Boolean).length;

const walk = (d) =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(d, e.name)) : e.name === 'index.md' ? [path.join(d, e.name)] : [],
  );

const base = path.join(OUT, prefix);
if (!existsSync(base)) throw new Error(`no such section or post: ${prefix}`);
let total = 0;
for (const f of walk(base)) {
  const id = path.relative(OUT, path.dirname(f)).replace(/\\/g, '/');
  const L = readFileSync(f, 'utf8').split(/\r?\n/);
  let heading = '';
  L.forEach((l, i) => {
    if (/^#{1,6}\s/.test(l)) heading = l.replace(/^#+\s*/, '');
    const m = l.match(IMG);
    if (!m) return;
    if ((L[i + 1] ?? '').includes('class="caption"')) return; // already captioned
    let j = i - 1;
    while (j >= 0 && !L[j].trim()) j--;
    const prev = j >= 0 ? L[j] : '';
    const weak = words(l) < 4 && (/^#{1,6}\s/.test(prev) || (IMG.test(prev) && words(prev) < 4) || words(prev) < 6);
    if (weak) {
      total++;
      console.log(`${id}/${m[1]} | ${heading.slice(0, 80)}`);
    }
  });
}
console.error(`${total} weakly explained screenshot(s)`);

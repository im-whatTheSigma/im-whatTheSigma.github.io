#!/usr/bin/env node
// Import ONE HackMD note (or a local .md export) as ONE writeup.
// For a note that holds many writeups, use import-collection.mjs instead.
//
//   npm run import -- https://hackmd.io/@you/some-note --section machines
//   npm run import -- https://hackmd.io/AbCdEf123 --section challenges/web --difficulty Easy
//   npm run import -- ./exported-note.md --section sherlocks --slug reaper --date 2026-03-01
//
// The note must be readable without logging in (Share → Read: Everyone, or published).
// Private note? Use HackMD's Menu → Download → Markdown and pass the file path instead.

import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import {
  ROOT, OUT, parseArgs, load, splitFrontMatter, convert, localiseImages, slugify, frontMatter,
} from './lib/hackmd.mjs';

const { flags, positional } = parseArgs(process.argv.slice(2));
const source = positional[0];
if (!source) {
  console.error('usage: npm run import -- <hackmd-url | file.md> [--section machines|sherlocks|challenges/<cat>]');
  console.error('         [--slug s] [--title t] [--date YYYY-MM-DD] [--platform HTB] [--season 12]');
  console.error('         [--os Linux] [--difficulty Easy] [--summary "..."] [--draft true] [--force]');
  process.exit(1);
}

try {
  const { meta, raw } = splitFrontMatter(await load(source));
  let { title, tags, body } = convert(raw);
  title = flags.title ?? (title || meta.title);
  if (!title) throw new Error('no "# Title" heading found; pass --title "Box name"');
  if (meta.tags) tags.push(...meta.tags.split(',').map((s) => s.trim()).filter(Boolean));
  tags = [...new Set(tags)];

  const slug = flags.slug ?? slugify(title);
  const dir = path.join(OUT, ...(flags.section ?? 'machines').split('/'), slug);
  const file = path.join(dir, 'index.md');
  const exists = await access(file).then(() => true, () => false);
  if (exists && !flags.force) throw new Error(`${path.relative(ROOT, file)} already exists (use --force to overwrite)`);

  await mkdir(dir, { recursive: true });
  const images = await localiseImages(body, dir);

  const front = frontMatter([
    ['title', title],
    ['date', flags.date],
    ['platform', flags.platform],
    ['season', flags.season && Number(flags.season)],
    ['os', flags.os],
    ['difficulty', flags.difficulty],
    ['tags', tags],
    ['summary', flags.summary],
    ['draft', flags.draft === 'true'],
  ]);

  await writeFile(file, front + images.body);
  console.log(`✓ ${path.relative(ROOT, file)}  (${images.count} image${images.count === 1 ? '' : 's'})`);
} catch (err) {
  console.error(`✗ ${err.message}`);
  process.exit(1);
}

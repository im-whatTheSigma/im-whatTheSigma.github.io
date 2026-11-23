#!/usr/bin/env node
// Split ONE HackMD note that holds MANY writeups into one post per writeup.
//
//   npm run import:collection -- <hackmd-url | file.md> --section machines --level 1 --season 12
//   npm run import:collection -- <url> --section challenges/web --level 4
//
// --level   heading depth at which each writeup starts (1 for "# Box", 3 for "### Box" …)
// --section where the posts go: machines, sherlocks, challenges/<category>
//
// Headings above that level named Very Easy / Easy / Medium / Hard / Insane set the difficulty.
// A title like "Touch (some remark)" becomes the title "Touch"; the remark is kept as the
// first line of the post. Writeups that already exist are SKIPPED, so it is safe to re-run
// after adding a new box to the HackMD note: only the new one is imported.
//
// --draft        import new writeups hidden, marked `pending: true` (needs review) and
//                `autosync: true` (refresh from HackMD while still a draft)
// --difficulty   default difficulty when the note has no difficulty headings
// IMPORTED=<file> env var: append the paths of imported posts to that file (used by sync)

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import {
  ROOT, OUT, parseArgs, load, splitFrontMatter, convert, localiseImages, slugify, frontMatter, fenceOf,
} from './lib/hackmd.mjs';

const { flags, positional } = parseArgs(process.argv.slice(2), ['force', 'dry', 'draft']);
const imported = [];
const source = positional[0];
const level = Number(flags.level);
if (!source || !flags.section || !level) {
  console.error('usage: npm run import:collection -- <hackmd-url | file.md> --section <dir> --level <n>');
  console.error('         [--platform HTB] [--season 12] [--difficulty Medium] [--only "Box name"]');
  console.error('         [--draft] [--dry] [--force]');
  process.exit(1);
}

const DIFFICULTY = /^(very easy|easy|medium|hard|insane)$/i;

/** Cut the note into { title, remark, difficulty, lines } at headings of the given level. */
function split(md) {
  const posts = [];
  const preamble = [];
  let cur = null;
  let difficulty;
  let fence = null;

  for (const line of md.replace(/\r\n/g, '\n').split('\n')) {
    const f = fenceOf(line);
    if (f) {
      if (!fence) fence = f.run;
      else if (f.run.startsWith(fence) && f.info.trim() === '') fence = null;
    }
    const h = !fence && !f && line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (h && h[1].length < level) {
      if (DIFFICULTY.test(h[2].trim())) difficulty = h[2].trim().replace(/\b\w/g, (c) => c.toUpperCase());
      cur = null;
      continue;
    }
    if (h && h[1].length === level) {
      let title = h[2].trim();
      let remark = '';
      const p = title.match(/^(.*?)\s*[(（](.+)[)）]?\s*$/);
      if (p && p[1]) {
        title = p[1].trim();
        remark = p[2].replace(/[)）]\s*$/, '').trim();
      }
      cur = { title, remark, difficulty, lines: [] };
      posts.push(cur);
      continue;
    }
    (cur ? cur.lines : preamble).push(line);
  }
  return { posts, preamble: preamble.join('\n').trim() };
}

/** Shift headings so the shallowest one in the post becomes "##". */
function normaliseHeadings(body) {
  const lines = body.split('\n');
  let fence = null;
  const heads = [];
  lines.forEach((line, i) => {
    const f = fenceOf(line);
    if (f) {
      if (!fence) fence = f.run;
      else if (f.run.startsWith(fence) && f.info.trim() === '') fence = null;
      return;
    }
    if (!fence && /^#{1,6}\s/.test(line)) heads.push(i);
  });
  if (!heads.length) return body;
  const min = Math.min(...heads.map((i) => lines[i].match(/^#+/)[0].length));
  for (const i of heads) {
    const depth = lines[i].match(/^#+/)[0].length;
    lines[i] = '#'.repeat(Math.min(6, depth - min + 2)) + lines[i].slice(depth);
  }
  return lines.join('\n');
}

try {
  const { raw } = splitFrontMatter(await load(source));
  const { posts, preamble } = split(raw);
  if (!posts.length) throw new Error(`no level-${level} headings found in ${source}`);
  if (preamble) console.warn(`  ! text before the first writeup was not imported:\n    ${preamble.slice(0, 200)}`);

  let order = 0;
  for (const post of posts) {
    order++;
    if (flags.only && post.title.toLowerCase() !== flags.only.toLowerCase()) continue;

    // SLUG_ALIASES maps "section/imported-slug" to "section/existing-slug" for posts
    // that were renamed by hand after the first import (so they aren't re-imported)
    const aliases = JSON.parse(process.env.SLUG_ALIASES || '{}');
    const target = aliases[`${flags.section}/${slugify(post.title)}`] ?? `${flags.section}/${slugify(post.title)}`;
    const dir = path.join(OUT, ...target.split('/'));
    const file = path.join(dir, 'index.md');
    const rel = path.relative(ROOT, file);
    const raw = post.lines.join('\n');
    const hash = createHash('sha256').update(post.title + '\n' + raw).digest('hex').slice(0, 16);

    const existing = await readFile(file, 'utf8').catch(() => null);
    if (existing !== null && !flags.force) {
      // Published posts are never touched (they carry hand-made enrichment).
      // Posts still marked `autosync: true` (drafts waiting on the author) are
      // refreshed when their HackMD section changes.
      const fm = existing.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
      const autosync = /^autosync:\s*true\s*$/m.test(fm);
      const oldHash = fm.match(/^sourceHash:\s*"?([0-9a-f]+)"?\s*$/m)?.[1];
      if (!autosync) {
        console.log(`- ${rel} exists, skipped`);
        continue;
      }
      if (oldHash === hash) {
        console.log(`- ${rel} draft unchanged in HackMD, skipped`);
        continue;
      }
      console.log(`↻ ${rel} changed in HackMD, re-importing`);
    }
    if (flags.dry) {
      console.log(`would write ${rel}  [${post.difficulty ?? flags.difficulty ?? 'no difficulty'}]`);
      continue;
    }

    let { body, tags } = convert(raw, { extractTitle: false });
    body = normaliseHeadings(body);
    if (post.remark) body = `*(${post.remark})*\n\n` + body;

    await mkdir(dir, { recursive: true });
    const images = await localiseImages(body, dir);
    const front = frontMatter([
      ['title', post.title],
      ['platform', flags.platform ?? 'HTB'],
      ['season', flags.season && Number(flags.season)],
      ['difficulty', post.difficulty ?? flags.difficulty],
      ['tags', tags],
      ['order', order],
      // --draft: arrive hidden and flagged for review (see scripts/sync.mjs)
      ['draft', !!flags.draft],
      ['pending', !!flags.draft],
      ['autosync', !!flags.draft],
      ['sourceHash', flags.draft ? hash : undefined],
    ]);
    await writeFile(file, front + images.body);
    console.log(`✓ ${rel}  (${images.count} image${images.count === 1 ? '' : 's'}${flags.draft ? ', draft' : ''})`);
    imported.push(rel.replace(/\\/g, '/'));
  }
  if (process.env.IMPORTED && imported.length) {
    const { appendFile } = await import('node:fs/promises');
    await appendFile(process.env.IMPORTED, imported.join('\n') + '\n');
  }
} catch (err) {
  console.error(`✗ ${err.message}`);
  process.exit(1);
}

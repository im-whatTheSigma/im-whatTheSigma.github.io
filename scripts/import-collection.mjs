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

import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import {
  ROOT, OUT, parseArgs, load, splitFrontMatter, convert, localiseImages, slugify, frontMatter, fenceOf,
} from './lib/hackmd.mjs';

const { flags, positional } = parseArgs(process.argv.slice(2), ['force', 'dry']);
const source = positional[0];
const level = Number(flags.level);
if (!source || !flags.section || !level) {
  console.error('usage: npm run import:collection -- <hackmd-url | file.md> --section <dir> --level <n>');
  console.error('         [--platform HTB] [--season 12] [--only "Box name"] [--dry] [--force]');
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

    const slug = slugify(post.title);
    const dir = path.join(OUT, ...flags.section.split('/'), slug);
    const file = path.join(dir, 'index.md');
    const rel = path.relative(ROOT, file);
    const exists = await access(file).then(() => true, () => false);
    if (exists && !flags.force) {
      console.log(`- ${rel} exists, skipped`);
      continue;
    }
    if (flags.dry) {
      console.log(`would write ${rel}  [${post.difficulty ?? 'no difficulty'}]`);
      continue;
    }

    let { body, tags } = convert(post.lines.join('\n'), { extractTitle: false });
    body = normaliseHeadings(body);
    if (post.remark) body = `*(${post.remark})*\n\n` + body;

    await mkdir(dir, { recursive: true });
    const images = await localiseImages(body, dir);
    const front = frontMatter([
      ['title', post.title],
      ['platform', flags.platform ?? 'HTB'],
      ['season', flags.season && Number(flags.season)],
      ['difficulty', post.difficulty],
      ['tags', tags],
      ['order', order],
    ]);
    await writeFile(file, front + images.body);
    console.log(`✓ ${rel}  (${images.count} image${images.count === 1 ? '' : 's'})`);
  }
} catch (err) {
  console.error(`✗ ${err.message}`);
  process.exit(1);
}

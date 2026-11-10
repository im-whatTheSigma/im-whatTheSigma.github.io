// Shared helpers for the HackMD import scripts.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const OUT = path.join(ROOT, 'src', 'content', 'writeups');

export const yaml = (v) => JSON.stringify(v); // JSON strings are valid YAML scalars

export const slugify = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');

export function parseArgs(argv, booleans = ['force']) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      if (booleans.includes(k)) flags[k] = true;
      else flags[k] = argv[++i];
    } else positional.push(a);
  }
  return { flags, positional };
}

/** Read a local .md file, or download a HackMD note that is readable by everyone. */
export async function load(src) {
  if (!/^https?:\/\//.test(src)) return readFile(path.resolve(src), 'utf8');
  const url = new URL(src);
  url.search = '';
  url.hash = '';
  url.pathname = url.pathname.replace(/\/(edit|download|both|view)?\/?$/, '') + '/download';
  const res = await fetch(url, { headers: { 'user-agent': 'hackmd-import' } });
  const type = res.headers.get('content-type') ?? '';
  if (!res.ok || type.includes('text/html')) {
    throw new Error(
      `could not download ${url} (HTTP ${res.status}).\n` +
        'The note is probably private. Set Share → Read to "Everyone", or download the\n' +
        'markdown from HackMD and pass the file path to this script instead.',
    );
  }
  return res.text();
}

/** Strip a leading YAML front matter block; returns its simple key: value pairs. */
export function splitFrontMatter(raw) {
  const meta = {};
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!fm) return { meta, raw };
  for (const l of fm[1].split(/\r?\n/)) {
    const m = l.match(/^(\w+):\s*(.+)$/);
    if (m) meta[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  return { meta, raw: raw.slice(fm[0].length) };
}

/** Is this line a code fence? Returns the fence run (``` or ~~~) and the info string. */
export function fenceOf(line) {
  const f = line.match(/^\s*(`{3,}|~{3,})(.*)$/);
  return f ? { run: f[1], info: f[2] } : null;
}

/**
 * Convert HackMD-only syntax to plain markdown + HTML, leaving fenced code untouched.
 * With extractTitle, the first "# heading" is removed and returned as the title.
 */
export function convert(md, { extractTitle = true } = {}) {
  const out = [];
  const tags = [];
  let title = '';
  let fence = null;
  const open = []; // closing strings for ::: containers

  for (let line of md.replace(/\r\n/g, '\n').split('\n')) {
    const f = fenceOf(line);
    if (f) {
      if (!fence) {
        fence = f.run;
        // ```bash=  ```python=12  ```js!  → plain language name
        line = line.replace(/^(\s*(?:`{3,}|~{3,})\s*[\w+#-]*)[=!]\S*/, '$1');
      } else if (f.run.startsWith(fence) && f.info.trim() === '') {
        fence = null;
      }
      out.push(line);
      continue;
    }
    if (fence) {
      out.push(line);
      continue;
    }

    if (extractTitle && !title) {
      const h = line.match(/^#\s+(.+?)\s*#*$/);
      if (h) {
        title = h[1].trim();
        continue;
      }
    }
    const t = line.match(/^#{1,6}\s*tags:\s*(.+)$/i);
    if (t) {
      tags.push(...[...t[1].matchAll(/`([^`]+)`/g)].map((m) => m[1].trim()));
      continue;
    }
    if (/^\s*\[toc\]\s*$/i.test(line)) continue;

    const c = line.match(/^:::\s*(\w+)\s*(.*)$/);
    if (c) {
      const kind = c[1].toLowerCase();
      if (kind === 'spoiler') {
        out.push('<details>', `<summary>${c[2].trim() || 'Spoiler'}</summary>`, '');
        open.push('</details>');
      } else {
        out.push(`<aside class="note note-${kind}" data-kind="${kind}">`, '');
        open.push('</aside>');
      }
      continue;
    }
    if (/^:::\s*$/.test(line) && open.length) {
      out.push('', open.pop(), '');
      continue;
    }

    // ==highlight== → <mark> (outside `inline code` only, so `a==b` survives),
    // and drop HackMD's image size hint: ![](url =300x)
    line = line
      .split(/(`+[^`]*`+)/)
      .map((part, i) => (i % 2 ? part : part.replace(/(^|[^=])==([^=\s][^=\n]*?[^=\s]|[^=\s])==(?!=)/g, '$1<mark>$2</mark>')))
      .join('');
    line = line.replace(/(!\[[^\]]*\]\([^)\s]+)\s+=\d*x\d*\)/g, '$1)');
    out.push(line);
  }
  while (open.length) out.push('', open.pop());
  return { title, tags, body: out.join('\n').trim() + '\n' };
}

/** Download remote images next to the post and point the markdown at the local copies. */
export async function localiseImages(body, dir) {
  const urls = new Set();
  for (const m of body.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)/g)) urls.add(m[1]);
  for (const m of body.matchAll(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/g)) urls.add(m[1]);

  const list = [...urls];
  const names = new Array(list.length).fill(null);
  let next = 0;
  async function worker() {
    while (next < list.length) {
      const i = next++;
      const url = list[i];
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const type = res.headers.get('content-type') ?? '';
        if (!type.startsWith('image/')) throw new Error(`not an image (${type})`);
        const ext =
          (path.extname(new URL(url).pathname).match(/^\.(png|jpe?g|gif|webp|avif|svg)$/i) ?? [])[0] ??
          '.' + type.split('/')[1].split(/[;+]/)[0];
        const name = `img-${String(i + 1).padStart(2, '0')}${ext.toLowerCase()}`;
        await writeFile(path.join(dir, name), Buffer.from(await res.arrayBuffer()));
        names[i] = name;
      } catch (err) {
        console.warn(`  ! kept remote image ${url} (${err.message})`);
      }
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));

  let count = 0;
  list.forEach((url, i) => {
    if (!names[i]) return;
    body = body.split(url).join(`./${names[i]}`);
    count++;
  });
  return { body, count };
}

/** Build a front matter block from [key, value] pairs, skipping empty values. */
export function frontMatter(pairs) {
  const lines = ['---'];
  for (const [k, v] of pairs) {
    if (v === undefined || v === null || v === '' || v === false) continue;
    if (k === 'date' || typeof v === 'number' || typeof v === 'boolean') lines.push(`${k}: ${v}`);
    else lines.push(`${k}: ${yaml(v)}`);
  }
  lines.push('---', '');
  return lines.join('\n') + '\n';
}

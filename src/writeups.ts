import { getCollection, type CollectionEntry } from 'astro:content';

export type Writeup = CollectionEntry<'writeups'>;

export const SECTIONS = [
  { id: 'machines', title: 'Machines', blurb: 'Full boxes, user to root.' },
  { id: 'sherlocks', title: 'Sherlocks', blurb: 'Blue-team investigations, question by question.' },
  { id: 'challenges', title: 'Challenges', blurb: 'Single-flag CTF challenges by category.' },
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

const CATEGORY_NAMES: Record<string, string> = {
  pwn: 'Pwn',
  crypto: 'Crypto',
  reverse: 'Reverse',
  web: 'Web',
  forensics: 'Forensics',
  coding: 'Coding',
  osint: 'OSINT',
  misc: 'Misc',
};
const CATEGORY_ORDER = Object.keys(CATEGORY_NAMES);

export const sectionOf = (e: Writeup) => e.id.split('/')[0] as SectionId;

/** challenges/pwn/foo → "pwn"; undefined for machines and sherlocks */
export const categoryOf = (e: Writeup) => (sectionOf(e) === 'challenges' ? e.id.split('/')[1] : undefined);

export const categoryName = (c: string) => CATEGORY_NAMES[c] ?? c.charAt(0).toUpperCase() + c.slice(1);

/** The small label line above a title: HTB, Season 12, Linux, Medium */
export function labels(e: Writeup): string[] {
  const { platform, season, os, difficulty } = e.data;
  const section = sectionOf(e);
  const cat = categoryOf(e);
  return [
    platform,
    section === 'sherlocks' ? 'Sherlock' : undefined,
    cat ? categoryName(cat) : undefined,
    season ? `Season ${season}` : undefined,
    os,
    difficulty,
  ].filter((x): x is string => Boolean(x));
}

const DIFF = ['very easy', 'easy', 'medium', 'hard', 'insane'];
const diffRank = (e: Writeup) => {
  const i = DIFF.indexOf((e.data.difficulty ?? '').toLowerCase());
  return i < 0 ? 99 : i;
};

function compare(a: Writeup, b: Writeup) {
  // dated posts first, newest on top
  const da = a.data.date?.valueOf() ?? 0;
  const db = b.data.date?.valueOf() ?? 0;
  if (da !== db) return db - da;
  // then newest season, then the order they had in the notes
  const sa = a.data.season ?? 0;
  const sb = b.data.season ?? 0;
  if (sa !== sb) return sb - sa;
  if (sectionOf(a) !== 'machines' && diffRank(a) !== diffRank(b)) return diffRank(a) - diffRank(b);
  return a.data.order - b.data.order;
}

/** Published writeups. Drafts show up in `npm run dev` only. */
export async function getWriteups(section?: SectionId) {
  const all = await getCollection('writeups', ({ data }) => import.meta.env.DEV || !data.draft);
  return all.filter((e) => !section || sectionOf(e) === section).sort(compare);
}

export interface Group {
  id: string;
  title: string;
  href?: string;
  entries: Writeup[];
}

/** Challenges grouped by category, in a fixed category order. */
export function byCategory(entries: Writeup[]): Group[] {
  const cats = [...new Set(entries.map((e) => categoryOf(e) ?? 'misc'))].sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });
  return cats.map((c) => ({
    id: c,
    title: categoryName(c),
    entries: entries.filter((e) => (categoryOf(e) ?? 'misc') === c),
  }));
}

export async function getPages() {
  const all = await getCollection('pages', ({ data }) => import.meta.env.DEV || !data.draft);
  return all.sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title));
}

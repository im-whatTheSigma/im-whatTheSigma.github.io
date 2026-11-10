import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const id = ({ entry }: { entry: string }) => entry.replace(/\\/g, '/').replace(/(\/index)?\.md$/, '');

// One writeup = src/content/writeups/<section>/<slug>/index.md (images sit next to it)
//   machines/<slug>             → /writeups/machines/<slug>/
//   sherlocks/<slug>            → /writeups/sherlocks/<slug>/
//   challenges/<category>/<slug> → /writeups/challenges/<category>/<slug>/
const writeups = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writeups', generateId: id }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date().optional(), // when you solved it; newest first when set
    platform: z.string().optional(), // HTB, THM, PG ...
    season: z.number().optional(), // HTB season number
    os: z.string().optional(), // Linux, Windows ...
    difficulty: z.string().optional(), // Very Easy, Easy, Medium, Hard, Insane
    tags: z.array(z.string()).default([]),
    summary: z.string().optional(),
    order: z.number().default(0), // position inside the original HackMD note
    draft: z.boolean().default(false),
  }),
});

// Anything else: src/content/pages/about.md → /about/. Add a file, get a page and a nav link.
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages', generateId: id }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    nav: z.boolean().default(true), // show in the top navigation
    order: z.number().default(0),
    draft: z.boolean().default(false),
  }),
});

export const collections = { writeups, pages };

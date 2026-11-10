# blog

Personal site with box writeups under `/writeups/`. Built with Astro, deployed to GitHub Pages.

## Run it

```bash
npm install
npm run dev
```

## Make it yours

Edit `src/site.ts`: handle, intro line, GitHub URL.

## Add a writeup

From HackMD (the note must be readable by "Everyone", or published):

```bash
npm run import -- https://hackmd.io/@you/note --platform HTB --os Linux --difficulty Easy --date 2026-03-01
```

From a private note: HackMD menu → Download → Markdown, then

```bash
npm run import -- ./note.md --platform HTB --os Linux --difficulty Easy
```

Each import creates `src/content/writeups/<slug>/index.md` with its images beside it.
Other flags: `--slug`, `--title`, `--summary "one line"`, `--draft true`, `--force`.

Or write one by hand: any `.md` file in `src/content/writeups/` with this front matter:

```yaml
---
title: "Box name"
date: 2026-03-01
platform: "HTB"      # optional
os: "Linux"          # optional
difficulty: "Easy"   # optional
tags: ["smb", "suid"]
summary: "One line shown on the card."   # optional
draft: false         # true = visible in dev only
---
```

## Deploy

1. Create a GitHub repo. Name it `<username>.github.io` for `https://<username>.github.io/`,
   or anything else for `https://<username>.github.io/<repo>/`. Both work without config changes.
2. Push to `main`.
3. Repo → Settings → Pages → Source: **GitHub Actions**.

`.github/workflows/deploy.yml` builds and publishes on every push.

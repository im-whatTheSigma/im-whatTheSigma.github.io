// Everything personal lives here. Replace the bracketed placeholders.
export const site = {
  handle: "whatTheSigma's blogs",
  intro:
    'IM student and SOC analyst intern by day, Hack The Box at night. Writeups of the machines, Sherlocks and challenges I solve, with notes on how each attack could have been stopped.',
  // visit counter badge in the footer (hits.sh); set to '' to remove it
  visitBadge:
    'https://hits.sh/im-whatthesigma.github.io.svg?view=total&style=flat-square&label=visits&labelColor=1b201b&color=12703a',
  github: '', // set a URL to also show GitHub in the top nav; it's listed under Contact on the About page
};

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Prefix an internal path with the deploy base (matters for project sites). */
export const href = (path: string) => base + path;

export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

// Everything personal lives here. Replace the bracketed placeholders.
export const site = {
  handle: "whatTheSigma's blogs",
  intro:
    'IM student and SOC analyst intern by day, Hack The Box at night. Writeups of the machines, Sherlocks and challenges I solve, with notes on how each attack could have been stopped.',
  github: 'https://github.com/im-whatTheSigma', // leave empty to hide the nav link
};

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Prefix an internal path with the deploy base (matters for project sites). */
export const href = (path: string) => base + path;

export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

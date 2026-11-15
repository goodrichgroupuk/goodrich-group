export type Guide = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  body: string[];
};

/** Posts live in this file. A visitor cannot add one. Publishing means editing the repository. */
export const GUIDES: Guide[] = [
  {
    slug: "welcome",
    title: "Welcome",
    date: "2026-11-15",
    summary: "A placeholder, so the Guides pages can be checked. This is not an article yet.",
    body: [
      "This page is here so the list and the article layout can be looked at. It does not tell anyone what to do in a dispute.",
      "Later notes will be plain-English writing for people dealing with a contractor or a trader, and for people who have to go to the county court, including the small claims track.",
    ],
  },
];

export function getGuide(slug: string) {
  return GUIDES.find((post) => post.slug === slug) ?? null;
}

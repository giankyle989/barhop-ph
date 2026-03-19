export interface Category {
  name: string;
  slug: string;
}

// 13 categories from PRD Appendix 20.1
export const CATEGORIES: Category[] = [
  { name: "Sports Bar", slug: "sports-bar" },
  { name: "Cocktail Bar", slug: "cocktail-bar" },
  { name: "Rooftop Bar", slug: "rooftop-bar" },
  { name: "Night Club", slug: "night-club" },
  { name: "KTV / Karaoke Bar", slug: "ktv-karaoke-bar" },
  { name: "Beer Garden", slug: "beer-garden" },
  { name: "Lounge", slug: "lounge" },
  { name: "Pub", slug: "pub" },
  { name: "Wine Bar", slug: "wine-bar" },
  { name: "Beach Bar", slug: "beach-bar" },
  { name: "Live Music Bar", slug: "live-music-bar" },
  { name: "Speakeasy", slug: "speakeasy" },
  { name: "Hookah / Shisha Bar", slug: "hookah-shisha-bar" },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

/**
 * Maps Google Places `types` array and venue name keywords to app categories.
 *
 * Strategy: name keyword matching runs first (more specific), then Google type
 * mapping, then a "Pub" default.
 */

// ---------------------------------------------------------------------------
// Keyword → category mappings (checked against lowercased venue name)
// ---------------------------------------------------------------------------

interface KeywordRule {
  keywords: string[];
  category: string;
}

const NAME_KEYWORD_RULES: KeywordRule[] = [
  { keywords: ["rooftop", "roof top", "sky bar", "skybar"], category: "Rooftop Bar" },
  { keywords: ["sports bar", "sport bar", "sports lounge"], category: "Sports Bar" },
  { keywords: ["cocktail bar", "cocktail lounge", "mixology"], category: "Cocktail Bar" },
  { keywords: ["jazz", "blues bar", "jazz bar"], category: "Jazz Bar" },
  { keywords: ["karaoke", "videoke", "kareoke"], category: "Karaoke Bar" },
  { keywords: ["wine bar", "wine lounge", "vino"], category: "Wine Bar" },
  { keywords: ["brewpub", "brew pub", "craft beer", "taproom", "tap room", "microbrewery", "brewery"], category: "Craft Beer Bar" },
  { keywords: ["hookah", "shisha", "hubbly"], category: "Hookah Lounge" },
  { keywords: ["dive bar", "dive joint"], category: "Dive Bar" },
  { keywords: ["speakeasy", "speak easy"], category: "Speakeasy" },
  { keywords: ["night club", "nightclub", "disco"], category: "Night Club" },
  { keywords: ["sports"], category: "Sports Bar" },
  { keywords: ["cocktail"], category: "Cocktail Bar" },
  { keywords: ["lounge"], category: "Lounge" },
  { keywords: ["pub"], category: "Pub" },
  { keywords: ["bar & grill", "bar and grill", "bar & restaurant", "bar restaurant"], category: "Bar & Grill" },
];

// ---------------------------------------------------------------------------
// Google Places type → category mappings
// ---------------------------------------------------------------------------

const GOOGLE_TYPE_MAP: Record<string, string> = {
  night_club: "Night Club",
  bar: "Pub",
  restaurant: "Bar & Grill",
  food: "Bar & Grill",
  establishment: "Pub",
};

// ---------------------------------------------------------------------------
// All valid app categories
// ---------------------------------------------------------------------------

export const ALL_CATEGORIES = [
  "Pub",
  "Night Club",
  "Cocktail Bar",
  "Rooftop Bar",
  "Sports Bar",
  "Jazz Bar",
  "Karaoke Bar",
  "Wine Bar",
  "Craft Beer Bar",
  "Hookah Lounge",
  "Dive Bar",
  "Speakeasy",
  "Lounge",
  "Bar & Grill",
] as const;

// ---------------------------------------------------------------------------
// Public function
// ---------------------------------------------------------------------------

/**
 * Returns a deduplicated category array with the most specific match first.
 */
export function mapCategories(types: string[], name: string): string[] {
  const nameLower = name.toLowerCase();
  const categories: string[] = [];

  // 1. Name keyword pass (highest specificity)
  for (const rule of NAME_KEYWORD_RULES) {
    if (rule.keywords.some((kw) => nameLower.includes(kw))) {
      if (!categories.includes(rule.category)) {
        categories.push(rule.category);
      }
    }
  }

  // 2. Google types pass
  for (const type of types) {
    const mapped = GOOGLE_TYPE_MAP[type];
    if (mapped && !categories.includes(mapped)) {
      categories.push(mapped);
    }
  }

  // 3. Default fallback
  if (categories.length === 0) {
    categories.push("Pub");
  }

  return categories;
}

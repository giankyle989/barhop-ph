/**
 * Infers listing tags from Google Places data.
 *
 * Tag sources:
 *   1. Google types       (e.g. night_club → "nightclub")
 *   2. Name keywords      (rooftop, craft, hookah, sports, live music, etc.)
 *   3. Opening hours      (24/7 detection)
 *   4. Wheelchair access  (accessibility tag)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TagMapperInput {
  types: string[];
  name: string;
  openingHours?: {
    periods: Array<{
      close?: unknown;
    }>;
  };
  wheelchairAccessibleEntrance?: boolean;
}

// ---------------------------------------------------------------------------
// Mappings
// ---------------------------------------------------------------------------

/** Google Places types → tags */
const GOOGLE_TYPE_TAGS: Record<string, string> = {
  night_club: "nightclub",
  bar: "bar",
  restaurant: "food",
  cafe: "cafe",
  lodging: "hotel-bar",
};

/** Name keyword → tag rules (checked on lowercased name) */
interface NameTagRule {
  keywords: string[];
  tag: string;
}

const NAME_TAG_RULES: NameTagRule[] = [
  { keywords: ["rooftop", "roof top", "sky bar", "skybar", "sky lounge"], tag: "rooftop" },
  { keywords: ["craft beer", "brewpub", "brew pub", "taproom", "tap room", "microbrewery"], tag: "craft-beer" },
  { keywords: ["hookah", "shisha", "hubbly"], tag: "hookah" },
  { keywords: ["sports bar", "sport bar", "sports lounge", "sports"], tag: "sports" },
  { keywords: ["live music", "live band", "live jazz", "jazz", "blues", "acoustic"], tag: "live-music" },
  { keywords: ["cocktail", "mixology", "speakeasy", "speak easy"], tag: "cocktails" },
  { keywords: ["karaoke", "videoke"], tag: "karaoke" },
  { keywords: ["wine", "vino"], tag: "wine" },
  { keywords: ["pool", "billiards", "billiard"], tag: "pool-table" },
  { keywords: ["outdoor", "al fresco", "garden", "patio"], tag: "outdoor-seating" },
  { keywords: ["beach", "beachfront", "seaside", "oceanfront"], tag: "beach" },
  { keywords: ["dj", "edm", "techno", "house music"], tag: "dj" },
  { keywords: ["lgbtq", "lgbt", "gay bar", "queer"], tag: "lgbtq-friendly" },
  { keywords: ["happy hour"], tag: "happy-hour" },
  { keywords: ["pub quiz", "trivia"], tag: "pub-quiz" },
  { keywords: ["arcade", "gaming"], tag: "arcade" },
  { keywords: ["strip", "gentlemen's club"], tag: "adult" },
];

// ---------------------------------------------------------------------------
// 24/7 detection
// ---------------------------------------------------------------------------

/**
 * Google encodes a 24-hour open venue as a period with open.day=0, open.time=0000
 * and *no close entry*. We detect this pattern.
 */
function is24Hours(
  periods: Array<{ close?: unknown }>
): boolean {
  if (periods.length !== 1) return false;
  const [period] = periods;
  return period.close === undefined || period.close === null;
}

// ---------------------------------------------------------------------------
// Public function
// ---------------------------------------------------------------------------

/**
 * Returns a deduplicated, sorted list of inferred tags.
 */
export function mapTags(details: TagMapperInput): string[] {
  const tags = new Set<string>();
  const nameLower = details.name.toLowerCase();

  // 1. Google types
  for (const type of details.types) {
    const tag = GOOGLE_TYPE_TAGS[type];
    if (tag) tags.add(tag);
  }

  // 2. Name keyword rules
  for (const rule of NAME_TAG_RULES) {
    if (rule.keywords.some((kw) => nameLower.includes(kw))) {
      tags.add(rule.tag);
    }
  }

  // 3. Opening hours — 24/7
  if (details.openingHours?.periods && is24Hours(details.openingHours.periods)) {
    tags.add("open-24-hours");
  }

  // 4. Wheelchair accessibility
  if (details.wheelchairAccessibleEntrance === true) {
    tags.add("wheelchair-accessible");
  }

  return Array.from(tags).sort();
}

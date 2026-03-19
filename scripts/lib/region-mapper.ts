/**
 * Maps Google Places addressComponents to app region/city slugs.
 *
 * Metro Manila cities come from administrative_area_level_2 (not locality).
 * "San Fernando" exists in both Region I (La Union) and Region III (Pampanga)
 * — disambiguated by province component.
 */

import { REGIONS } from "../../src/lib/constants/regions";

type AddressComponent = {
  longName: string;
  shortName: string;
  types: string[];
};

// ---------------------------------------------------------------------------
// Alias / normalisation map
// Covers common alternative names returned by Google that differ from our DB.
// ---------------------------------------------------------------------------

const CITY_ALIASES: Record<string, string> = {
  // BGC variants
  "bonifacio global city": "taguig",
  "bgc": "taguig",
  "fort bonifacio": "taguig",
  "global city": "taguig",

  // Metro Manila quirks
  "city of manila": "manila",
  "city of makati": "makati",
  "city of pasig": "pasig",
  "city of taguig": "taguig",
  "city of quezon": "quezon-city",
  "quezon city": "quezon-city",
  "city of mandaluyong": "mandaluyong",
  "city of pasay": "pasay",
  "city of parañaque": "paranaque",
  "city of paranaque": "paranaque",
  "city of las piñas": "las-pinas",
  "city of las pinas": "las-pinas",
  "city of muntinlupa": "muntinlupa",
  "city of marikina": "marikina",
  "city of caloocan": "caloocan",
  "city of valenzuela": "valenzuela",
  "navotas city": "navotas",
  "malabon city": "malabon",

  // Visayas
  "cebu": "cebu-city",
  "city of cebu": "cebu-city",
  "lapu-lapu city": "lapu-lapu",
  "opon": "lapu-lapu",
  "mandaue city": "mandaue",

  // Mindanao
  "davao": "davao-city",
  "city of davao": "davao-city",
  "cdo": "cagayan-de-oro",
  "gensan": "general-santos",
  "general santos city": "general-santos",

  // Other common alternates
  "angeles": "angeles-city",
  "city of angeles": "angeles-city",
  "puerto princesa city": "puerto-princesa",
  "city of puerto princesa": "puerto-princesa",
  "iloilo": "iloilo-city",
  "city of iloilo": "iloilo-city",
  "zamboanga": "zamboanga-city",
  "city of zamboanga": "zamboanga-city",
  "cotabato": "cotabato-city",
  "city of cotabato": "cotabato-city",
  "legazpi city": "legazpi",
  "naga city": "naga",
  "baguio city": "baguio",
  "butuan city": "butuan",
  "tacloban city": "tacloban",
  "tuguegarao city": "tuguegarao",
  "vigan city": "vigan",
  "lucena city": "lucena",
  "antipolo city": "antipolo",
};

// ---------------------------------------------------------------------------
// Province → region disambiguation for "San Fernando"
// ---------------------------------------------------------------------------

const SAN_FERNANDO_PROVINCE_MAP: Record<string, string> = {
  "la union": "ilocos-region",
  "pampanga": "central-luzon",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractComponent(
  components: AddressComponent[],
  ...types: string[]
): string | undefined {
  for (const type of types) {
    const match = components.find((c) => c.types.includes(type));
    if (match) return match.longName;
  }
  return undefined;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function findCityInRegions(
  citySlug: string
): { region: string; city: string } | null {
  for (const region of REGIONS) {
    const city = region.cities.find((c) => c.slug === citySlug);
    if (city) {
      return { region: region.slug, city: city.slug };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Public function
// ---------------------------------------------------------------------------

export function mapToRegionCity(
  addressComponents: AddressComponent[]
): { region: string; city: string } | null {
  // Extract raw city name candidates from most-specific to least-specific.
  const locality = extractComponent(addressComponents, "locality");
  const adminLevel2 = extractComponent(
    addressComponents,
    "administrative_area_level_2"
  );
  const adminLevel1 = extractComponent(
    addressComponents,
    "administrative_area_level_1"
  );

  // Prefer locality; fall back to admin_area_level_2 (Metro Manila cities).
  const rawCity = locality ?? adminLevel2;
  if (!rawCity) return null;

  const rawCityLower = rawCity.toLowerCase().trim();

  // 1. Check alias map first.
  const aliasSlug = CITY_ALIASES[rawCityLower];
  if (aliasSlug) {
    return findCityInRegions(aliasSlug);
  }

  // 2. Handle "San Fernando" disambiguation by province.
  if (rawCityLower === "san fernando" || rawCityLower === "city of san fernando") {
    const provinceLower = adminLevel1?.toLowerCase().trim() ?? "";
    const regionSlug = SAN_FERNANDO_PROVINCE_MAP[provinceLower];
    if (regionSlug) {
      return { region: regionSlug, city: "san-fernando" };
    }
    // Cannot disambiguate — skip
    return null;
  }

  // 3. Try direct slug match against REGIONS data.
  const directSlug = slugify(rawCity);
  const direct = findCityInRegions(directSlug);
  if (direct) return direct;

  // 4. Try admin_area_level_2 as a fallback slug (Metro Manila path).
  if (adminLevel2 && adminLevel2 !== rawCity) {
    const level2Slug = slugify(adminLevel2);
    const level2Match = findCityInRegions(level2Slug);
    if (level2Match) return level2Match;
  }

  return null;
}

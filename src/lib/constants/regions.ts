export interface City {
  name: string;
  slug: string;
}

export interface Region {
  name: string;
  displayName: string;
  slug: string;
  cities: City[];
}

export const REGIONS: Region[] = [
  {
    name: "NCR",
    displayName: "National Capital Region",
    slug: "ncr",
    cities: [
      { name: "Makati", slug: "makati" },
      { name: "Taguig", slug: "taguig" },
      { name: "Quezon City", slug: "quezon-city" },
      { name: "Manila", slug: "manila" },
      { name: "Pasig", slug: "pasig" },
      { name: "Mandaluyong", slug: "mandaluyong" },
      { name: "Pasay", slug: "pasay" },
      { name: "San Juan", slug: "san-juan" },
      { name: "Parañaque", slug: "paranaque" },
      { name: "Las Piñas", slug: "las-pinas" },
      { name: "Muntinlupa", slug: "muntinlupa" },
      { name: "Marikina", slug: "marikina" },
      { name: "Caloocan", slug: "caloocan" },
      { name: "Valenzuela", slug: "valenzuela" },
      { name: "Navotas", slug: "navotas" },
      { name: "Malabon", slug: "malabon" },
      { name: "Pateros", slug: "pateros" },
    ],
  },
  {
    name: "Region I",
    displayName: "Ilocos Region",
    slug: "ilocos-region",
    cities: [
      { name: "San Fernando", slug: "san-fernando" },
      { name: "Vigan", slug: "vigan" },
    ],
  },
  {
    name: "Region II",
    displayName: "Cagayan Valley",
    slug: "cagayan-valley",
    cities: [{ name: "Tuguegarao", slug: "tuguegarao" }],
  },
  {
    name: "Region III",
    displayName: "Central Luzon",
    slug: "central-luzon",
    cities: [
      { name: "Angeles City", slug: "angeles-city" },
      { name: "San Fernando", slug: "san-fernando" },
      { name: "Clark", slug: "clark" },
    ],
  },
  {
    name: "Region IV-A",
    displayName: "CALABARZON",
    slug: "calabarzon",
    cities: [
      { name: "Tagaytay", slug: "tagaytay" },
      { name: "Antipolo", slug: "antipolo" },
      { name: "Lucena", slug: "lucena" },
    ],
  },
  {
    name: "Region IV-B",
    displayName: "MIMAROPA",
    slug: "mimaropa",
    cities: [
      { name: "Puerto Princesa", slug: "puerto-princesa" },
      { name: "Calapan", slug: "calapan" },
    ],
  },
  {
    name: "Region V",
    displayName: "Bicol Region",
    slug: "bicol-region",
    cities: [
      { name: "Legazpi", slug: "legazpi" },
      { name: "Naga", slug: "naga" },
    ],
  },
  {
    name: "Region VI",
    displayName: "Western Visayas",
    slug: "western-visayas",
    cities: [
      { name: "Iloilo City", slug: "iloilo-city" },
      { name: "Bacolod", slug: "bacolod" },
    ],
  },
  {
    name: "Region VII",
    displayName: "Central Visayas",
    slug: "central-visayas",
    cities: [
      { name: "Cebu City", slug: "cebu-city" },
      { name: "Mandaue", slug: "mandaue" },
      { name: "Lapu-Lapu", slug: "lapu-lapu" },
    ],
  },
  {
    name: "Region VIII",
    displayName: "Eastern Visayas",
    slug: "eastern-visayas",
    cities: [{ name: "Tacloban", slug: "tacloban" }],
  },
  {
    name: "Region IX",
    displayName: "Zamboanga Peninsula",
    slug: "zamboanga-peninsula",
    cities: [{ name: "Zamboanga City", slug: "zamboanga-city" }],
  },
  {
    name: "Region X",
    displayName: "Northern Mindanao",
    slug: "northern-mindanao",
    cities: [{ name: "Cagayan de Oro", slug: "cagayan-de-oro" }],
  },
  {
    name: "Region XI",
    displayName: "Davao Region",
    slug: "davao-region",
    cities: [{ name: "Davao City", slug: "davao-city" }],
  },
  {
    name: "Region XII",
    displayName: "SOCCSKSARGEN",
    slug: "soccsksargen",
    cities: [{ name: "General Santos", slug: "general-santos" }],
  },
  {
    name: "Region XIII",
    displayName: "Caraga",
    slug: "caraga",
    cities: [{ name: "Butuan", slug: "butuan" }],
  },
  {
    name: "CAR",
    displayName: "Cordillera Administrative Region",
    slug: "car",
    cities: [{ name: "Baguio", slug: "baguio" }],
  },
  {
    name: "BARMM",
    displayName: "Bangsamoro Autonomous Region in Muslim Mindanao",
    slug: "barmm",
    cities: [{ name: "Cotabato City", slug: "cotabato-city" }],
  },
];

export function getRegionBySlug(slug: string): Region | undefined {
  return REGIONS.find((r) => r.slug === slug);
}

export function getCityBySlug(
  regionSlug: string,
  citySlug: string
): City | undefined {
  const region = getRegionBySlug(regionSlug);
  if (!region) return undefined;
  return region.cities.find((c) => c.slug === citySlug);
}

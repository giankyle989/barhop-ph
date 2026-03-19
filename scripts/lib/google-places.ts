/**
 * Google Places API client for venue discovery.
 *
 * Rate limiting: token-bucket style, max 10 req/s, exponential backoff on 429.
 * Requires GOOGLE_PLACES_API_KEY env var.
 */

const PLACES_BASE = "https://maps.googleapis.com/maps/api/place";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlaceResult {
  placeId: string;
  name: string;
  formattedAddress: string;
  types: string[];
  geometry: { location: { lat: number; lng: number } };
}

export interface PlacePhoto {
  photoReference: string;
  width: number;
  height: number;
}

export interface OpeningHoursPeriod {
  open: { day: number; hours: number; minutes: number };
  close?: { day: number; hours: number; minutes: number };
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  geometry: { location: { lat: number; lng: number } };
  types: string[];
  internationalPhoneNumber?: string;
  website?: string;
  openingHours?: { periods: OpeningHoursPeriod[] };
  photos?: PlacePhoto[];
  addressComponents: Array<{
    longName: string;
    shortName: string;
    types: string[];
  }>;
  wheelchairAccessibleEntrance?: boolean;
}

// ---------------------------------------------------------------------------
// Rate limiter
// ---------------------------------------------------------------------------

/** Minimum ms between requests to stay under 10 req/s. */
const MIN_INTERVAL_MS = 100;

let lastRequestAt = 0;

async function throttle(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestAt;
  if (elapsed < MIN_INTERVAL_MS) {
    await sleep(MIN_INTERVAL_MS - elapsed);
  }
  lastRequestAt = Date.now();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Core fetch with retry / backoff
// ---------------------------------------------------------------------------

async function placesGet(
  path: string,
  params: Record<string, string>,
  attempt = 0
): Promise<unknown> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY env var is not set");
  }

  await throttle();

  const url = new URL(`${PLACES_BASE}${path}/json`);
  url.searchParams.set("key", apiKey);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString());

  if (res.status === 429) {
    const maxAttempts = 5;
    if (attempt >= maxAttempts) {
      throw new Error(`Google Places API rate-limited after ${maxAttempts} retries`);
    }
    const backoffMs = Math.min(1000 * 2 ** attempt, 30_000);
    console.warn(`[places] 429 received — retrying in ${backoffMs}ms (attempt ${attempt + 1})`);
    await sleep(backoffMs);
    return placesGet(path, params, attempt + 1);
  }

  if (!res.ok) {
    throw new Error(`Google Places API error: ${res.status} ${res.statusText}`);
  }

  const body = await res.json() as Record<string, unknown>;

  if (body.status !== "OK" && body.status !== "ZERO_RESULTS") {
    throw new Error(
      `Google Places API returned status "${body.status}": ${body.error_message ?? "(no message)"}`
    );
  }

  return body;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Text-search for places matching a query, optionally biased by location.
 */
export async function searchPlaces(
  query: string,
  location?: { lat: number; lng: number }
): Promise<PlaceResult[]> {
  const params: Record<string, string> = { query };
  if (location) {
    params.location = `${location.lat},${location.lng}`;
    params.radius = "50000";
  }

  const body = await placesGet("/textsearch", params) as {
    results?: Array<{
      place_id: string;
      name: string;
      formatted_address: string;
      types: string[];
      geometry: { location: { lat: number; lng: number } };
    }>;
  };

  return (body.results ?? []).map((r) => ({
    placeId: r.place_id,
    name: r.name,
    formattedAddress: r.formatted_address,
    types: r.types,
    geometry: r.geometry,
  }));
}

/**
 * Fetch rich details for a single place by its placeId.
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const fields = [
    "place_id",
    "name",
    "formatted_address",
    "geometry",
    "types",
    "international_phone_number",
    "website",
    "opening_hours",
    "photos",
    "address_components",
    "wheelchair_accessible_entrance",
  ].join(",");

  const body = await placesGet("/details", {
    place_id: placeId,
    fields,
  }) as {
    result: {
      place_id: string;
      name: string;
      formatted_address: string;
      geometry: { location: { lat: number; lng: number } };
      types: string[];
      international_phone_number?: string;
      website?: string;
      opening_hours?: {
        periods: Array<{
          open: { day: number; time: string };
          close?: { day: number; time: string };
        }>;
      };
      photos?: Array<{
        photo_reference: string;
        width: number;
        height: number;
      }>;
      address_components: Array<{
        long_name: string;
        short_name: string;
        types: string[];
      }>;
      wheelchair_accessible_entrance?: boolean;
    };
  };

  const r = body.result;

  // Google encodes hours as "HHMM" strings — split into hours/minutes integers.
  const mapPeriod = (p: {
    open: { day: number; time: string };
    close?: { day: number; time: string };
  }): OpeningHoursPeriod => ({
    open: {
      day: p.open.day,
      hours: parseInt(p.open.time.slice(0, 2), 10),
      minutes: parseInt(p.open.time.slice(2), 10),
    },
    close: p.close
      ? {
          day: p.close.day,
          hours: parseInt(p.close.time.slice(0, 2), 10),
          minutes: parseInt(p.close.time.slice(2), 10),
        }
      : undefined,
  });

  return {
    placeId: r.place_id,
    name: r.name,
    formattedAddress: r.formatted_address,
    geometry: r.geometry,
    types: r.types,
    internationalPhoneNumber: r.international_phone_number,
    website: r.website,
    openingHours: r.opening_hours
      ? { periods: r.opening_hours.periods.map(mapPeriod) }
      : undefined,
    photos: r.photos?.map((p) => ({
      photoReference: p.photo_reference,
      width: p.width,
      height: p.height,
    })),
    addressComponents: r.address_components.map((c) => ({
      longName: c.long_name,
      shortName: c.short_name,
      types: c.types,
    })),
    wheelchairAccessibleEntrance: r.wheelchair_accessible_entrance,
  };
}

/**
 * Download a Place photo as a raw Buffer.
 * Google redirects the photo request — fetch follows redirects automatically.
 */
export async function downloadPlacePhoto(
  photoReference: string,
  maxWidth: number
): Promise<Buffer> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY env var is not set");
  }

  await throttle();

  const url = new URL(`${PLACES_BASE}/photo/json`);
  url.searchParams.set("photo_reference", photoReference);
  url.searchParams.set("maxwidth", String(maxWidth));
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(
      `Failed to download place photo: ${res.status} ${res.statusText}`
    );
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

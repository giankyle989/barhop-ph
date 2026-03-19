// Server-side only — do not import this from client components
const UMAMI_API_URL = process.env.UMAMI_API_URL || "https://api.umami.is/v1";
const UMAMI_API_KEY = process.env.UMAMI_API_KEY;
const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

/**
 * Fetch page view count for a given URL path over a rolling window.
 * Returns 0 gracefully when credentials are not configured or the request fails.
 */
export async function getPageViews(urlPath: string, days: number = 30): Promise<number> {
  if (!UMAMI_API_KEY || !UMAMI_WEBSITE_ID) return 0;
  const startAt = Date.now() - days * 24 * 60 * 60 * 1000;
  const endAt = Date.now();
  const response = await fetch(
    `${UMAMI_API_URL}/websites/${UMAMI_WEBSITE_ID}/metrics?startAt=${startAt}&endAt=${endAt}&type=url&url=${encodeURIComponent(urlPath)}`,
    {
      headers: { "x-umami-api-key": UMAMI_API_KEY },
      next: { revalidate: 3600 },
    },
  );
  if (!response.ok) return 0;
  const data = await response.json();
  return (data[0]?.y as number) || 0;
}

/**
 * Fetch all-time page view count for a given URL path (10-year window).
 */
export async function getTotalPageViews(urlPath: string): Promise<number> {
  return getPageViews(urlPath, 365 * 10);
}

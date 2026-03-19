const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://barhop.ph";

export function canonicalUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

export function siteUrl(): string {
  return SITE_URL;
}

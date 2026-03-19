import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui";
import { FeaturedBadge } from "./featured-badge";
import {
  buildListingUrl,
  getPrimaryCategory,
  type ListingCardData,
} from "@/lib/listing-helpers";

export interface SpotlightListingData extends ListingCardData {
  description?: string | null;
}

interface SpotlightCardProps {
  listing: SpotlightListingData;
}

/**
 * Strip HTML tags and truncate to a target character count, breaking at a
 * word boundary so we never cut mid-word.
 */
function toPlainTextExcerpt(html: string | null | undefined, maxLength = 120): string {
  if (!html) return "";
  // Remove all HTML tags — safe because we only display, never inject
  const stripped = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (stripped.length <= maxLength) return stripped;
  // Truncate at word boundary
  const truncated = stripped.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + "…";
}

/**
 * Full-width spotlight card for promoted listings on region/city landing pages.
 * Server component — no client JS required.
 */
export function SpotlightCard({ listing }: SpotlightCardProps) {
  const { name, slug, categories, region, city, imageUrl, description } = listing;
  const href = buildListingUrl(region, city, slug);
  const primaryCategory = getPrimaryCategory(categories);
  const excerpt = toPlainTextExcerpt(description);

  return (
    <article className="relative overflow-hidden rounded-card border border-neon-purple/30 bg-surface-card glow-purple">
      <Link href={href} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple focus-visible:ring-offset-2 focus-visible:ring-offset-surface">
        <div className="flex flex-col sm:flex-row">
          {/* Hero image */}
          <div className="relative h-52 sm:h-auto sm:w-64 lg:w-80 shrink-0">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={`${name} — ${primaryCategory} in ${city}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 256px, 320px"
                className="object-cover"
                priority
              />
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neon-purple/30 to-neon-pink/20 text-content-muted text-sm font-medium"
                aria-hidden="true"
              >
                No image
              </div>
            )}
            {/* Featured badge positioned over the image */}
            <FeaturedBadge />
          </div>

          {/* Content */}
          <div className="flex flex-col justify-center gap-3 p-5 sm:p-6">
            {/* Category badges */}
            <div className="flex flex-wrap gap-2">
              {categories.slice(0, 3).map((cat) => (
                <Badge key={cat} variant="neon">
                  {cat}
                </Badge>
              ))}
              <Badge variant="featured">Featured</Badge>
            </div>

            <h3 className="font-display text-display-sm font-semibold text-content group-hover:text-neon-purple transition-colors line-clamp-2">
              {name}
            </h3>

            {excerpt && (
              <p className="text-sm text-content-secondary line-clamp-3">
                {excerpt}
              </p>
            )}

            <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-neon-purple group-hover:text-neon-pink transition-colors">
              View venue &rarr;
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

import { Star } from "lucide-react";

/**
 * Absolute-positioned badge shown on the image of promoted listing cards.
 * Parent container must have `position: relative`.
 */
export function FeaturedBadge() {
  return (
    <span
      className="absolute top-2 right-2 bg-status-featured text-surface text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 z-10"
      aria-label="Featured venue"
    >
      <Star className="w-3 h-3" fill="currentColor" aria-hidden="true" />
      Featured
    </span>
  );
}

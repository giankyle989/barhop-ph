"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Clock } from "lucide-react";
import { Card, CardContent, Badge } from "@/components/ui";
import { OpenClosedBadge } from "./open-closed-badge";
import {
  buildListingUrl,
  getPrimaryCategory,
  type ListingCardData,
} from "@/lib/listing-helpers";

interface ListingCardProps {
  listing: ListingCardData;
  variant?: "grid" | "list";
}

/** Neon gradient placeholder shown when a listing has no image. */
function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-neon-purple/30 to-neon-pink/20 text-content-muted text-sm font-medium ${className ?? ""}`}
      aria-hidden="true"
    >
      No image
    </div>
  );
}

export function ListingCard({ listing, variant = "grid" }: ListingCardProps) {
  const {
    name,
    slug,
    categories,
    region,
    city,
    imageUrl,
    isPromoted,
    openHours,
    distance,
  } = listing;

  const href = buildListingUrl(region, city, slug);
  const primaryCategory = getPrimaryCategory(categories);
  const distanceLabel =
    distance !== undefined ? `${distance.toFixed(1)} km` : null;

  if (variant === "list") {
    return (
      <Card featured={isPromoted} className="overflow-hidden">
        <div className="flex flex-row">
          {/* Image — fixed width on the left */}
          <div className="relative w-36 shrink-0 sm:w-48">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={`${name} - ${primaryCategory} in ${city}`}
                fill
                sizes="(max-width: 640px) 144px, 192px"
                className="object-cover"
              />
            ) : (
              <ImagePlaceholder className="absolute inset-0" />
            )}
          </div>

          {/* Content — grows to fill remaining space */}
          <CardContent className="flex flex-col justify-between gap-2 py-3">
            <div>
              <Link
                href={href}
                className="font-display text-base font-semibold text-content hover:text-neon-purple transition-colors line-clamp-1"
              >
                {name}
              </Link>

              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge variant="neon">{primaryCategory}</Badge>
                {isPromoted && <Badge variant="featured">Featured</Badge>}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-content-secondary">
              <span className="flex items-center gap-1">
                <MapPin size={12} className="shrink-0" aria-hidden="true" />
                {city}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} className="shrink-0" aria-hidden="true" />
                <OpenClosedBadge openHours={openHours} />
              </span>
              {distanceLabel && (
                <Badge variant="default">{distanceLabel}</Badge>
              )}
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  // Grid variant — vertical card
  return (
    <Card featured={isPromoted} className="overflow-hidden flex flex-col">
      {/* Image — fixed aspect ratio on top */}
      <div className="relative aspect-[16/9] w-full">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${name} - ${primaryCategory} in ${city}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <ImagePlaceholder className="absolute inset-0" />
        )}
      </div>

      {/* Content */}
      <CardContent className="flex flex-col gap-2 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="neon">{primaryCategory}</Badge>
          {isPromoted && <Badge variant="featured">Featured</Badge>}
        </div>

        <Link
          href={href}
          className="font-display text-base font-semibold text-content hover:text-neon-purple transition-colors line-clamp-2"
        >
          {name}
        </Link>

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-content-secondary">
          <span className="flex items-center gap-1">
            <MapPin size={12} className="shrink-0" aria-hidden="true" />
            {city}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} className="shrink-0" aria-hidden="true" />
            <OpenClosedBadge openHours={openHours} />
          </span>
          {distanceLabel && (
            <Badge variant="default">{distanceLabel}</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

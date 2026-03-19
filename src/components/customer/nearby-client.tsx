"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingCard } from "@/components/customer/listing-card";
import type { ListingCardData } from "@/lib/listing-helpers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GeoState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "loading"; lat: number; lng: number }
  | { status: "success"; lat: number; lng: number; listings: ListingCardData[] }
  | { status: "empty"; radius: number }
  | { status: "error"; message: string };

/** Raw shape returned by /api/listings?nearby=true (distance is in meters from PostGIS). */
interface NearbyApiListing {
  id: string;
  name: string;
  slug: string;
  categories: string[];
  region: string;
  city: string;
  imageUrl: string | null;
  isPromoted: boolean;
  openHours: Record<string, { open: string; close: string } | null> | null;
  tags: string[];
  distance: number; // metres
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RADIUS_OPTIONS = [1, 3, 5, 10, 25] as const;
type Radius = (typeof RADIUS_OPTIONS)[number];

const DEFAULT_RADIUS: Radius = 5;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchNearby(
  lat: number,
  lng: number,
  radius: Radius
): Promise<ListingCardData[]> {
  const url = `/api/listings?nearby=true&lat=${lat}&lng=${lng}&radius=${radius}&limit=50`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch nearby listings (${res.status})`);
  }

  const data: { listings: NearbyApiListing[] } = await res.json();

  // Convert distance from metres → km to match ListingCardData convention
  return data.listings.map((l) => ({
    id: l.id,
    name: l.name,
    slug: l.slug,
    categories: l.categories,
    region: l.region,
    city: l.city,
    imageUrl: l.imageUrl,
    isPromoted: l.isPromoted,
    openHours: l.openHours,
    tags: l.tags,
    distance: l.distance / 1000,
  }));
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SkeletonGrid() {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      aria-label="Loading nearby listings"
      aria-busy="true"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-card overflow-hidden bg-surface-card border border-border p-0">
          <Skeleton className="aspect-[16/9] w-full rounded-none" />
          <div className="flex flex-col gap-2 p-4 pb-5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/2 mt-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface RadiusSelectorProps {
  value: Radius;
  onChange: (r: Radius) => void;
  disabled?: boolean;
}

function RadiusSelector({ value, onChange, disabled }: RadiusSelectorProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Search radius">
      <span className="text-sm text-content-secondary shrink-0">Radius:</span>
      {RADIUS_OPTIONS.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          disabled={disabled}
          aria-pressed={value === r}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
            value === r
              ? "bg-neon-purple text-white"
              : "bg-surface-card border border-border text-content-secondary hover:text-content hover:border-border-hover"
          }`}
        >
          {r}km
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function NearbyClient() {
  const [radius, setRadius] = useState<Radius>(DEFAULT_RADIUS);
  const [geo, setGeo] = useState<GeoState>({ status: "idle" });

  const loadResults = useCallback(
    async (lat: number, lng: number, r: Radius) => {
      setGeo({ status: "loading", lat, lng });
      try {
        const listings = await fetchNearby(lat, lng, r);
        if (listings.length === 0) {
          setGeo({ status: "empty", radius: r });
        } else {
          setGeo({ status: "success", lat, lng, listings });
        }
      } catch {
        setGeo({ status: "error", message: "Failed to load nearby listings. Please try again." });
      }
    },
    []
  );

  const handleEnableLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeo({
        status: "error",
        message: "Geolocation is not supported by your browser.",
      });
      return;
    }

    setGeo({ status: "requesting" });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        loadResults(lat, lng, radius);
      },
      (err) => {
        if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
          setGeo({
            status: "error",
            message:
              "Location access was denied. Please enable location permissions in your browser settings.",
          });
        } else {
          setGeo({
            status: "error",
            message: "Unable to determine your location. Please try again.",
          });
        }
      },
      { timeout: 10_000, maximumAge: 60_000 }
    );
  }, [radius, loadResults]);

  const handleRadiusChange = useCallback(
    (newRadius: Radius) => {
      setRadius(newRadius);
      // If we already have coords, re-fetch immediately with the new radius
      if (geo.status === "success" || geo.status === "loading") {
        const lat = geo.lat;
        const lng = geo.lng;
        loadResults(lat, lng, newRadius);
      } else if (geo.status === "empty") {
        // Re-try with the new radius — we need coords; prompt again
        setGeo({ status: "idle" });
      }
    },
    [geo, loadResults]
  );

  // ------------------------------------------------------------------
  // Render: idle
  // ------------------------------------------------------------------
  if (geo.status === "idle") {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
        <div className="w-20 h-20 rounded-full bg-surface-card border border-border flex items-center justify-center">
          <Navigation size={36} className="text-neon-purple" aria-hidden="true" />
        </div>
        <div className="max-w-sm">
          <p className="text-content font-display text-lg font-semibold mb-1">Find bars near you</p>
          <p className="text-content-secondary text-sm">
            Enable your location to discover nightlife venues within your chosen radius.
          </p>
        </div>
        <div className="flex flex-col items-center gap-4">
          <RadiusSelector value={radius} onChange={setRadius} />
          <Button onClick={handleEnableLocation} size="lg">
            <Navigation size={16} className="mr-2" aria-hidden="true" />
            Enable Location
          </Button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Render: requesting permission
  // ------------------------------------------------------------------
  if (geo.status === "requesting") {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <Loader2 size={40} className="text-neon-purple animate-spin" aria-hidden="true" />
        <p className="text-content-secondary text-sm">Waiting for location permission&hellip;</p>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Render: loading results
  // ------------------------------------------------------------------
  if (geo.status === "loading") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <p className="text-content-secondary text-sm flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            Finding nearby venues&hellip;
          </p>
          <RadiusSelector value={radius} onChange={handleRadiusChange} disabled />
        </div>
        <SkeletonGrid />
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Render: error
  // ------------------------------------------------------------------
  if (geo.status === "error") {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
        <div className="w-20 h-20 rounded-full bg-surface-card border border-border flex items-center justify-center">
          <MapPin size={36} className="text-content-muted" aria-hidden="true" />
        </div>
        <div className="max-w-sm">
          <p className="text-content font-display text-lg font-semibold mb-1">Location unavailable</p>
          <p className="text-content-secondary text-sm">{geo.message}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleEnableLocation} variant="primary">
            Try Again
          </Button>
          <Link
            href="/listings"
            className="inline-flex items-center justify-center rounded font-medium transition-all duration-150 px-4 py-2 text-sm bg-surface-card hover:bg-surface-overlay text-content border border-border hover:border-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Browse all listings
          </Link>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Render: empty
  // ------------------------------------------------------------------
  if (geo.status === "empty") {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
        <div className="w-20 h-20 rounded-full bg-surface-card border border-border flex items-center justify-center">
          <MapPin size={36} className="text-content-muted" aria-hidden="true" />
        </div>
        <div className="max-w-sm">
          <p className="text-content font-display text-lg font-semibold mb-1">
            No bars found within {geo.radius}km
          </p>
          <p className="text-content-secondary text-sm">
            Try increasing the search radius or browse all listings.
          </p>
        </div>
        <div className="flex flex-col items-center gap-4">
          <RadiusSelector value={radius} onChange={handleRadiusChange} />
          <Link
            href="/listings"
            className="inline-flex items-center justify-center rounded font-medium transition-all duration-150 px-4 py-2 text-sm bg-surface-card hover:bg-surface-overlay text-content border border-border hover:border-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Browse all listings
          </Link>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Render: success
  // ------------------------------------------------------------------
  // geo.status === "success"
  const { listings } = geo;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <p className="text-content-secondary text-sm">
          Found <span className="text-content font-medium">{listings.length}</span> venue
          {listings.length !== 1 ? "s" : ""} within {radius}km
        </p>
        <RadiusSelector value={radius} onChange={handleRadiusChange} />
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        aria-label={`${listings.length} bars near you`}
      >
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} variant="grid" />
        ))}
      </div>
    </div>
  );
}

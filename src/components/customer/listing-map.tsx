"use client";

import { ExternalLink } from "lucide-react";

interface ListingMapProps {
  latitude: number;
  longitude: number;
  name: string;
}

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export function ListingMap({ latitude, longitude, name }: ListingMapProps) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  return (
    <div className="rounded-lg overflow-hidden border border-border">
      {MAPS_API_KEY ? (
        <iframe
          title={`Map showing location of ${name}`}
          src={`https://www.google.com/maps/embed/v1/place?key=${MAPS_API_KEY}&q=${latitude},${longitude}&zoom=15`}
          width="100%"
          height="260"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          aria-label={`Google Maps embed for ${name}`}
        />
      ) : (
        /* Fallback: static placeholder with external link when API key is not configured */
        <div className="flex flex-col items-center justify-center gap-3 h-40 bg-surface-card text-content-secondary px-4 text-center">
          <p className="text-sm">Map preview unavailable</p>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-neon-purple hover:text-neon-purple/80 transition-colors font-medium"
          >
            <ExternalLink size={14} aria-hidden="true" />
            Open in Google Maps
          </a>
        </div>
      )}

      {/* Always show the "open in maps" link below the embed too */}
      {MAPS_API_KEY && (
        <div className="px-3 py-2 bg-surface-card border-t border-border">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-content-secondary hover:text-neon-purple transition-colors"
          >
            <ExternalLink size={12} aria-hidden="true" />
            Open in Google Maps
          </a>
        </div>
      )}
    </div>
  );
}

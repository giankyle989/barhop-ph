"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ListingGalleryProps {
  images: string[];
  alt: string;
}

export function ListingGallery({ images, alt }: ListingGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const showPrev = useCallback(() => {
    setLightboxIndex((prev) =>
      prev === null ? null : (prev - 1 + images.length) % images.length
    );
  }, [images.length]);

  const showNext = useCallback(() => {
    setLightboxIndex((prev) =>
      prev === null ? null : (prev + 1) % images.length
    );
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    };

    document.addEventListener("keydown", handleKeyDown);
    // Prevent background scroll while lightbox is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, showPrev, showNext]);

  if (!images || images.length === 0) return null;

  return (
    <>
      {/* Thumbnail grid */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 gap-2"
        role="list"
        aria-label="Venue photo gallery"
      >
        {images.map((src, index) => (
          <button
            key={src}
            role="listitem"
            onClick={() => openLightbox(index)}
            className="relative aspect-video overflow-hidden rounded-lg border border-border hover:border-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple transition-all group"
            aria-label={`View photo ${index + 1} of ${images.length}`}
          >
            <Image
              src={src}
              alt={`${alt} — photo ${index + 1}`}
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </button>
        ))}
      </div>

      {/* Lightbox overlay */}
      {lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-surface-overlay text-content hover:bg-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple"
            aria-label="Close photo viewer"
          >
            <X size={20} aria-hidden="true" />
          </button>

          {/* Prev button */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); showPrev(); }}
              className="absolute left-4 z-10 p-2 rounded-full bg-surface-overlay text-content hover:bg-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple"
              aria-label="Previous photo"
            >
              <ChevronLeft size={24} aria-hidden="true" />
            </button>
          )}

          {/* Image */}
          <div
            className="relative w-full max-w-4xl max-h-[85vh] mx-16 aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[lightboxIndex] ?? ""}
              alt={`${alt} photo ${lightboxIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
            <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm text-content-secondary bg-black/60 px-3 py-1 rounded-full">
              {lightboxIndex + 1} / {images.length}
            </p>
          </div>

          {/* Next button */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); showNext(); }}
              className="absolute right-4 z-10 p-2 rounded-full bg-surface-overlay text-content hover:bg-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple"
              aria-label="Next photo"
            >
              <ChevronRight size={24} aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </>
  );
}

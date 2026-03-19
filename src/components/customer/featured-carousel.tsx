"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ListingCard } from "./listing-card";
import type { ListingCardData } from "@/lib/listing-helpers";

interface FeaturedCarouselProps {
  listings: ListingCardData[];
}

/**
 * Horizontal scrolling carousel for featured/promoted listings.
 * Shows 3 full cards on desktop, 1.5 (peek) on mobile.
 * Arrow buttons are hidden at scroll boundaries.
 */
export function FeaturedCarousel({ listings }: FeaturedCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    // 4px tolerance to avoid floating-point edge cases
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState]);

  function scrollBy(direction: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.85;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  }

  return (
    /*
     * Outer wrapper provides padding room for the arrow buttons on sm+ screens.
     * overflow-hidden prevents the carousel from bleeding into the page gutter.
     * On mobile, the arrows are hidden (sm:flex) — users swipe naturally.
     */
    <div className="relative sm:px-6">
      {/* Left arrow — desktop only, only rendered when scrollable */}
      <button
        onClick={() => scrollBy("left")}
        aria-label="Scroll left"
        aria-hidden={!canScrollLeft}
        tabIndex={canScrollLeft ? 0 : -1}
        className={`hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-surface-card border border-border shadow-card text-content-secondary hover:text-neon-purple hover:border-neon-purple/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple ${canScrollLeft ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </button>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {listings.map((listing) => (
          /*
           * Card widths:
           *  - mobile:  ~80% of container (peek at next card)
           *  - sm:      50% (2 cards)
           *  - lg:      ~33% (3 cards)
           * Gap is 1rem (gap-4), subtracted from each slot.
           */
          <div
            key={listing.id}
            className="shrink-0 w-[calc(80%-0.8rem)] sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)]"
            style={{ scrollSnapAlign: "start" }}
          >
            <ListingCard listing={listing} variant="grid" />
          </div>
        ))}
      </div>

      {/* Right arrow — desktop only, only interactive when scrollable */}
      <button
        onClick={() => scrollBy("right")}
        aria-label="Scroll right"
        aria-hidden={!canScrollRight}
        tabIndex={canScrollRight ? 0 : -1}
        className={`hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-surface-card border border-border shadow-card text-content-secondary hover:text-neon-purple hover:border-neon-purple/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple ${canScrollRight ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </div>
  );
}

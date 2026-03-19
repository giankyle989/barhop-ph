"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";

import { CATEGORIES, REGIONS, getRegionBySlug } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";

// PHT is UTC+8
const PHT_OFFSET_MS = 8 * 60 * 60 * 1000;

function getPhtDayAndTime(): { phtDay: string; phtTime: string } {
  const now = new Date();
  const phtDate = new Date(now.getTime() + PHT_OFFSET_MS);
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const phtDay = days[phtDate.getUTCDay()];
  const hours = String(phtDate.getUTCHours()).padStart(2, "0");
  const minutes = String(phtDate.getUTCMinutes()).padStart(2, "0");
  return { phtDay, phtTime: `${hours}:${minutes}` };
}

const REGION_OPTIONS = REGIONS.map((r) => ({ value: r.slug, label: r.displayName }));

interface FilterSidebarProps {
  /** Optional extra class for the desktop sidebar container */
  className?: string;
}

export function FilterSidebar({ className = "" }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Mobile drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Read initial values from URL
  const selectedRegion = searchParams.get("region") ?? "";
  const selectedCity = searchParams.get("city") ?? "";
  const selectedCategories = searchParams.get("category")
    ? searchParams.get("category")!.split(",").filter(Boolean)
    : [];
  const openNow = searchParams.get("openNow") === "true";

  // Derive city options from the currently selected region
  const regionData = selectedRegion ? getRegionBySlug(selectedRegion) : undefined;
  const cityOptions = regionData
    ? regionData.cities.map((c) => ({ value: c.slug, label: c.name }))
    : [];

  // Build and push updated URL params, always resetting page to 1
  const pushParams = useCallback(
    (updates: Record<string, string | string[] | boolean | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      // Always reset page on filter change
      params.delete("page");

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "" || value === false) {
          params.delete(key);
        } else if (Array.isArray(value)) {
          if (value.length === 0) {
            params.delete(key);
          } else {
            params.set(key, value.join(","));
          }
        } else if (typeof value === "boolean") {
          params.set(key, "true");
        } else {
          params.set(key, value);
        }
      }

      router.push(`/listings?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    pushParams({ region: e.target.value || null, city: null });
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    pushParams({ city: e.target.value || null });
  };

  const handleCategoryToggle = (slug: string) => {
    const next = selectedCategories.includes(slug)
      ? selectedCategories.filter((c) => c !== slug)
      : [...selectedCategories, slug];
    pushParams({ category: next });
  };

  const handleOpenNowChange = (checked: boolean) => {
    if (checked) {
      const { phtDay, phtTime } = getPhtDayAndTime();
      pushParams({ openNow: true, phtDay, phtTime });
    } else {
      pushParams({ openNow: null, phtDay: null, phtTime: null });
    }
  };

  const handleClearAll = () => {
    router.push("/listings");
  };

  const hasActiveFilters =
    selectedRegion !== "" ||
    selectedCity !== "" ||
    selectedCategories.length > 0 ||
    openNow;

  // Close drawer on Escape key
  useEffect(() => {
    if (!drawerOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [drawerOpen]);

  // Trap focus and prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
      // Move focus to the drawer
      drawerRef.current?.focus();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const filterContent = (
    <div className="flex flex-col gap-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-content">Filters</h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs text-neon-purple hover:text-neon-purple/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple rounded"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Region */}
      <Select
        label="Region"
        value={selectedRegion}
        onChange={handleRegionChange}
        options={REGION_OPTIONS}
        placeholder="All Regions"
      />

      {/* City — only shown when a region is selected */}
      {selectedRegion && (
        <Select
          label="City"
          value={selectedCity}
          onChange={handleCityChange}
          options={cityOptions}
          placeholder="All Cities"
        />
      )}

      {/* Categories */}
      <fieldset>
        <legend className="block text-sm font-medium text-content-secondary mb-3">Category</legend>
        <div className="flex flex-col gap-2">
          {CATEGORIES.map((cat) => {
            const isChecked = selectedCategories.includes(cat.slug);
            const checkboxId = `cat-${cat.slug}`;
            return (
              <label
                key={cat.slug}
                htmlFor={checkboxId}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  id={checkboxId}
                  checked={isChecked}
                  onChange={() => handleCategoryToggle(cat.slug)}
                  className="h-4 w-4 rounded border-border bg-surface-card text-neon-purple focus:ring-2 focus:ring-neon-purple focus:ring-offset-2 focus:ring-offset-surface accent-neon-purple cursor-pointer"
                />
                <span
                  className={`text-sm transition-colors ${
                    isChecked ? "text-content" : "text-content-secondary group-hover:text-content"
                  }`}
                >
                  {cat.name}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Open Now */}
      <div>
        <p className="text-sm font-medium text-content-secondary mb-3">Availability</p>
        <Toggle
          label="Open Now"
          checked={openNow}
          onChange={handleOpenNowChange}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile: Filters trigger button (shown below md) */}
      <div className="md:hidden">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setDrawerOpen(true)}
          aria-expanded={drawerOpen}
          aria-controls="filter-drawer"
          className="flex items-center gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-neon-purple text-[10px] font-bold text-white">
              {selectedCategories.length +
                (selectedRegion ? 1 : 0) +
                (selectedCity ? 1 : 0) +
                (openNow ? 1 : 0)}
            </span>
          )}
        </Button>
      </div>

      {/* Mobile: Slide-out drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <div
            ref={drawerRef}
            id="filter-drawer"
            tabIndex={-1}
            className="absolute left-0 top-0 h-full w-80 max-w-[90vw] bg-surface-raised border-r border-border overflow-y-auto p-5 focus:outline-none"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-neon-purple" aria-hidden="true" />
                <span className="font-display font-semibold text-content">Filters</span>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded p-1 text-content-muted hover:text-content hover:bg-surface-overlay transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Reuse the filter form — hide the internal header since we have our own */}
            <div className="flex flex-col gap-6">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="self-start text-xs text-neon-purple hover:text-neon-purple/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple rounded"
                >
                  Clear All Filters
                </button>
              )}

              <Select
                label="Region"
                value={selectedRegion}
                onChange={handleRegionChange}
                options={REGION_OPTIONS}
                placeholder="All Regions"
              />

              {selectedRegion && (
                <Select
                  label="City"
                  value={selectedCity}
                  onChange={handleCityChange}
                  options={cityOptions}
                  placeholder="All Cities"
                />
              )}

              <fieldset>
                <legend className="block text-sm font-medium text-content-secondary mb-3">
                  Category
                </legend>
                <div className="flex flex-col gap-2">
                  {CATEGORIES.map((cat) => {
                    const isChecked = selectedCategories.includes(cat.slug);
                    const checkboxId = `drawer-cat-${cat.slug}`;
                    return (
                      <label
                        key={cat.slug}
                        htmlFor={checkboxId}
                        className="flex items-center gap-2.5 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          id={checkboxId}
                          checked={isChecked}
                          onChange={() => handleCategoryToggle(cat.slug)}
                          className="h-4 w-4 rounded border-border bg-surface-card accent-neon-purple cursor-pointer focus:ring-2 focus:ring-neon-purple focus:ring-offset-2 focus:ring-offset-surface"
                        />
                        <span
                          className={`text-sm transition-colors ${
                            isChecked
                              ? "text-content"
                              : "text-content-secondary group-hover:text-content"
                          }`}
                        >
                          {cat.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div>
                <p className="text-sm font-medium text-content-secondary mb-3">Availability</p>
                <Toggle label="Open Now" checked={openNow} onChange={handleOpenNowChange} />
              </div>
            </div>

            {/* Apply button — closes the drawer */}
            <div className="mt-8">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => setDrawerOpen(false)}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop: static sidebar (hidden on mobile) */}
      <aside
        className={`hidden md:block w-64 shrink-0 ${className}`}
        aria-label="Filter listings"
      >
        <div className="sticky top-6 rounded-card bg-surface-card border border-border p-5">
          {filterContent}
        </div>
      </aside>
    </>
  );
}

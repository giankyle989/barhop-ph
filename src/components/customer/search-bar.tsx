"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, X, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  buildListingUrl,
  getCityDisplayName,
  getPrimaryCategory,
} from "@/lib/listing-helpers";

interface SearchBarProps {
  defaultValue?: string;
  placeholder?: string;
  /** "navigate" updates URL params (browse page). "autocomplete" shows dropdown suggestions (home page). */
  mode?: "navigate" | "autocomplete";
}

interface SuggestionItem {
  id: string;
  name: string;
  slug: string;
  region: string;
  city: string;
  categories: string[];
}

const DEBOUNCE_MS = 300;

export function SearchBar({
  defaultValue = "",
  placeholder = "Search bars and clubs...",
  mode = "navigate",
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync with external defaultValue changes
  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  // Close suggestions on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Navigate mode: update URL search params
  const pushQuery = useCallback(
    (query: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (query.trim()) {
        params.set("q", query.trim());
      } else {
        params.delete("q");
      }
      params.delete("page");
      router.push(`?${params.toString()}`, { scroll: false });

      if (query.trim() && typeof window !== "undefined" && window.umami) {
        window.umami.track("search", { query: query.trim() });
      }
    },
    [router, searchParams]
  );

  // Autocomplete mode: fetch suggestions from API
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/listings?q=${encodeURIComponent(query.trim())}&limit=6`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.listings ?? []);
        setShowSuggestions(true);
      }
    } catch {
      // Silently fail — suggestions are non-critical
    } finally {
      setLoading(false);
    }

    if (query.trim() && typeof window !== "undefined" && window.umami) {
      window.umami.track("search", { query: query.trim() });
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setValue(next);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      if (mode === "navigate") {
        pushQuery(next);
      } else {
        fetchSuggestions(next);
      }
    }, DEBOUNCE_MS);
  };

  const handleClear = () => {
    setValue("");
    setSuggestions([]);
    setShowSuggestions(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (mode === "navigate") pushQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowSuggestions(false);
    }
    // Enter navigates to browse page with query in autocomplete mode
    if (e.key === "Enter" && mode === "autocomplete" && value.trim()) {
      setShowSuggestions(false);
      router.push(`/listings?q=${encodeURIComponent(value.trim())}`);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Search icon */}
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none z-10"
        size={16}
        aria-hidden="true"
      />
      <Input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (mode === "autocomplete" && suggestions.length > 0) setShowSuggestions(true);
        }}
        placeholder={placeholder}
        aria-label="Search listings"
        aria-expanded={mode === "autocomplete" ? showSuggestions : undefined}
        aria-haspopup={mode === "autocomplete" ? "listbox" : undefined}
        role={mode === "autocomplete" ? "combobox" : undefined}
        className="pl-9 pr-9"
      />
      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content transition-colors z-10"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}

      {/* Autocomplete dropdown */}
      {mode === "autocomplete" && showSuggestions && (
        <div
          role="listbox"
          className="absolute top-full left-0 right-0 z-50 mt-1 rounded-card bg-surface-card border border-border shadow-card overflow-hidden"
        >
          {loading && suggestions.length === 0 && (
            <div className="px-4 py-3 text-sm text-content-muted">Searching...</div>
          )}
          {!loading && suggestions.length === 0 && value.trim() && (
            <div className="px-4 py-3 text-sm text-content-muted">
              No results found.{" "}
              <Link
                href={`/listings?q=${encodeURIComponent(value.trim())}`}
                className="text-neon-purple hover:underline"
              >
                Browse all
              </Link>
            </div>
          )}
          {suggestions.map((item) => (
            <Link
              key={item.id}
              href={buildListingUrl(item.region, item.city, item.slug)}
              role="option"
              onClick={() => setShowSuggestions(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-surface-overlay transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-content truncate">{item.name}</p>
                <p className="text-xs text-content-muted flex items-center gap-1 mt-0.5">
                  <MapPin size={10} aria-hidden="true" />
                  {getCityDisplayName(item.city)}
                  <span className="mx-1">·</span>
                  {getPrimaryCategory(item.categories)}
                </p>
              </div>
            </Link>
          ))}
          {suggestions.length > 0 && (
            <Link
              href={`/listings?q=${encodeURIComponent(value.trim())}`}
              onClick={() => setShowSuggestions(false)}
              className="block px-4 py-2.5 text-xs text-center text-neon-purple hover:bg-surface-overlay transition-colors border-t border-border"
            >
              View all results →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

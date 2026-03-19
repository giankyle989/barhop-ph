"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  defaultValue?: string;
  placeholder?: string;
}

const DEBOUNCE_MS = 300;

export function SearchBar({
  defaultValue = "",
  placeholder = "Search bars and clubs...",
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync with external defaultValue changes (e.g., navigating back)
  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const pushQuery = useCallback(
    (query: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (query.trim()) {
        params.set("q", query.trim());
      } else {
        params.delete("q");
      }
      // Reset to first page when search changes
      params.delete("page");
      router.push(`?${params.toString()}`, { scroll: false });

      // Track search event if Umami is loaded
      if (query.trim() && typeof window !== "undefined" && window.umami) {
        window.umami.track("search", { query: query.trim() });
      }
    },
    [router, searchParams]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setValue(next);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      pushQuery(next);
    }, DEBOUNCE_MS);
  };

  const handleClear = () => {
    setValue("");
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    pushQuery("");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full">
      {/* Search icon — positioned left inside the input */}
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none"
        size={16}
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label="Search listings"
        className="pl-9 pr-9"
      />
      {/* Clear button — only visible when there is text */}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content transition-colors"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

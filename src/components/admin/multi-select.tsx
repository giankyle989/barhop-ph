"use client";

import { useRef, useState, useEffect, useId } from "react";
import { Badge } from "@/components/ui/badge";

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label?: string;
}

export function MultiSelect({ options, selected, onChange, label }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const labelId = useId();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleOption(option: string) {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  }

  function removeOption(option: string, e: React.MouseEvent) {
    e.stopPropagation();
    onChange(selected.filter((s) => s !== option));
  }

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label id={labelId} className="block text-sm font-medium text-content-secondary mb-1.5">
          {label}
        </label>
      )}
      {/* Trigger area: shows selected badges + opens dropdown */}
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-labelledby={label ? labelId : undefined}
        tabIndex={0}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
          if (e.key === "Escape") setIsOpen(false);
        }}
        className="w-full min-h-[42px] rounded bg-surface-card border border-border px-3 py-2 flex flex-wrap gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-neon-purple focus:border-transparent transition-colors hover:border-border-hover"
      >
        {selected.length === 0 && (
          <span className="text-content-muted text-sm self-center">Select options...</span>
        )}
        {selected.map((item) => (
          <Badge key={item} variant="neon" className="gap-1 pr-1">
            {item}
            <button
              type="button"
              aria-label={`Remove ${item}`}
              onClick={(e) => removeOption(item, e)}
              className="ml-0.5 rounded-full hover:bg-neon-purple/40 focus:outline-none focus:bg-neon-purple/40 p-0.5 transition-colors"
            >
              {/* X icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3" aria-hidden="true">
                <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
              </svg>
            </button>
          </Badge>
        ))}
        {/* Chevron */}
        <span className="ml-auto self-center text-content-muted">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} aria-hidden="true">
            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </span>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          role="listbox"
          aria-multiselectable="true"
          aria-labelledby={label ? labelId : undefined}
          className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded bg-surface-card border border-border shadow-card py-1"
        >
          {options.length === 0 && (
            <div className="px-3 py-2 text-sm text-content-muted">No options available</div>
          )}
          {options.map((option) => {
            const isChecked = selected.includes(option);
            return (
              <label
                key={option}
                role="option"
                aria-selected={isChecked}
                className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer hover:bg-surface-overlay transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleOption(option)}
                  className="w-4 h-4 rounded border-border bg-surface accent-neon-purple cursor-pointer focus:ring-neon-purple focus:ring-offset-surface"
                  aria-label={option}
                />
                <span className={isChecked ? "text-content" : "text-content-secondary"}>{option}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

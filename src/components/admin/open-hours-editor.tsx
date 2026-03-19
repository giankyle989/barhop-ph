"use client";

import { Toggle } from "@/components/ui/toggle";

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
] as const;

type DayKey = (typeof DAYS)[number]["key"];

type DayHours = { open: string; close: string } | null;

interface OpenHoursEditorProps {
  value: Record<string, DayHours>;
  onChange: (value: Record<string, DayHours>) => void;
}

const inputClass =
  "w-full rounded bg-surface-card border border-border px-3 py-2 text-content placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-neon-purple focus:border-transparent transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm";

export function OpenHoursEditor({ value, onChange }: OpenHoursEditorProps) {
  function handleTimeChange(day: DayKey, field: "open" | "close", time: string) {
    const current = value[day];
    onChange({
      ...value,
      [day]: {
        open: field === "open" ? time : (current?.open ?? ""),
        close: field === "close" ? time : (current?.close ?? ""),
      },
    });
  }

  function handleClosedToggle(day: DayKey, isClosed: boolean) {
    onChange({
      ...value,
      [day]: isClosed ? null : { open: "18:00", close: "02:00" },
    });
  }

  return (
    <div className="w-full rounded bg-surface-card border border-border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[120px_1fr_auto_1fr_auto] gap-3 px-4 py-2 border-b border-border bg-surface-raised">
        <span className="text-xs font-semibold text-content-muted uppercase tracking-wide">Day</span>
        <span className="text-xs font-semibold text-content-muted uppercase tracking-wide">Open</span>
        <span />
        <span className="text-xs font-semibold text-content-muted uppercase tracking-wide">Close</span>
        <span className="text-xs font-semibold text-content-muted uppercase tracking-wide">Closed</span>
      </div>

      {DAYS.map(({ key, label }, index) => {
        const dayValue = value[key] ?? null;
        const isClosed = dayValue === null;
        const isLast = index === DAYS.length - 1;

        return (
          <div
            key={key}
            className={`grid grid-cols-[120px_1fr_auto_1fr_auto] gap-3 items-center px-4 py-3 ${
              !isLast ? "border-b border-border" : ""
            } ${isClosed ? "opacity-60" : ""}`}
          >
            {/* Day label */}
            <span className="text-sm font-medium text-content">{label}</span>

            {/* Open time */}
            <input
              type="time"
              aria-label={`${label} open time`}
              value={dayValue?.open ?? ""}
              onChange={(e) => handleTimeChange(key, "open", e.target.value)}
              disabled={isClosed}
              className={inputClass}
            />

            {/* Separator */}
            <span className="text-content-muted text-sm select-none">–</span>

            {/* Close time */}
            <input
              type="time"
              aria-label={`${label} close time`}
              value={dayValue?.close ?? ""}
              onChange={(e) => handleTimeChange(key, "close", e.target.value)}
              disabled={isClosed}
              className={inputClass}
            />

            {/* Closed toggle */}
            <Toggle
              label="Closed"
              checked={isClosed}
              onChange={(checked) => handleClosedToggle(key, checked)}
            />
          </div>
        );
      })}
    </div>
  );
}

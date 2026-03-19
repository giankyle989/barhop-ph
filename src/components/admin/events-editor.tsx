"use client";

import { Button } from "@/components/ui/button";

interface EventItem {
  title: string;
  date?: string;
  recurrence?: string;
  description?: string;
}

interface EventsEditorProps {
  value: EventItem[];
  onChange: (value: EventItem[]) => void;
}

const RECURRENCE_OPTIONS = [
  { value: "", label: "Select recurrence..." },
  { value: "one-time", label: "One-time" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
] as const;

const inputClass =
  "w-full rounded bg-surface-raised border border-border px-3 py-2 text-content placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-neon-purple focus:border-transparent transition-colors text-sm";

const selectClass =
  "w-full rounded bg-surface-raised border border-border px-3 py-2 text-content focus:outline-none focus:ring-2 focus:ring-neon-purple focus:border-transparent transition-colors text-sm appearance-none cursor-pointer";

export function EventsEditor({ value, onChange }: EventsEditorProps) {
  function addEvent() {
    onChange([...value, { title: "", date: "", recurrence: "", description: "" }]);
  }

  function removeEvent(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function updateEvent(index: number, field: keyof EventItem, fieldValue: string) {
    const updated = value.map((entry, i) =>
      i === index ? { ...entry, [field]: fieldValue } : entry
    );
    onChange(updated);
  }

  return (
    <div className="w-full space-y-3">
      {value.map((event, index) => (
        <div
          key={index}
          className="rounded-card bg-surface-card border border-border p-4 space-y-3"
        >
          {/* Card header: title + remove button */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-content-muted uppercase tracking-wide">
              Event {index + 1}
            </span>
            <button
              type="button"
              aria-label={`Remove event ${index + 1}`}
              onClick={() => removeEvent(index)}
              className="p-1.5 rounded text-status-closed hover:bg-status-closed/10 focus:outline-none focus:ring-2 focus:ring-status-closed focus:ring-offset-1 focus:ring-offset-surface-card transition-colors shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Title */}
          <div>
            <label
              htmlFor={`event-title-${index}`}
              className="block text-xs font-medium text-content-secondary mb-1"
            >
              Title
            </label>
            <input
              id={`event-title-${index}`}
              type="text"
              placeholder="Event title"
              value={event.title}
              onChange={(e) => updateEvent(index, "title", e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Date + Recurrence row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor={`event-date-${index}`}
                className="block text-xs font-medium text-content-secondary mb-1"
              >
                Date
              </label>
              <input
                id={`event-date-${index}`}
                type="date"
                value={event.date ?? ""}
                onChange={(e) => updateEvent(index, "date", e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor={`event-recurrence-${index}`}
                className="block text-xs font-medium text-content-secondary mb-1"
              >
                Recurrence
              </label>
              <select
                id={`event-recurrence-${index}`}
                value={event.recurrence ?? ""}
                onChange={(e) => updateEvent(index, "recurrence", e.target.value)}
                className={selectClass}
              >
                {RECURRENCE_OPTIONS.map(({ value: optVal, label }) => (
                  <option key={optVal} value={optVal} className="bg-surface-card text-content">
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor={`event-description-${index}`}
              className="block text-xs font-medium text-content-secondary mb-1"
            >
              Description
            </label>
            <textarea
              id={`event-description-${index}`}
              rows={3}
              placeholder="Event description (optional)"
              value={event.description ?? ""}
              onChange={(e) => updateEvent(index, "description", e.target.value)}
              className={`${inputClass} resize-y`}
            />
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={addEvent}
        className="w-full border-dashed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5" aria-hidden="true">
          <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
        </svg>
        Add Event
      </Button>
    </div>
  );
}

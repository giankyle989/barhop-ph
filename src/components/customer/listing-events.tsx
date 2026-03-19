import { Badge } from "@/components/ui";

interface EventItem {
  title: string;
  date?: string;
  recurrence?: string;
  description?: string;
}

interface ListingEventsProps {
  events: EventItem[] | null;
}

export function ListingEvents({ events }: ListingEventsProps) {
  if (!events || events.length === 0) {
    return (
      <p className="text-sm text-content-muted py-2">No upcoming events</p>
    );
  }

  return (
    <ul className="space-y-3" aria-label="Upcoming events">
      {events.map((event, index) => (
        <li
          key={index}
          className="rounded-lg border border-border bg-surface-raised p-4"
        >
          <div className="flex flex-wrap items-start gap-2">
            <h4 className="flex-1 text-sm font-semibold text-content leading-snug">
              {event.title}
            </h4>

            {/* Date or recurrence badge */}
            {event.date && (
              <Badge variant="neon" className="flex-shrink-0">
                {event.date}
              </Badge>
            )}
            {!event.date && event.recurrence && (
              <Badge variant="default" className="flex-shrink-0">
                {event.recurrence}
              </Badge>
            )}
          </div>

          {/* Show recurrence alongside date when both are provided */}
          {event.date && event.recurrence && (
            <p className="mt-1 text-xs text-content-muted">{event.recurrence}</p>
          )}

          {event.description && (
            <p className="mt-2 text-xs text-content-secondary leading-relaxed">
              {event.description}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

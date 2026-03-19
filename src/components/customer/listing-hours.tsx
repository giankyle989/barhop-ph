"use client";

import { OpenClosedBadge } from "@/components/customer/open-closed-badge";

interface DayHours {
  open: string;
  close: string;
}

type OpenHoursMap = Record<string, DayHours | null>;

interface ListingHoursProps {
  openHours: OpenHoursMap | null;
}

const DAYS_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const DAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const DAYS_OF_WEEK = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

/** Returns the current day key in PHT (Asia/Manila) timezone. */
function getTodayKeyPHT(): string {
  const phtString = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Manila",
  });
  const phtDate = new Date(phtString);
  return DAYS_OF_WEEK[phtDate.getDay()] ?? "monday";
}

/** Formats a HH:MM time string to 12-hour display, e.g. "20:00" → "8:00 PM". */
function formatTime(time: string): string {
  const [hoursStr, minutesStr] = time.split(":");
  const hours = parseInt(hoursStr ?? "0", 10);
  const minutes = parseInt(minutesStr ?? "0", 10);

  // Handle special 24:00 end-of-day
  if (hours === 24) return "Midnight";

  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  const displayMinutes = minutes === 0 ? "" : `:${String(minutes).padStart(2, "0")}`;
  return `${displayHour}${displayMinutes} ${period}`;
}

export function ListingHours({ openHours }: ListingHoursProps) {
  const todayKey = getTodayKeyPHT();

  return (
    <div className="space-y-3">
      {/* Current open/closed status */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-content-secondary">Status:</span>
        <OpenClosedBadge openHours={openHours} />
      </div>

      {/* Hours table — overflow-x-auto in case the container is very narrow */}
      {openHours ? (
        <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="Opening hours">
          <tbody>
            {DAYS_ORDER.map((day) => {
              const hours = openHours[day] ?? null;
              const isToday = day === todayKey;

              return (
                <tr
                  key={day}
                  className={`border-b border-border last:border-b-0 ${
                    isToday ? "bg-neon-purple/10" : ""
                  }`}
                >
                  <td
                    className={`py-2 pr-4 font-medium ${
                      isToday ? "text-neon-purple" : "text-content-secondary"
                    }`}
                  >
                    {DAY_LABELS[day]}
                    {isToday && (
                      <span className="ml-1.5 text-xs font-normal text-neon-purple/70">
                        (today)
                      </span>
                    )}
                  </td>
                  <td
                    className={`py-2 text-right ${
                      isToday ? "text-content" : "text-content-secondary"
                    }`}
                  >
                    {hours ? (
                      <span>
                        {formatTime(hours.open)} – {formatTime(hours.close)}
                      </span>
                    ) : (
                      <span className="text-status-closed">Closed</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      ) : (
        <p className="text-sm text-content-muted">Hours not available</p>
      )}
    </div>
  );
}

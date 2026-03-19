"use client";

import { Badge } from "@/components/ui";

interface OpenClosedBadgeProps {
  openHours: Record<string, { open: string; close: string } | null> | null;
}

/** Converts a "HH:MM" time string to total minutes since midnight. */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  // Treat "24:00" as end-of-day (1440 minutes)
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

/**
 * Returns true if the venue is currently open, given its hours for today.
 * Handles overnight spans (close < open) such as open: "20:00", close: "02:00".
 */
function isCurrentlyOpen(
  hoursToday: { open: string; close: string } | null
): boolean {
  if (!hoursToday) return false;

  // Get current PHT time as a locale string, then parse hour/minute
  const phtString = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Manila",
  });
  const phtDate = new Date(phtString);

  const currentMinutes = phtDate.getHours() * 60 + phtDate.getMinutes();

  const openMinutes = timeToMinutes(hoursToday.open);
  const closeMinutes = timeToMinutes(hoursToday.close);

  if (closeMinutes > openMinutes) {
    // Same-day span: e.g., 18:00 → 23:00
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  } else {
    // Overnight span: e.g., 20:00 → 02:00 (next day)
    // Venue is open if current time is after open OR before close
    return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
  }
}

const DAYS_OF_WEEK = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export function OpenClosedBadge({ openHours }: OpenClosedBadgeProps) {
  if (!openHours) {
    return <Badge variant="closed">Closed</Badge>;
  }

  const phtString = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Manila",
  });
  const phtDate = new Date(phtString);
  const todayKey = DAYS_OF_WEEK[phtDate.getDay()];

  // todayKey will always be defined since phtDate.getDay() is 0–6
  const hoursToday = openHours[todayKey!] ?? null;
  const open = isCurrentlyOpen(hoursToday);

  return open ? (
    <Badge variant="open">Open</Badge>
  ) : (
    <Badge variant="closed">Closed</Badge>
  );
}

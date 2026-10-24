/**
 * Standards-based "Add to Calendar" builders (Google, Outlook, .ics).
 * Pure functions — no network, no secrets. Callers pass only the fields that
 * belong on a calendar event; customer contact details and amounts never do.
 */

export interface CalendarEvent {
  /** Stable id used for the .ics UID so re-adding updates instead of duplicating. */
  uid: string;
  title: string;
  start: Date;
  end: Date;
  location?: string | null;
  description?: string | null;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** 20261024T153000Z — UTC, so every calendar converts to the viewer's zone (DST-safe). */
export function toUtcStamp(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

export function googleCalendarUrl(e: CalendarEvent): string {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${toUtcStamp(e.start)}/${toUtcStamp(e.end)}`,
  });
  if (e.location) p.set("location", e.location);
  if (e.description) p.set("details", e.description);
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

export function outlookCalendarUrl(e: CalendarEvent): string {
  const p = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: e.title,
    startdt: e.start.toISOString(),
    enddt: e.end.toISOString(),
  });
  if (e.location) p.set("location", e.location);
  if (e.description) p.set("body", e.description);
  return `https://outlook.live.com/calendar/0/deeplink/compose?${p.toString()}`;
}

/** RFC 5545 text escaping. */
const esc = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

/** Fold lines longer than 75 octets per RFC 5545. */
const fold = (line: string) => {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    out.push(rest.slice(0, 74));
    rest = " " + rest.slice(74);
  }
  out.push(rest);
  return out.join("\r\n");
};

export function buildIcs(e: CalendarEvent, now: Date = new Date()): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Loumilab//Orders//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.uid}@orders.loumilab.com`,
    `DTSTAMP:${toUtcStamp(now)}`,
    `DTSTART:${toUtcStamp(e.start)}`,
    `DTEND:${toUtcStamp(e.end)}`,
    `SUMMARY:${esc(e.title)}`,
  ];
  if (e.location) lines.push(`LOCATION:${esc(e.location)}`);
  if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** Industry-aware noun for a scheduled job. */
export function bookingNoun(industrySlug?: string | null): string {
  const s = (industrySlug ?? "").toLowerCase();
  if (/(food|cater|bak|restaurant)/.test(s)) return "Catering event";
  if (/(beauty|salon|spa|barber|personal)/.test(s)) return "Appointment";
  if (/(photo|creative|studio)/.test(s)) return "Session";
  if (/(professional|consult|legal|account)/.test(s)) return "Consultation";
  if (/(home|trade|clean|repair|service|plumb|electric)/.test(s)) return "Service visit";
  return "Appointment";
}

export const DEFAULT_DURATION_MIN = 60;

/** Build an event for a scheduled job. Returns null when no date is set. */
export function jobCalendarEvent(job: {
  id: string;
  title: string;
  scheduled_for: string | null;
  scheduled_window?: string | null;
  service_address?: string | null;
  businessName: string;
  industrySlug?: string | null;
  durationMin?: number;
}): CalendarEvent | null {
  if (!job.scheduled_for) return null;
  const start = new Date(job.scheduled_for);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + (job.durationMin ?? DEFAULT_DURATION_MIN) * 60_000);
  return {
    uid: `job-${job.id}`,
    title: `${bookingNoun(job.industrySlug)}: ${job.title} — ${job.businessName}`,
    start,
    end,
    location: job.service_address || null,
    description: job.scheduled_window ? `Arrival window: ${job.scheduled_window}` : null,
  };
}

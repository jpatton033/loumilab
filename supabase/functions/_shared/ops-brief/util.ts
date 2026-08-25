import type { BriefSettings, Metric, Section } from "./types.ts";

/** Money is always integer cents — never floats. */
export const formatMoney = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatInt = (n: number) => n.toLocaleString("en-US");

export const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Percentage movement between two counts. Returns undefined when the baseline
 * is zero or too small to be meaningful — a jump from 0 to 1 is not "+100%".
 */
export const pctChange = (current: number, previous: number): number | undefined => {
  if (previous <= 0) return undefined;
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

export const metric = (
  label: string,
  value: string,
  opts: { current?: number; previous?: number; positiveIsGood?: boolean } = {},
): Metric => {
  const delta =
    opts.current !== undefined && opts.previous !== undefined
      ? pctChange(opts.current, opts.previous)
      : undefined;
  return {
    label,
    value,
    delta,
    deltaLabel: delta === undefined ? undefined : `${delta > 0 ? "+" : ""}${delta}% vs prior period`,
    positiveIsGood: opts.positiveIsGood ?? true,
  };
};

/** A section whose underlying capability does not exist yet. */
export const unavailableSection = (key: string, title: string, note: string): Section => ({
  key,
  title,
  status: "unavailable",
  note,
});

export const notMonitoredSection = (key: string, title: string, note: string): Section => ({
  key,
  title,
  status: "not_monitored",
  note,
});

export const isSectionEnabled = (settings: BriefSettings, key: string) =>
  settings.sections?.[key] !== false;

export const isModuleEnabled = (settings: BriefSettings, module: string) =>
  module === "platform" || settings.modules?.[module] !== false;

export const threshold = (settings: BriefSettings, key: string, fallback: number) => {
  const value = settings.thresholds?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
};

/** Formats an ISO timestamp in the configured timezone, for email display. */
export const formatWhen = (iso: string | null | undefined, timezone: string) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      timeZone: timezone,
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return new Date(iso).toISOString();
  }
};

export const formatDateLabel = (date: Date, timezone: string) => {
  try {
    return date.toLocaleDateString("en-US", {
      timeZone: timezone,
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return date.toISOString().slice(0, 10);
  }
};

/** Calendar date (YYYY-MM-DD) in a given timezone. */
export const zonedDateKey = (date: Date, timezone: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return parts;
};

/** Wall-clock hour and minute in a given timezone. */
export const zonedTime = (date: Date, timezone: string) => {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const [h, m] = fmt.format(date).split(":");
  return { hour: Number(h), minute: Number(m) };
};

export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

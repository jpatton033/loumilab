/**
 * Loumilab Daily Operations Brief — shared types.
 *
 * The snapshot is the single source of truth for a report: it is stored on the
 * report row so historical briefs never re-compute against current data, and
 * the renderer only ever reads from it. Nothing in the renderer may invent a
 * number that is not present here.
 */

export type SectionStatus = "live" | "unavailable" | "not_monitored";

export type Severity = "critical" | "important" | "review" | "normal";

export type HealthState = "operational" | "degraded" | "issue" | "not_monitored";

export interface Metric {
  label: string;
  value: string;
  /** Percentage or absolute movement vs the comparison period, if computable. */
  delta?: number;
  deltaLabel?: string;
  /** true when a rising number is good (used for colouring). */
  positiveIsGood?: boolean;
}

export interface Row {
  label: string;
  value: string;
  note?: string;
}

export interface ListItem {
  title: string;
  meta?: string;
  detail?: string;
  linkPath?: string;
  linkLabel?: string;
  severity?: Severity;
}

export interface ActionItem {
  severity: Severity;
  title: string;
  detail?: string;
  system: string;
  detectedAt?: string;
  recommendedAction: string;
  linkPath?: string;
}

export interface ChangeLine {
  direction: "up" | "down" | "flat" | "warn" | "ok";
  text: string;
}

export interface HealthLine {
  name: string;
  state: HealthState;
  note?: string;
}

export interface Section {
  key: string;
  title: string;
  status: SectionStatus;
  /** Explains an unavailable / not-monitored state, or adds context when live. */
  note?: string;
  /** Collapsed one-liner used instead of empty tables on quiet days. */
  emptyLine?: string;
  metrics?: Metric[];
  rows?: Row[];
  items?: ListItem[];
  text?: string;
  linkPath?: string;
  linkLabel?: string;
}

export interface BriefSnapshot {
  version: 1;
  generatedAt: string;
  reportDate: string;
  /** Human date used in the subject and header, rendered in the settings timezone. */
  reportDateLabel: string;
  window: { start: string; end: string; label: string };
  comparison: { start: string; end: string };
  executive: { metrics: Metric[]; summary: string };
  actions: ActionItem[];
  changes: ChangeLine[];
  sections: Section[];
  watch: string[];
  health: HealthLine[];
  /** Sections switched off in Super Admin settings, recorded for transparency. */
  disabledSections: string[];
}

export interface BriefSettings {
  id: string;
  enabled: boolean;
  delivery_hour: number;
  delivery_minute: number;
  timezone: string;
  recipients: string[];
  reporting_window: "previous_24h" | "previous_calendar_day" | "custom";
  custom_window_hours: number;
  sections: Record<string, boolean>;
  modules: Record<string, boolean>;
  thresholds: Record<string, number>;
  immediate_alerts: Record<string, boolean>;
}

export interface CollectorContext {
  db: SupabaseLike;
  settings: BriefSettings;
  now: Date;
  window: { start: Date; end: Date; label: string };
  /** Immediately preceding window of equal length, for day-over-day movement. */
  previous: { start: Date; end: Date };
  /** Start of the trailing 7-day baseline used for average comparisons. */
  baselineStart: Date;
  /** First instant of the current month, in UTC. */
  monthStart: Date;
  /** Collected action items — collectors push genuine issues here. */
  actions: ActionItem[];
  /** Collected "what changed" lines. */
  changes: ChangeLine[];
  /** Collected "watch today" candidates. */
  watch: string[];
  /** Collected health signals. */
  health: HealthLine[];
}

/** Minimal shape of the Supabase client the collectors need. */
// deno-lint-ignore no-explicit-any
export type SupabaseLike = any;

export interface Collector {
  key: string;
  title: string;
  /** Product module this collector belongs to; disabled modules skip it. */
  module: "website" | "consulting" | "knowledge" | "orders" | "platform";
  collect(ctx: CollectorContext): Promise<Section>;
}

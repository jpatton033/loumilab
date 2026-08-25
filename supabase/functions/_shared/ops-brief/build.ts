import { collectors } from "./collectors/index.ts";
import type { ActionItem, BriefSettings, BriefSnapshot, ChangeLine, CollectorContext, HealthLine, Section } from "./types.ts";
import { formatDateLabel, formatInt, isModuleEnabled, isSectionEnabled, metric } from "./util.ts";

const SEVERITY_RANK: Record<ActionItem["severity"], number> = {
  critical: 0,
  important: 1,
  review: 2,
  normal: 3,
};

export interface WindowSpec {
  start: Date;
  end: Date;
  label: string;
}

/** Resolves the reporting window from settings, in the configured timezone. */
export function resolveWindow(settings: BriefSettings, now: Date): WindowSpec {
  if (settings.reporting_window === "previous_calendar_day") {
    // Midnight boundaries of yesterday in the configured timezone.
    const key = new Intl.DateTimeFormat("en-CA", {
      timeZone: settings.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
    const localMidnightUtc = zonedMidnightUtc(key, settings.timezone);
    const start = new Date(localMidnightUtc.getTime() - 24 * 3600_000);
    return { start, end: localMidnightUtc, label: "previous_calendar_day" };
  }

  const hours = settings.reporting_window === "custom" ? settings.custom_window_hours : 24;
  return {
    start: new Date(now.getTime() - hours * 3600_000),
    end: now,
    label: settings.reporting_window === "custom" ? `custom_${hours}h` : "previous_24h",
  };
}

/** UTC instant of local midnight for a YYYY-MM-DD key in a timezone. */
function zonedMidnightUtc(dateKey: string, timezone: string): Date {
  const guess = new Date(`${dateKey}T00:00:00Z`);
  // Offset of that timezone at the guessed instant, resolved by formatting back.
  const local = new Date(guess.toLocaleString("en-US", { timeZone: timezone }));
  const offsetMs = guess.getTime() - local.getTime();
  return new Date(guess.getTime() + offsetMs);
}

/** Builds a full snapshot. Never fabricates data — collectors decide their own status. */
export async function buildSnapshot(
  // deno-lint-ignore no-explicit-any
  db: any,
  settings: BriefSettings,
  now: Date,
  window: WindowSpec,
): Promise<BriefSnapshot> {
  const spanMs = window.end.getTime() - window.start.getTime();
  const previous = { start: new Date(window.start.getTime() - spanMs), end: window.start };
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const ctx: CollectorContext = {
    db,
    settings,
    now,
    window,
    previous,
    baselineStart: new Date(window.end.getTime() - 7 * 24 * 3600_000),
    monthStart,
    actions: [],
    changes: [],
    watch: [],
    health: [],
  };

  const sections: Section[] = [];
  const disabledSections: string[] = [];

  for (const collector of collectors) {
    if (!isSectionEnabled(settings, collector.key) || !isModuleEnabled(settings, collector.module)) {
      disabledSections.push(collector.key);
      continue;
    }
    try {
      sections.push(await collector.collect(ctx));
    } catch (err) {
      // A broken collector must not silently vanish from the brief.
      sections.push({
        key: collector.key,
        title: collector.title,
        status: "unavailable",
        note: `This section could not be generated: ${(err as Error).message}`.slice(0, 240),
      });
      ctx.actions.push({
        severity: "important",
        title: `Daily Brief section failed — ${collector.title}`,
        detail: (err as Error).message.slice(0, 200),
        system: "Daily Brief generation",
        recommendedAction: "Review the brief generation logs; the underlying data query is failing.",
        linkPath: "/admin/reports/daily-brief",
      });
    }
  }

  const actions = [...ctx.actions].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
  const changes = dedupeChanges(ctx.changes);
  const health = ctx.health;

  const executive = buildExecutive(sections, actions, changes);
  const watch = buildWatch(ctx.watch, actions, sections);

  return {
    version: 1,
    generatedAt: now.toISOString(),
    reportDate: new Intl.DateTimeFormat("en-CA", {
      timeZone: settings.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now),
    reportDateLabel: formatDateLabel(now, settings.timezone),
    window: { start: window.start.toISOString(), end: window.end.toISOString(), label: window.label },
    comparison: { start: previous.start.toISOString(), end: previous.end.toISOString() },
    executive,
    actions,
    changes,
    sections,
    watch,
    health,
    disabledSections,
  };
}

const dedupeChanges = (changes: ChangeLine[]) => {
  const seen = new Set<string>();
  return changes.filter((c) => {
    if (seen.has(c.text)) return false;
    seen.add(c.text);
    return true;
  });
};

/** Executive metrics and a summary sentence built strictly from collected data. */
function buildExecutive(sections: Section[], actions: ActionItem[], changes: ChangeLine[]) {
  const byKey = new Map(sections.map((s) => [s.key, s]));
  const pick = (key: string, label: string) =>
    byKey.get(key)?.metrics?.find((m) => m.label === label);

  const metrics = [
    pick("merchants", "New merchants") ?? metric("New merchants", "—"),
    pick("leads", "Custom requests") ?? metric("Custom requests", "—"),
    pick("leads", "Website inquiries") ?? metric("Website inquiries", "—"),
    pick("knowledge", "Article views") ?? metric("Article views", "—"),
    pick("payments", "Webhook events") ?? metric("Stripe events", "—"),
    { label: "Items requiring attention", value: formatInt(actions.length), positiveIsGood: false },
  ];

  const parts: string[] = [];
  const merchantsNew = numeric(pick("merchants", "New merchants")?.value);
  const leadsNew = numeric(pick("leads", "Custom requests")?.value);
  const inquiriesNew = numeric(pick("leads", "Website inquiries")?.value);
  const views = numeric(pick("knowledge", "Article views")?.value);

  if (merchantsNew !== null) {
    parts.push(
      merchantsNew > 0
        ? `${merchantsNew} new merchant${merchantsNew === 1 ? "" : "s"} registered for Loumilab Orders`
        : "No new merchants registered",
    );
  }
  const pipeline = (leadsNew ?? 0) + (inquiriesNew ?? 0);
  parts.push(
    pipeline > 0
      ? `${pipeline} new opportunit${pipeline === 1 ? "y" : "ies"} arrived through the website`
      : "no new inbound opportunities were received",
  );
  if (views !== null) {
    parts.push(
      views > 0
        ? `the Knowledge Center recorded ${formatInt(views)} article view${views === 1 ? "" : "s"}`
        : "the Knowledge Center saw no reads",
    );

  }

  const criticals = actions.filter((a) => a.severity === "critical").length;
  parts.push(
    criticals > 0
      ? `${criticals} critical item${criticals === 1 ? "" : "s"} require immediate attention`
      : actions.length > 0
        ? `${actions.length} item${actions.length === 1 ? "" : "s"} need review`
        : "nothing currently requires your attention",
  );

  const summary = `${capitalize(parts.join(", "))}. Customer checkout and plan subscriptions are not live yet, so order, revenue and payout figures are reported as unavailable rather than estimated.${
    changes.length === 0 ? " No notable changes were recorded in this period." : ""
  }`;

  return { metrics, summary };
}

const numeric = (value: string | undefined) => {
  if (!value) return null;
  const n = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
};

const capitalize = (s: string) => (s.length === 0 ? s : s[0].toUpperCase() + s.slice(1));

/** 2–5 genuinely useful things to watch, derived from real signals only. */
function buildWatch(candidates: string[], actions: ActionItem[], sections: Section[]): string[] {
  const out: string[] = [...candidates];

  for (const action of actions.slice(0, 3)) {
    const line = `${action.title} — ${action.recommendedAction}`;
    if (!out.includes(line)) out.push(line);
  }

  const unavailable = sections.filter((s) => s.status === "unavailable").length;
  if (unavailable > 0 && out.length < 5) {
    out.push(
      `${unavailable} brief section${unavailable === 1 ? "" : "s"} stay unavailable until customer checkout, subscriptions and analytics are live.`,
    );
  }

  return out.slice(0, 5);
}

export function buildSubject(snapshot: BriefSnapshot): string {
  const urgent = snapshot.actions.some((a) => a.severity === "critical" || a.severity === "important");
  const dateLabel = snapshot.reportDateLabel.replace(/^[A-Za-z]+,\s*/, "");
  return `${urgent ? "⚠ Action Required — " : ""}Loumilab Daily Brief — ${dateLabel}`;
}

export function countBySeverity(snapshot: BriefSnapshot) {
  return {
    critical: snapshot.actions.filter((a) => a.severity === "critical").length,
    important: snapshot.actions.filter((a) => a.severity === "important").length,
    total: snapshot.actions.length,
  };
}

export const healthSummary = (health: HealthLine[]) =>
  health.filter((h) => h.state === "issue").length;

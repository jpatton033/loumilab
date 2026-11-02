import { describe, expect, it } from "vitest";
import { websiteTrafficCollector } from "../../supabase/functions/_shared/ops-brief/collectors/traffic";
import type { CollectorContext } from "../../supabase/functions/_shared/ops-brief/types";

async function collect(paths: string[], previousPaths: string[] = []) {
  const data = [
    ...paths.map((path, i) => ({ path, session_id: `current-${i}`, created_at: "2026-11-01T12:00:00Z", referrer_source: "direct", device: "desktop" })),
    ...previousPaths.map((path, i) => ({ path, session_id: `previous-${i}`, created_at: "2026-10-31T12:00:00Z", referrer_source: "direct", device: "desktop" })),
  ];
  const query = {
    select: () => query,
    gte: () => query,
    lt: () => query,
    limit: async () => ({ data, error: null }),
  };
  const ctx: CollectorContext = {
    db: { from: () => query },
    settings: {
      id: "test", enabled: true, delivery_hour: 8, delivery_minute: 0,
      timezone: "UTC", recipients: [], reporting_window: "previous_calendar_day",
      custom_window_hours: 24, sections: {}, modules: {}, thresholds: {}, immediate_alerts: {},
    },
    now: new Date("2026-11-02T13:31:00Z"),
    window: { start: new Date("2026-11-01T00:00:00Z"), end: new Date("2026-11-02T00:00:00Z"), label: "Yesterday" },
    previous: { start: new Date("2026-10-31T00:00:00Z"), end: new Date("2026-11-01T00:00:00Z") },
    baselineStart: new Date("2026-10-26T00:00:00Z"), monthStart: new Date("2026-11-01T00:00:00Z"),
    actions: [], changes: [], watch: [], health: [],
  };
  return websiteTrafficCollector.collect(ctx);
}

describe("The Dot. brief traffic", () => {
  it("excludes unsubscribe and non-content pages from daily newsletter totals without changing website totals", async () => {
    const section = await collect(["/the-dot", "/the-dot/issue/hello", "/the-dot/unsubscribe?token=example", "/the-dot/other"]);
    expect(section.metrics?.find(m => m.label === "Page views")?.value).toBe("4");
    expect(section.metrics?.find(m => m.label === "The Dot. views")?.value).toBe("2");
    expect(section.rows?.find(r => r.label === "The Dot. visits")?.value).toBe("2");
    expect(section.rows?.find(r => r.label === "The Dot. hub vs issues")?.value).toBe("1 hub · 1 issues");
  });

  it("groups real issues by slug after stripping query, fragment and trailing slash", async () => {
    const section = await collect(["/the-dot/issue/hello", "/the-dot/issue/hello/?utm_source=email", "/the-dot/issue/hello#story", "/the-dot/?source=email", "/the-dot/issue/", "/the-dot/issue/hello/extra"]);
    expect(section.rows?.find(r => r.label === "The Dot. top issues")?.value).toBe("hello (3)");
    expect(section.metrics?.find(m => m.label === "The Dot. views")?.value).toBe("4");
  });

  it("excludes unsubscribes from previous-period comparisons and Monday weekly totals", async () => {
    const section = await collect(["/the-dot/issue/hello", "/the-dot/unsubscribe"], ["/the-dot/issue/earlier", "/the-dot/unsubscribe"]);
    expect(section.metrics?.find(m => m.label === "The Dot. views")?.delta).toBe(0);
    expect(section.rows?.find(r => r.label === "7-day The Dot. views")?.value).toBe("2 (new vs prior week)");
    expect(section.rows?.find(r => r.label === "7-day The Dot. visits")?.value).toBe("2 (new)");
    expect(section.rows?.find(r => r.label === "7-day The Dot. top issues")?.value).toBe("hello (1), earlier (1)");
  });

  it("reports no newsletter reads when only unsubscribe pages were visited", async () => {
    const section = await collect(["/the-dot/unsubscribe", "/the-dot/unsubscribe/?token=example"]);
    expect(section.metrics?.find(m => m.label === "The Dot. views")?.value).toBe("0");
    expect(section.rows?.find(r => r.label === "The Dot.")?.value).toBe("No The Dot. views in this period.");
    expect(section.rows?.find(r => r.label === "7-day The Dot. top issues")?.value).toBe("—");
  });
});
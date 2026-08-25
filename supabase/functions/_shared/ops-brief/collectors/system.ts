import type { Collector, HealthLine, ListItem, Row } from "../types.ts";
import { formatInt, formatWhen } from "../util.ts";

/**
 * System Health. A component is only reported Operational when an actual signal
 * exists; everything else is explicitly Not Monitored rather than assumed good.
 */
export const systemCollector: Collector = {
  key: "system",
  title: "System Health",
  module: "platform",
  async collect(ctx) {
    const { db, settings, window } = ctx;

    // --- Database: a real probe, not an assumption.
    let dbState: HealthLine["state"] = "operational";
    let dbNote = "Probe query succeeded";
    try {
      const { error } = await db.from("ops_brief_settings").select("id").limit(1);
      if (error) throw error;
    } catch (err) {
      dbState = "issue";
      dbNote = `Probe failed: ${(err as Error).message}`.slice(0, 160);
    }

    // --- Website: live HTTP check of the public site.
    let siteState: HealthLine["state"] = "not_monitored";
    let siteNote = "No response";
    try {
      const res = await fetch("https://loumilab.com/", { method: "GET", redirect: "follow" });
      siteState = res.ok ? "operational" : "issue";
      siteNote = `HTTP ${res.status}`;
    } catch (err) {
      siteState = "issue";
      siteNote = `Unreachable: ${(err as Error).message}`.slice(0, 120);
    }

    // --- Scheduled jobs: from our own run log.
    const { data: runs } = await db
      .from("ops_job_runs")
      .select("job, status, started_at, finished_at, error")
      .order("started_at", { ascending: false })
      .limit(50);
    const recentRuns = runs ?? [];
    const failedRuns = recentRuns.filter((r: { status: string }) => r.status === "failed");
    const jobState: HealthLine["state"] =
      recentRuns.length === 0 ? "not_monitored" : failedRuns.length > 0 ? "degraded" : "operational";

    // --- Email: from our own delivery log.
    const { data: deliveries } = await db
      .from("ops_brief_deliveries")
      .select("status, error, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    const recentDeliveries = deliveries ?? [];
    const failedDeliveries = recentDeliveries.filter((d: { status: string }) => d.status === "failed");
    const emailState: HealthLine["state"] =
      recentDeliveries.length === 0 ? "not_monitored" : failedDeliveries.length > 0 ? "degraded" : "operational";

    const health: HealthLine[] = [
      { name: "Website (loumilab.com)", state: siteState, note: siteNote },
      { name: "Database", state: dbState, note: dbNote },
      { name: "Authentication", state: "not_monitored", note: "No auth health signal connected" },
      {
        name: "Loumilab Orders",
        state: "not_monitored",
        note: "Customer checkout is not live yet — nothing to monitor",
      },
      { name: "Email delivery", state: emailState, note: failedDeliveries.length > 0 ? `${failedDeliveries.length} recent failures` : undefined },
      {
        name: "Scheduled jobs",
        state: jobState,
        note: recentRuns[0] ? `Last run ${formatWhen(recentRuns[0].started_at, settings.timezone)}` : undefined,
      },
      { name: "Storage", state: "not_monitored", note: "No storage telemetry connected" },
      { name: "APIs & performance", state: "not_monitored", note: "No APM integration connected" },
    ];

    for (const line of health) ctx.health.push(line);

    if (siteState === "issue") {
      ctx.actions.push({
        severity: "critical",
        title: "loumilab.com did not respond successfully",
        detail: siteNote,
        system: "Website",
        recommendedAction: "Check hosting and DNS immediately; the public site may be down for visitors.",
      });
    }
    if (dbState === "issue") {
      ctx.actions.push({
        severity: "critical",
        title: "Database probe failed",
        detail: dbNote,
        system: "Database",
        recommendedAction: "Investigate backend availability; app reads and writes are likely failing.",
      });
    }

    const jobRows: Row[] = [
      { label: "Scheduled runs logged", value: formatInt(recentRuns.length) },
      { label: "Failed runs", value: formatInt(failedRuns.length) },
      { label: "Brief deliveries failed", value: formatInt(failedDeliveries.length) },
    ];

    const items: ListItem[] = failedRuns.slice(0, 5).map((r: { job: string; error: string | null; started_at: string }) => ({
      title: `Scheduled job failed — ${r.job}`,
      meta: formatWhen(r.started_at, settings.timezone),
      detail: (r.error ?? "No error recorded").slice(0, 180),
      severity: "important" as const,
    }));

    for (const r of failedRuns.slice(0, 3)) {
      if (new Date(r.started_at) >= window.start) {
        ctx.actions.push({
          severity: "important",
          title: `Scheduled job failed — ${r.job}`,
          detail: (r.error ?? "").slice(0, 180),
          system: "Scheduled jobs",
          detectedAt: r.started_at,
          recommendedAction: "Review the job run log and re-run once the cause is resolved.",
          linkPath: "/admin/reports/daily-brief",
        });
      }
    }

    return {
      key: "system",
      title: "System Health",
      status: "live",
      rows: jobRows,
      items,
      emptyLine: items.length === 0 ? "All monitored systems reported healthy." : undefined,
    };
  },
};

/**
 * Development Activity. Deployment, migration and build telemetry is not
 * exposed to the app runtime, so this is honestly reported as unmonitored
 * rather than guessed at.
 */
export const developmentCollector: Collector = {
  key: "development",
  title: "Development Activity",
  module: "platform",
  collect: () =>
    Promise.resolve({
      key: "development",
      title: "Development Activity",
      status: "not_monitored",
      note:
        "Deployment, migration and build telemetry is not available to the application runtime. Connecting a deployment webhook would make this section live. No secrets or environment values are ever included here.",
    }),
};

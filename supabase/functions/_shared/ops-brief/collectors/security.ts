import type { Collector, ListItem, Row } from "../types.ts";
import { formatInt, formatWhen } from "../util.ts";

/**
 * Security. Only operationally relevant signals, and never any credential,
 * token, key or unnecessary personal data — the email links back to Super Admin
 * for detail instead of carrying it.
 */
export const securityCollector: Collector = {
  key: "security",
  title: "Security",
  module: "platform",
  async collect(ctx) {
    const { db, window, settings } = ctx;
    const from = window.start.toISOString();
    const to = window.end.toISOString();

    const [rateLimits, userRoles, adminRoles, alerts] = await Promise.all([
      db.from("rate_limits").select("key, request_count, window_start").gte("window_start", from).lt("window_start", to),
      db.from("user_roles").select("role, created_at").gte("created_at", from).lt("created_at", to),
      db.from("admin_roles").select("role, created_at").gte("created_at", from).lt("created_at", to),
      db
        .from("ops_alerts")
        .select("category, severity, title, detail, detected_at, resolved_at")
        .gte("detected_at", from)
        .lt("detected_at", to)
        .order("detected_at", { ascending: false }),
    ]);

    const limits = rateLimits.data ?? [];
    // A rate-limit row only matters when it actually throttled something.
    const throttled = limits.filter((r: { request_count: number }) => r.request_count > 1);
    const abusive = limits.filter((r: { request_count: number }) => r.request_count >= 10);

    const roleGrants = (userRoles.data ?? []).length;
    const adminGrants = (adminRoles.data ?? []).length;
    const securityAlerts = (alerts.data ?? []).filter((a: { category: string }) =>
      /security|auth|compromise/i.test(a.category),
    );

    const rows: Row[] = [
      { label: "Rate-limit windows with repeat traffic", value: formatInt(throttled.length) },
      { label: "Endpoints hit heavily (10+ in a window)", value: formatInt(abusive.length) },
      { label: "New user role assignments", value: formatInt(roleGrants) },
      { label: "Admin role changes", value: formatInt(adminGrants) },
      { label: "Security alerts raised", value: formatInt(securityAlerts.length) },
      { label: "Failed sign-in monitoring", value: "Not monitored", note: "Auth log streaming is not connected" },
    ];

    const items: ListItem[] = [
      ...abusive.slice(0, 5).map((r: { key: string; request_count: number; window_start: string }) => ({
        // The rate-limit key prefix identifies the surface, not the person.
        title: `Elevated request volume — ${String(r.key).split(":")[0]}`,
        meta: `${formatInt(r.request_count)} requests in one window`,
        detail: formatWhen(r.window_start, settings.timezone),
        severity: "review" as const,
      })),
      ...securityAlerts.slice(0, 5).map((a: { title: string; category: string; detected_at: string; resolved_at: string | null }) => ({
        title: a.title,
        meta: `${a.category}${a.resolved_at ? " · resolved" : " · open"}`,
        detail: formatWhen(a.detected_at, settings.timezone),
        severity: "important" as const,
      })),
    ];

    if (adminGrants > 0) {
      ctx.actions.push({
        severity: "important",
        title: `${adminGrants} admin role change${adminGrants === 1 ? "" : "s"} recorded`,
        system: "Access control",
        recommendedAction: "Confirm each elevated role was granted intentionally.",
        linkPath: "/admin/audit-log",
      });
      ctx.changes.push({ direction: "warn", text: `${adminGrants} admin role change${adminGrants === 1 ? "" : "s"}` });
    }

    if (securityAlerts.length === 0) {
      ctx.changes.push({ direction: "ok", text: "No critical security issues detected" });
    }

    return {
      key: "security",
      title: "Security",
      status: "live",
      rows,
      items,
      emptyLine:
        items.length === 0 && roleGrants === 0 && adminGrants === 0
          ? "No security events, permission changes or abuse signals were recorded."
          : undefined,
      note: "Sign-in failure and suspicious-login reporting requires auth log streaming, which is not connected.",
    };
  },
};

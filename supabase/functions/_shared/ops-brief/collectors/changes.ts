import type { Collector, ListItem } from "../types.ts";
import { formatWhen } from "../util.ts";

/**
 * Website Changes — content, hero, plan and pricing edits made during the
 * reporting window, reconstructed from the audit log and the `updated_at`
 * columns of the content tables that back the public site.
 */
export const websiteChangesCollector: Collector = {
  key: "website_changes",
  title: "Website Changes",
  module: "website",
  async collect(ctx) {
    const { db, window, settings } = ctx;
    const from = window.start.toISOString();
    const to = window.end.toISOString();

    const [{ data: heroRows }, { data: sectionRows }, { data: articleRows }, { data: planRows }, { data: auditRows }] =
      await Promise.all([
        db.from("hero_products").select("name, is_active, created_at, updated_at").gte("updated_at", from).lt("updated_at", to),
        db.from("kc_sections").select("title, created_at, updated_at").gte("updated_at", from).lt("updated_at", to),
        db
          .from("kc_articles")
          .select("title, status, created_at, updated_at")
          .gte("updated_at", from)
          .lt("updated_at", to),
        db.from("orders_plans").select("name, slug, created_at, updated_at").gte("updated_at", from).lt("updated_at", to),
        db
          .from("audit_logs")
          .select("action, target_type, actor_email, created_at")
          .gte("created_at", from)
          .lt("created_at", to)
          .order("created_at", { ascending: false }),
      ]);

    const audits = auditRows ?? [];
    const actorFor = (targetType: string) =>
      audits.find((a: { target_type: string | null }) => a.target_type === targetType)?.actor_email ?? "Super Admin";

    const items: ListItem[] = [];

    for (const h of heroRows ?? []) {
      const created = new Date(h.created_at) >= window.start;
      items.push({
        title: `Hero showcase ${created ? "slide added" : "slide updated"} — ${h.name}`,
        meta: `Homepage hero · ${h.is_active ? "active" : "inactive"}`,
        detail: `${actorFor("hero_product")} · ${formatWhen(h.updated_at, settings.timezone)}`,
        linkPath: "/admin/hero",
        linkLabel: "View hero",
      });
    }

    for (const a of articleRows ?? []) {
      const created = new Date(a.created_at) >= window.start;
      items.push({
        title: `Knowledge article ${created ? "created" : "updated"} — ${a.title}`,
        meta: `Resources · ${a.status}`,
        detail: `${actorFor("kc_article")} · ${formatWhen(a.updated_at, settings.timezone)}`,
        linkPath: "/admin/knowledge",
        linkLabel: "View article",
      });
    }

    for (const s of sectionRows ?? []) {
      items.push({
        title: `Knowledge section updated — ${s.title}`,
        meta: "Resources navigation",
        detail: `${actorFor("kc_section")} · ${formatWhen(s.updated_at, settings.timezone)}`,
        linkPath: "/admin/knowledge",
        linkLabel: "View sections",
      });
    }

    for (const p of planRows ?? []) {
      items.push({
        title: `Orders plan updated — ${p.name}`,
        meta: "Pricing page",
        detail: `${actorFor("orders_plan")} · ${formatWhen(p.updated_at, settings.timezone)}`,
        linkPath: "/admin/plans",
        linkLabel: "View plans",
        severity: "review",
      });
    }

    if (items.length > 0) {
      ctx.changes.push({ direction: "flat", text: `${items.length} website content change${items.length === 1 ? "" : "s"}` });
    }

    return {
      key: "website_changes",
      title: "Website Changes",
      status: "live",
      items,
      emptyLine: items.length === 0 ? "No significant website changes detected." : undefined,
      note:
        "Covers content, hero, knowledge and plan records. Route, SEO metadata, redirect and structured-data edits ship with code and appear under Development Activity.",
    };
  },
};

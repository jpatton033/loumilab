import type { Collector, ListItem, Row } from "../types.ts";
import { formatInt, formatWhen, metric, threshold } from "../util.ts";

/**
 * Loumilab Opportunities — custom development requests and website inquiries.
 * Orders is meant to feed the studio's project pipeline, so this section is
 * treated as a first-class revenue signal, not an afterthought.
 */
export const leadsCollector: Collector = {
  key: "leads",
  title: "Leads & Opportunities",
  module: "consulting",
  async collect(ctx) {
    const { db, window, previous, settings, baselineStart } = ctx;

    const [{ data: leadRows }, { data: inquiryRows }] = await Promise.all([
      db
        .from("custom_project_leads")
        .select("id, business_name, contact_name, build_goal, budget_range, launch_timeframe, status, created_at")
        .gte("created_at", baselineStart.toISOString())
        .order("created_at", { ascending: false }),
      db
        .from("contact_submissions")
        .select("id, name, email, company, budget, status, created_at")
        .gte("created_at", baselineStart.toISOString())
        .order("created_at", { ascending: false }),
    ]);

    const leads = leadRows ?? [];
    const inquiries = inquiryRows ?? [];

    const within = <T extends { created_at: string }>(list: T[], from: Date, to: Date) =>
      list.filter((r) => new Date(r.created_at) >= from && new Date(r.created_at) < to);

    const newLeads = within(leads, window.start, window.end);
    const prevLeads = within(leads, previous.start, previous.end);
    const newInquiries = within(inquiries, window.start, window.end);
    const prevInquiries = within(inquiries, previous.start, previous.end);

    const items: ListItem[] = [
      ...newLeads.map((l: {
        business_name: string;
        build_goal: string;
        budget_range: string | null;
        status: string;
        created_at: string;
      }) => ({
        title: l.business_name,
        meta: `Custom project · ${l.status}`,
        detail: [l.build_goal, l.budget_range ? `Budget: ${l.budget_range}` : null, formatWhen(l.created_at, settings.timezone)]
          .filter(Boolean)
          .join(" · "),
        linkPath: "/admin/custom-projects",
        linkLabel: "View lead",
      })),
      ...newInquiries.map((i: { name: string; company: string | null; budget: string | null; status: string; created_at: string }) => ({
        title: i.company ? `${i.name} — ${i.company}` : i.name,
        meta: `Website inquiry · ${i.status}`,
        detail: [i.budget ? `Budget: ${i.budget}` : null, formatWhen(i.created_at, settings.timezone)]
          .filter(Boolean)
          .join(" · "),
        linkPath: "/admin/inquiries",
        linkLabel: "View inquiry",
      })),
    ];

    // Ageing pipeline is a real action item — an uncontacted lead is lost revenue.
    const leadHours = threshold(settings, "lead_uncontacted_hours", 48);
    const inquiryHours = threshold(settings, "inquiry_unread_hours", 48);
    const staleLeads = leads.filter(
      (l: { status: string; created_at: string }) =>
        l.status === "new" && ctx.now.getTime() - new Date(l.created_at).getTime() > leadHours * 3600_000,
    );
    const staleInquiries = inquiries.filter(
      (i: { status: string; created_at: string }) =>
        i.status === "new" && ctx.now.getTime() - new Date(i.created_at).getTime() > inquiryHours * 3600_000,
    );

    for (const l of staleLeads.slice(0, 5)) {
      ctx.actions.push({
        severity: "important",
        title: `Custom project lead uncontacted — ${l.business_name}`,
        detail: `Submitted ${formatWhen(l.created_at, settings.timezone)} and still marked new.`,
        system: "Loumilab Opportunities",
        detectedAt: l.created_at,
        recommendedAction: "Reach out and move the lead to Contacted or Discovery.",
        linkPath: "/admin/custom-projects",
      });
    }
    if (staleInquiries.length > 0) {
      ctx.actions.push({
        severity: "review",
        title: `${staleInquiries.length} website inquir${staleInquiries.length === 1 ? "y" : "ies"} unread for over ${inquiryHours}h`,
        system: "Website — Contact",
        detectedAt: staleInquiries[0].created_at,
        recommendedAction: "Reply or mark the inquiries as read so the pipeline stays accurate.",
        linkPath: "/admin/inquiries",
      });
    }

    if (newLeads.length > 0) {
      ctx.changes.push({
        direction: "up",
        text: `${newLeads.length} new custom project request${newLeads.length === 1 ? "" : "s"}`,
      });
    }
    if (newInquiries.length > 0) {
      ctx.changes.push({
        direction: "up",
        text: `${newInquiries.length} new website inquir${newInquiries.length === 1 ? "y" : "ies"}`,
      });
    }

    const rows: Row[] = [
      { label: "New custom project requests", value: formatInt(newLeads.length) },
      { label: "New website inquiries", value: formatInt(newInquiries.length) },
      { label: "Open leads awaiting first contact", value: formatInt(staleLeads.length) },
      { label: "Unread inquiries", value: formatInt(staleInquiries.length) },
    ];

    return {
      key: "leads",
      title: "Leads & Opportunities",
      status: "live",
      metrics: [
        metric("Custom requests", formatInt(newLeads.length), {
          current: newLeads.length,
          previous: prevLeads.length,
        }),
        metric("Website inquiries", formatInt(newInquiries.length), {
          current: newInquiries.length,
          previous: prevInquiries.length,
        }),
      ],
      rows,
      items: items.slice(0, 10),
      emptyLine: items.length === 0 ? "No new leads or inquiries in this period." : undefined,
      linkPath: "/admin/custom-projects",
      linkLabel: "View pipeline",
    };
  },
};

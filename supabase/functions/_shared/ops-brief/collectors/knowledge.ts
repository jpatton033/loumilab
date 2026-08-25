import type { Collector, ListItem, Row } from "../types.ts";
import { formatInt, formatWhen, metric } from "../util.ts";

/** Knowledge Center publishing and readership. */
export const knowledgeCollector: Collector = {
  key: "knowledge",
  title: "Knowledge Center",
  module: "knowledge",
  async collect(ctx) {
    const { db, window, previous, settings } = ctx;

    const [{ data: articleRows }, { data: viewRows }, { data: subscriberRows }] = await Promise.all([
      db
        .from("kc_articles")
        .select("id, title, slug, status, view_count, published_at, updated_at, created_at")
        .order("updated_at", { ascending: false })
        .limit(200),
      db
        .from("kc_article_views")
        .select("article_id, created_at")
        .gte("created_at", ctx.baselineStart.toISOString()),
      db.from("newsletter_subscribers").select("created_at").gte("created_at", ctx.baselineStart.toISOString()),
    ]);

    const articles = articleRows ?? [];
    const views = viewRows ?? [];
    const subscribers = subscriberRows ?? [];

    const within = <T extends { created_at: string }>(list: T[], from: Date, to: Date) =>
      list.filter((r) => new Date(r.created_at) >= from && new Date(r.created_at) < to);

    const viewsNow = within(views, window.start, window.end);
    const viewsPrev = within(views, previous.start, previous.end);
    const subsNow = within(subscribers, window.start, window.end);
    const subsPrev = within(subscribers, previous.start, previous.end);

    const publishedNow = articles.filter(
      (a: { status: string; published_at: string | null }) =>
        a.status === "published" && a.published_at && new Date(a.published_at) >= window.start && new Date(a.published_at) < window.end,
    );
    const updatedNow = articles.filter(
      (a: { updated_at: string; published_at: string | null }) =>
        new Date(a.updated_at) >= window.start &&
        new Date(a.updated_at) < window.end &&
        !(a.published_at && new Date(a.published_at) >= window.start),
    );

    const titleById = new Map(articles.map((a: { id: string; title: string }) => [a.id, a.title]));
    const viewsByArticle = new Map<string, number>();
    for (const v of viewsNow) viewsByArticle.set(v.article_id, (viewsByArticle.get(v.article_id) ?? 0) + 1);
    const topRead = [...viewsByArticle.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

    const items: ListItem[] = [
      ...publishedNow.map((a: { title: string; slug: string; published_at: string }) => ({
        title: a.title,
        meta: "Published",
        detail: formatWhen(a.published_at, settings.timezone),
        linkPath: "/admin/knowledge",
        linkLabel: "View article",
      })),
      ...updatedNow.slice(0, 5).map((a: { title: string; updated_at: string; status: string }) => ({
        title: a.title,
        meta: `Updated · ${a.status}`,
        detail: formatWhen(a.updated_at, settings.timezone),
        linkPath: "/admin/knowledge",
        linkLabel: "View article",
      })),
    ];

    const rows: Row[] = [
      { label: "Articles published this period", value: formatInt(publishedNow.length) },
      { label: "Articles updated this period", value: formatInt(updatedNow.length) },
      { label: "Total published", value: formatInt(articles.filter((a: { status: string }) => a.status === "published").length) },
      { label: "Drafts", value: formatInt(articles.filter((a: { status: string }) => a.status === "draft").length) },
      { label: "Article views", value: formatInt(viewsNow.length) },
      { label: "New newsletter subscribers", value: formatInt(subsNow.length) },
    ];
    for (const [id, count] of topRead) {
      rows.push({ label: `Most read — ${titleById.get(id) ?? "Article"}`, value: `${formatInt(count)} views` });
    }

    if (publishedNow.length > 0) {
      ctx.changes.push({
        direction: "up",
        text: `${publishedNow.length} knowledge article${publishedNow.length === 1 ? "" : "s"} published`,
      });
    }

    return {
      key: "knowledge",
      title: "Knowledge Center",
      status: "live",
      metrics: [
        metric("Article views", formatInt(viewsNow.length), { current: viewsNow.length, previous: viewsPrev.length }),
        metric("Published", formatInt(publishedNow.length)),
        metric("New subscribers", formatInt(subsNow.length), { current: subsNow.length, previous: subsPrev.length }),
      ],
      rows,
      items,
      emptyLine:
        publishedNow.length === 0 && updatedNow.length === 0 && viewsNow.length === 0
          ? "No Knowledge Center publishing or readership activity."
          : undefined,
      note: "Knowledge-to-Orders and Knowledge-to-consultation conversion needs funnel tracking, which is not yet instrumented.",
      linkPath: "/admin/knowledge",
      linkLabel: "Open Knowledge Center",
    };
  },
};

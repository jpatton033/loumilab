import type { Collector } from "../types.ts";
import { formatInt, metric } from "../util.ts";

type View = { created_at: string; path: string; referrer_source: string; session_id: string; device: string };
type Row = { label: string; value: string };

const DAY = 24 * 3600_000;

function summarize(views: View[]) {
  const sessions = new Map<string, View[]>();
  for (const v of views) {
    const list = sessions.get(v.session_id) ?? [];
    list.push(v);
    sessions.set(v.session_id, list);
  }
  const count = (key: (v: View) => string, rows: View[]) => {
    const m = new Map<string, number>();
    for (const v of rows) m.set(key(v), (m.get(key(v)) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const firsts = [...sessions.values()].map((l) => l.sort((a, b) => a.created_at.localeCompare(b.created_at))[0]);
  const bounced = [...sessions.values()].filter((l) => l.length === 1).length;
  const mobile = firsts.filter((v) => v.device === "mobile").length;
  const sawPath = (p: string) => [...sessions.values()].filter((l) => l.some((v) => v.path === p || v.path.startsWith(p + "?"))).length;
  return {
    views: views.length,
    visits: sessions.size,
    mobilePct: sessions.size ? Math.round((mobile / sessions.size) * 100) : 0,
    bouncePct: sessions.size ? Math.round((bounced / sessions.size) * 100) : 0,
    pages: count((v) => v.path, views),
    sources: count((v) => v.referrer_source, firsts),
    orders: sawPath("/orders"),
    getStarted: sawPath("/orders/get-started"),
  };
}

const top = (list: [string, number][], n = 3) => list.slice(0, n).map(([k, c]) => `${k} (${c})`).join(", ") || "—";

/** Website & Growth — first-party page views; deep 7-day trends on Mondays. */
export const websiteTrafficCollector: Collector = {
  key: "website",
  title: "Website & Growth",
  module: "website",
  async collect(ctx) {
    const { db, window, previous, settings, now } = ctx;
    const weekday = new Intl.DateTimeFormat("en-US", { timeZone: settings.timezone, weekday: "short" }).format(now);
    const deep = weekday === "Mon";
    const from = new Date(Math.min(previous.start.getTime(), deep ? window.end.getTime() - 14 * DAY : Infinity));

    const { data, error } = await db
      .from("site_page_views")
      .select("created_at, path, referrer_source, session_id, device")
      .gte("created_at", from.toISOString())
      .lt("created_at", window.end.toISOString())
      .limit(50000);
    if (error) throw error;
    const all = (data ?? []) as View[];
    const inRange = (s: Date, e: Date) => all.filter((v) => { const t = new Date(v.created_at); return t >= s && t < e; });

    const cur = summarize(inRange(window.start, window.end));
    const prev = summarize(inRange(previous.start, previous.end));

    const rows: Row[] = [
      { label: "Visits", value: formatInt(cur.visits) },
      { label: "Page views", value: formatInt(cur.views) },
      { label: "Mobile share", value: `${cur.mobilePct}%` },
      { label: "Single-page visits", value: `${cur.bouncePct}%` },
      { label: "Top pages", value: top(cur.pages) },
      { label: "Top sources", value: top(cur.sources) },
    ];

    if (deep) {
      const wEnd = window.end;
      const w = summarize(inRange(new Date(wEnd.getTime() - 7 * DAY), wEnd));
      const pw = summarize(inRange(new Date(wEnd.getTime() - 14 * DAY), new Date(wEnd.getTime() - 7 * DAY)));
      const delta = (a: number, b: number) => (b ? `${a >= b ? "+" : ""}${Math.round(((a - b) / b) * 100)}%` : "new");
      rows.push(
        { label: "Weekly deep dive — 7-day visits", value: `${formatInt(w.visits)} (${delta(w.visits, pw.visits)} vs prior week)` },
        { label: "7-day page views", value: `${formatInt(w.views)} (${delta(w.views, pw.views)})` },
        { label: "7-day single-page visits", value: `${w.bouncePct}% (prior ${pw.bouncePct}%)` },
        { label: "7-day top sources", value: top(w.sources, 5) },
        { label: "7-day top pages", value: top(w.pages, 5) },
        { label: "Orders funnel (7 days)", value: `${w.orders} visits saw Orders → ${w.getStarted} opened Get Started` },
      );
      if (w.orders >= 20 && w.getStarted / w.orders < 0.05) {
        ctx.actions.push({
          severity: "review",
          title: "Few Orders visitors start store setup",
          detail: `${w.getStarted} of ${w.orders} visits that saw Orders opened Get Started this week.`,
          system: "Website — Traffic",
          detectedAt: wEnd.toISOString(),
          recommendedAction: "Review the Orders page call to action, especially on mobile.",
          linkPath: "/orders",
        });
      }
    }

    if (cur.visits > 0) ctx.changes.push({ direction: cur.visits >= prev.visits ? "up" : "down", text: `${cur.visits} website visits` });

    return {
      key: "website",
      title: "Website & Growth",
      status: "live",
      metrics: [
        metric("Visits", formatInt(cur.visits), { current: cur.visits, previous: prev.visits }),
        metric("Page views", formatInt(cur.views), { current: cur.views, previous: prev.views }),
      ],
      rows,
      emptyLine: cur.views === 0 ? "No website visits recorded in this period." : undefined,
      note: deep
        ? "Includes the weekly deep dive (sent Mondays). Anonymous first-party counts; admin pages and previews excluded."
        : "Anonymous first-party counts; the weekly deep dive arrives Mondays.",
    };
  },
};

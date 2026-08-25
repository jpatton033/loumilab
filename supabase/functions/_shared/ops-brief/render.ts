import type { ActionItem, BriefSnapshot, ChangeLine, HealthLine, Section, Severity } from "./types.ts";
import { escapeHtml, formatWhen } from "./util.ts";

const APP_ORIGIN = "https://loumilab.com";

/** Loumilab brand tokens, inlined because email clients cannot load the app CSS. */
const t = {
  charcoal: "#18181b",
  text: "#1c1c20",
  muted: "#63636e",
  faint: "#8a8a95",
  accent: "#0d7ff2",
  border: "#e6e7eb",
  soft: "#f6f7f9",
  bg: "#ffffff",
  critical: "#c0392b",
  important: "#d97706",
  review: "#b8860b",
  ok: "#15803d",
  font: "'Helvetica Neue', Helvetica, Arial, sans-serif",
};

const SEVERITY_COLOR: Record<Severity, string> = {
  critical: t.critical,
  important: t.important,
  review: t.review,
  normal: t.ok,
};

const HEALTH_COLOR: Record<HealthLine["state"], string> = {
  operational: t.ok,
  degraded: t.important,
  issue: t.critical,
  not_monitored: "#b3b3bb",
};

/** Coloured status dot. Uses a styled glyph, not an emoji, so it renders
 * identically in Outlook, Gmail and Apple Mail. */
const dot = (color: string) =>
  `<span style="color:${color};font-size:15px;line-height:1;">&#9679;</span>`;

const SEVERITY_DOT: Record<Severity, string> = {
  critical: dot(t.critical),
  important: dot(t.important),
  review: dot(t.review),
  normal: dot(t.ok),
};

const HEALTH_DOT: Record<HealthLine["state"], string> = {
  operational: dot(HEALTH_COLOR.operational),
  degraded: dot(HEALTH_COLOR.degraded),
  issue: dot(HEALTH_COLOR.issue),
  not_monitored: dot(HEALTH_COLOR.not_monitored),
};


const DIRECTION: Record<ChangeLine["direction"], string> = {
  up: "↑",
  down: "↓",
  flat: "→",
  warn: "⚠",
  ok: "✓",
};

const link = (path?: string) => (path ? `${APP_ORIGIN}${path}` : undefined);

const sectionHeading = (title: string) => `
  <tr><td style="padding:34px 0 12px;">
    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${t.faint};">${escapeHtml(title)}</p>
    <div style="height:1px;background-color:${t.border};margin-top:10px;"></div>
  </td></tr>`;

const paragraph = (text: string, color = t.muted) =>
  `<tr><td style="padding:2px 0 6px;"><p style="margin:0;font-size:13px;line-height:1.6;color:${color};">${escapeHtml(text)}</p></td></tr>`;

/** Metric tiles: two per row so they never overflow on a phone. */
const metricGrid = (metrics: BriefSnapshot["executive"]["metrics"]) => {
  const cells = metrics.map((m) => {
    const deltaColor =
      m.delta === undefined ? t.faint : (m.delta >= 0) === (m.positiveIsGood ?? true) ? t.ok : t.critical;
    const arrow = m.delta === undefined ? "" : m.delta > 0 ? "↑" : m.delta < 0 ? "↓" : "→";
    return `
      <td width="50%" style="padding:6px;" valign="top">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border:1px solid ${t.border};border-radius:12px;background-color:${t.bg};">
          <tr><td style="padding:14px 16px;">
            <p style="margin:0;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${t.faint};">${escapeHtml(m.label)}</p>
            <p style="margin:6px 0 0;font-size:24px;font-weight:600;color:${t.text};line-height:1.1;">${escapeHtml(m.value)}</p>
            ${
              m.delta === undefined
                ? `<p style="margin:4px 0 0;font-size:11px;color:${t.faint};">&nbsp;</p>`
                : `<p style="margin:4px 0 0;font-size:11px;color:${deltaColor};">${arrow} ${Math.abs(m.delta)}% vs prior period</p>`
            }
          </td></tr>
        </table>
      </td>`;
  });

  const rows: string[] = [];
  for (let i = 0; i < cells.length; i += 2) {
    rows.push(`<tr>${cells[i]}${cells[i + 1] ?? '<td width="50%" style="padding:6px;"></td>'}</tr>`);
  }
  return `<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rows.join("")}</table></td></tr>`;
};

const actionBlock = (actions: ActionItem[], timezone: string) => {
  if (actions.length === 0) {
    return paragraph("Nothing requires Super Admin action right now.", t.ok);
  }
  return actions
    .map((a) => {
      const href = link(a.linkPath);
      return `
      <tr><td style="padding:8px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border:1px solid ${t.border};border-left:3px solid ${SEVERITY_COLOR[a.severity]};border-radius:12px;background-color:${t.soft};">
          <tr><td style="padding:14px 16px;">
            <p style="margin:0;font-size:14px;font-weight:600;color:${t.text};">${SEVERITY_DOT[a.severity]} ${escapeHtml(a.title)}</p>
            ${a.detail ? `<p style="margin:6px 0 0;font-size:12px;line-height:1.6;color:${t.muted};">${escapeHtml(a.detail)}</p>` : ""}
            <p style="margin:8px 0 0;font-size:11px;color:${t.faint};">${escapeHtml(a.system)}${a.detectedAt ? ` · detected ${escapeHtml(formatWhen(a.detectedAt, timezone))}` : ""}</p>
            <p style="margin:6px 0 0;font-size:12px;line-height:1.6;color:${t.text};"><strong style="font-weight:600;">Recommended:</strong> ${escapeHtml(a.recommendedAction)}</p>
            ${href ? `<p style="margin:10px 0 0;"><a href="${href}" style="font-size:12px;font-weight:600;color:${t.accent};text-decoration:none;">View in Super Admin →</a></p>` : ""}
          </td></tr>
        </table>
      </td></tr>`;
    })
    .join("");
};

const changesBlock = (changes: ChangeLine[]) => {
  if (changes.length === 0) return paragraph("No notable movements were recorded in this period.");
  return `<tr><td style="padding:4px 0;">${changes
    .map(
      (c) =>
        `<p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:${t.text};">${DIRECTION[c.direction]} ${escapeHtml(c.text)}</p>`,
    )
    .join("")}</td></tr>`;
};

const rowsTable = (rows: NonNullable<Section["rows"]>) => `
  <tr><td style="padding:6px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${rows
        .map(
          (r) => `<tr>
            <td style="padding:7px 0;border-bottom:1px solid ${t.border};font-size:13px;color:${t.muted};">${escapeHtml(r.label)}${r.note ? `<span style="display:block;font-size:11px;color:${t.faint};">${escapeHtml(r.note)}</span>` : ""}</td>
            <td align="right" style="padding:7px 0;border-bottom:1px solid ${t.border};font-size:13px;font-weight:600;color:${t.text};white-space:nowrap;">${escapeHtml(r.value)}</td>
          </tr>`,
        )
        .join("")}
    </table>
  </td></tr>`;

const itemsList = (items: NonNullable<Section["items"]>, timezone: string) =>
  items
    .map((i) => {
      const href = link(i.linkPath);
      return `<tr><td style="padding:8px 0;border-bottom:1px solid ${t.border};">
        <p style="margin:0;font-size:13px;font-weight:600;color:${t.text};">${i.severity ? `${SEVERITY_DOT[i.severity]} ` : ""}${escapeHtml(i.title)}</p>
        ${i.meta ? `<p style="margin:3px 0 0;font-size:11px;letter-spacing:0.04em;color:${t.faint};">${escapeHtml(i.meta)}</p>` : ""}
        ${i.detail ? `<p style="margin:4px 0 0;font-size:12px;line-height:1.6;color:${t.muted};">${escapeHtml(i.detail)}</p>` : ""}
        ${href ? `<p style="margin:6px 0 0;"><a href="${href}" style="font-size:12px;font-weight:600;color:${t.accent};text-decoration:none;">${escapeHtml(i.linkLabel ?? "Open")} →</a></p>` : ""}
      </td></tr>`;
    })
    .join("");

const healthBlock = (health: HealthLine[]) => `
  <tr><td style="padding:6px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${health
        .map(
          (h) => `<tr>
            <td style="padding:6px 0;font-size:13px;color:${t.text};">${HEALTH_DOT[h.state]} ${escapeHtml(h.name)}</td>
            <td align="right" style="padding:6px 0;font-size:11px;color:${t.faint};">${escapeHtml(h.note ?? "")}</td>
          </tr>`,
        )
        .join("")}
    </table>
  </td></tr>`;

/** Renders one collected section, collapsing quiet ones to a single line. */
const renderSection = (section: Section, timezone: string) => {
  const parts: string[] = [sectionHeading(section.title)];

  if (section.status === "unavailable" || section.status === "not_monitored") {
    parts.push(
      paragraph(
        `${section.status === "unavailable" ? "Not yet available" : "Not monitored"} — ${section.note ?? ""}`,
        t.faint,
      ),
    );
    return parts.join("");
  }

  const hasBody =
    (section.metrics?.length ?? 0) > 0 || (section.rows?.length ?? 0) > 0 || (section.items?.length ?? 0) > 0;

  if (!hasBody && section.emptyLine) {
    parts.push(paragraph(section.emptyLine, t.muted));
    return parts.join("");
  }

  if (section.metrics?.length) parts.push(metricGrid(section.metrics));
  if (section.rows?.length) parts.push(rowsTable(section.rows));
  if (section.items?.length) {
    parts.push(
      `<tr><td style="padding:6px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${itemsList(section.items, timezone)}</table></td></tr>`,
    );
  } else if (section.emptyLine) {
    parts.push(paragraph(section.emptyLine, t.muted));
  }
  if (section.text) parts.push(paragraph(section.text));
  if (section.note) parts.push(paragraph(section.note, t.faint));
  if (section.linkPath) {
    parts.push(
      `<tr><td style="padding:8px 0 0;"><a href="${link(section.linkPath)}" style="font-size:12px;font-weight:600;color:${t.accent};text-decoration:none;">${escapeHtml(section.linkLabel ?? "Open in Super Admin")} →</a></td></tr>`,
    );
  }
  return parts.join("");
};

/** Full HTML brief. Table-based, single column, safe on iOS, Android and desktop clients. */
export function renderBriefHtml(snapshot: BriefSnapshot, timezone: string): string {
  const criticals = snapshot.actions.filter((a) => a.severity === "critical" || a.severity === "important");

  const body = `
    ${metricGrid(snapshot.executive.metrics)}
    ${paragraph(snapshot.executive.summary, t.text)}

    ${sectionHeading(criticals.length > 0 ? "Action Required" : "Action Required — All Clear")}
    ${actionBlock(snapshot.actions, timezone)}

    ${sectionHeading("What Changed")}
    ${changesBlock(snapshot.changes)}

    ${snapshot.sections.map((s) => renderSection(s, timezone)).join("")}

    ${sectionHeading("Monitored Systems")}
    ${healthBlock(snapshot.health)}

    ${sectionHeading("Watch Today")}
    ${
      snapshot.watch.length === 0
        ? paragraph("Nothing specific to monitor today.")
        : `<tr><td style="padding:4px 0;">${snapshot.watch
            .map((w) => `<p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:${t.text};">• ${escapeHtml(w)}</p>`)
            .join("")}</td></tr>`
    }

    <tr><td style="padding:28px 0 0;" align="center">
      <a href="${APP_ORIGIN}/admin/overview" style="display:inline-block;background-color:${t.charcoal};color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;padding:13px 26px;border-radius:999px;">Open Loumilab Super Admin</a>
    </td></tr>`;

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Loumilab Daily Brief</title></head>
<body style="margin:0;padding:32px 0;background-color:${t.soft};font-family:${t.font};-webkit-text-size-adjust:100%;">
  <div style="display:none;font-size:1px;color:${t.soft};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(snapshot.executive.summary.slice(0, 140))}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    <tr><td align="center" style="padding:0 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;border-collapse:separate;background-color:${t.bg};border:1px solid ${t.border};border-radius:16px;overflow:hidden;">
        <tr><td style="background-color:${t.charcoal};padding:30px 28px;">
          <p style="margin:0;color:#ffffff;font-size:17px;font-weight:700;letter-spacing:0.24em;">LOUMILAB<span style="color:${t.accent};">.</span></p>
          <p style="margin:12px 0 0;color:#ffffff;font-size:22px;font-weight:600;letter-spacing:-0.01em;">Daily Brief</p>
          <p style="margin:5px 0 0;color:rgba(255,255,255,0.62);font-size:12px;">${escapeHtml(snapshot.reportDateLabel)}</p>
        </td></tr>
        <tr><td style="padding:30px 28px 34px;">
          <p style="margin:0 0 18px;font-size:19px;font-weight:600;color:${t.text};">Good morning — here's your Loumilab brief</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            ${body}
          </table>
        </td></tr>
        <tr><td style="padding:18px 28px;background-color:${t.soft};border-top:1px solid ${t.border};text-align:center;">
          <p style="margin:0;font-size:11px;color:${t.muted};">Reporting window ${escapeHtml(formatWhen(snapshot.window.start, timezone))} → ${escapeHtml(formatWhen(snapshot.window.end, timezone))}</p>
          <p style="margin:6px 0 0;font-size:11px;color:${t.faint};">&copy; Loumilab &middot; <a href="${APP_ORIGIN}" style="color:${t.faint};text-decoration:none;">loumilab.com</a> &middot; internal operations report</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/** Plain-text alternative for clients that refuse HTML. */
export function renderBriefText(snapshot: BriefSnapshot): string {
  const lines: string[] = [
    `LOUMILAB DAILY BRIEF — ${snapshot.reportDateLabel}`,
    "",
    snapshot.executive.summary,
    "",
    "METRICS",
    ...snapshot.executive.metrics.map((m) => `  ${m.label}: ${m.value}`),
    "",
    "ACTION REQUIRED",
    ...(snapshot.actions.length === 0
      ? ["  Nothing requires action."]
      : snapshot.actions.map((a) => `  [${a.severity}] ${a.title} — ${a.recommendedAction}`)),
    "",
    "WHAT CHANGED",
    ...(snapshot.changes.length === 0 ? ["  No notable movements."] : snapshot.changes.map((c) => `  ${c.text}`)),
  ];

  for (const s of snapshot.sections) {
    lines.push("", s.title.toUpperCase());
    if (s.status !== "live") {
      lines.push(`  ${s.status === "unavailable" ? "Not yet available" : "Not monitored"} — ${s.note ?? ""}`);
      continue;
    }
    for (const r of s.rows ?? []) lines.push(`  ${r.label}: ${r.value}`);
    for (const i of s.items ?? []) lines.push(`  - ${i.title}${i.meta ? ` (${i.meta})` : ""}`);
    if ((s.rows?.length ?? 0) === 0 && (s.items?.length ?? 0) === 0 && s.emptyLine) lines.push(`  ${s.emptyLine}`);
  }

  lines.push("", "MONITORED SYSTEMS", ...snapshot.health.map((h) => `  ${h.name}: ${h.state}`));
  lines.push("", "WATCH TODAY", ...(snapshot.watch.length === 0 ? ["  Nothing specific."] : snapshot.watch.map((w) => `  - ${w}`)));
  lines.push("", `${APP_ORIGIN}/admin/overview`);

  return lines.join("\n");
}

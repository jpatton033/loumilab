/**
 * Loumilab branded email frame.
 *
 * Used for the in-app preview; the sending edge function keeps an identical
 * copy (`supabase/functions/_shared/admin-mail-frame.ts`) so what you preview
 * is what leaves the building. Keep the two in sync.
 */
export interface FrameOptions {
  bodyHtml: string;
  signatureHtml?: string;
  attachments?: { name: string; url: string; size: number }[];
}

const BLUE = "#0b72f3";
const CHARCOAL = "#18181b";
const MUTED = "#6b6f76";

export const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const buildBrandedEmail = ({ bodyHtml, signatureHtml, attachments }: FrameOptions): string => {
  const files = (attachments ?? []).filter((a) => a.url);
  const attachmentBlock = files.length
    ? `<div style="margin-top:28px;padding-top:18px;border-top:1px solid #e6e7ea">
         <p style="margin:0 0 10px;font-size:13px;font-weight:bold;color:${CHARCOAL}">Files</p>
         ${files
           .map(
             (f) =>
               `<p style="margin:0 0 6px;font-size:13px;color:${MUTED}"><a href="${f.url}" style="color:${BLUE};text-decoration:none">${f.name}</a> · ${formatBytes(
                 f.size,
               )}</p>`,
           )
           .join("")}
         <p style="margin:8px 0 0;font-size:12px;color:${MUTED}">Secure download links, valid for 30 days.</p>
       </div>`
    : "";

  const signatureBlock = signatureHtml?.trim()
    ? `<div style="margin-top:26px;font-size:14px;line-height:1.6;color:#3f4247">${signatureHtml}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en" dir="ltr"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="background-color:#ffffff;margin:0;padding:32px 16px;font-family:'Space Grotesk',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${CHARCOAL}">
  <div style="max-width:560px;margin:0 auto">
    <div style="border:1px solid #e6e7ea;border-radius:20px;padding:32px 28px;background-color:#ffffff">
      <p style="font-size:15px;font-weight:bold;letter-spacing:0.18em;text-transform:uppercase;color:${CHARCOAL};margin:0 0 24px">LOUMILAB<span style="color:${BLUE}">.</span></p>
      <div style="font-size:15px;line-height:1.65;color:#3f4247">${bodyHtml}</div>
      ${signatureBlock}
      ${attachmentBlock}
      <hr style="border:0;border-top:1px solid #e6e7ea;margin:28px 0 18px" />
      <p style="font-size:13px;line-height:1.6;color:${MUTED};margin:0">
        Loumilab · Design. Build. Innovate. Secure.<br />
        Reply to this email or write to <a href="mailto:hello@loumilab.com" style="color:${BLUE};text-decoration:none">hello@loumilab.com</a>.
      </p>
    </div>
  </div>
</body></html>`;
};

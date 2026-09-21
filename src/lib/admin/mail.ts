import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Loumilab Mail — the Super Admin branded email desk.
 *
 * Drafts, templates, signatures and the sent log all live in staff-only tables.
 * Actual sending always happens in the `admin-email-send` edge function, which
 * re-verifies the caller's staff role and renders the branded frame server-side.
 */

export const MAIL_BUCKET = "admin-email";
export const MAX_ATTACHMENT_TOTAL = 25 * 1024 * 1024;
const SIGNED_URL_TTL = 60 * 60 * 24 * 30; // 30 days

export type MailStatus = "draft" | "queued" | "sent" | "failed" | "bounced" | "suppressed" | "complained";

export interface MailMessage {
  id: string;
  direction: string;
  thread_id: string;
  to_addresses: string[];
  cc_addresses: string[];
  bcc_addresses: string[];
  subject: string;
  body_html: string;
  body_text: string;
  display_name: string;
  status: MailStatus;
  error_text: string | null;
  template_id: string | null;
  sent_by_email: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface MailTemplate {
  id: string;
  name: string;
  category: string | null;
  subject: string;
  body_html: string;
  updated_at: string;
}

export interface MailAttachment {
  id?: string;
  file_name: string;
  storage_path: string;
  size_bytes: number;
  content_type: string | null;
  url?: string;
}

/* ------------------------------- messages -------------------------------- */

export const useMailMessages = (status: "sent" | "draft") =>
  useQuery({
    queryKey: ["admin", "mail", "messages", status],
    queryFn: async (): Promise<MailMessage[]> => {
      let q = supabase
        .from("admin_email_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      q = status === "draft" ? q.eq("status", "draft") : q.neq("status", "draft");
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as MailMessage[];
    },
  });

export const useMailFailedCount = () =>
  useQuery({
    queryKey: ["admin", "mail", "failed-count"],
    staleTime: 60_000,
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("admin_email_messages")
        .select("id", { count: "exact", head: true })
        .in("status", ["failed", "bounced", "complained"]);
      if (error) throw error;
      return count ?? 0;
    },
  });

export const useDeleteMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("admin_email_messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "mail"] }),
  });
};

export interface DraftInput {
  id?: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  bodyHtml: string;
  displayName: string;
  templateId?: string | null;
}

/** Creates or updates a draft row and returns its id. */
export const saveDraft = async (input: DraftInput): Promise<string> => {
  const payload = {
    to_addresses: input.to,
    cc_addresses: input.cc,
    bcc_addresses: input.bcc,
    subject: input.subject,
    body_html: input.bodyHtml,
    display_name: input.displayName,
    template_id: input.templateId ?? null,
    status: "draft" as const,
  };

  if (input.id) {
    const { error } = await supabase.from("admin_email_messages").update(payload).eq("id", input.id);
    if (error) throw error;
    return input.id;
  }

  const { data: user } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("admin_email_messages")
    .insert({
      ...payload,
      sent_by: user.user?.id ?? null,
      sent_by_email: user.user?.email ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
};

/* ------------------------------ attachments ------------------------------ */

export const uploadMailFile = async (file: File): Promise<MailAttachment> => {
  const safeName = file.name.replace(/[^\w.\- ]+/g, "_");
  const path = `${crypto.randomUUID()}/${safeName}`;
  const { error } = await supabase.storage
    .from(MAIL_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || "application/octet-stream" });
  if (error) throw error;

  const { data, error: signError } = await supabase.storage.from(MAIL_BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
  if (signError || !data?.signedUrl) throw signError ?? new Error("Couldn't prepare that file.");

  return {
    file_name: file.name,
    storage_path: path,
    size_bytes: file.size,
    content_type: file.type || null,
    url: data.signedUrl,
  };
};

export const useMessageAttachments = (messageId?: string) =>
  useQuery({
    queryKey: ["admin", "mail", "attachments", messageId],
    enabled: !!messageId,
    queryFn: async (): Promise<MailAttachment[]> => {
      const { data, error } = await supabase
        .from("admin_email_attachments")
        .select("id, file_name, storage_path, size_bytes, content_type")
        .eq("message_id", messageId!);
      if (error) throw error;
      return (data ?? []) as MailAttachment[];
    },
  });

/* -------------------------------- sending -------------------------------- */

export interface SendInput extends DraftInput {
  attachments: MailAttachment[];
  includeSignature: boolean;
}

export interface SendOutcome {
  sent: number;
  failed: number;
  results: { email: string; ok: boolean; error?: string }[];
}

export const useSendMail = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SendInput): Promise<SendOutcome> => {
      const { data, error } = await supabase.functions.invoke("admin-email-send", {
        body: {
          draftId: input.id ?? null,
          to: input.to,
          cc: input.cc,
          bcc: input.bcc,
          subject: input.subject,
          bodyHtml: input.bodyHtml,
          displayName: input.displayName,
          templateId: input.templateId ?? null,
          includeSignature: input.includeSignature,
          attachments: input.attachments.map((a) => ({
            file_name: a.file_name,
            storage_path: a.storage_path,
            size_bytes: a.size_bytes,
            content_type: a.content_type,
          })),
        },
      });
      if (error) {
        const detail = await (error as any)?.context?.text?.().catch(() => null);
        throw new Error(detail || error.message);
      }
      return data as SendOutcome;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "mail"] }),
  });
};

/* ------------------------------- templates ------------------------------- */

export const useMailTemplates = () =>
  useQuery({
    queryKey: ["admin", "mail", "templates"],
    queryFn: async (): Promise<MailTemplate[]> => {
      const { data, error } = await supabase
        .from("admin_email_templates")
        .select("id, name, category, subject, body_html, updated_at")
        .order("name");
      if (error) throw error;
      return (data ?? []) as MailTemplate[];
    },
  });

export const useSaveTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: { id?: string; name: string; category?: string | null; subject: string; body_html: string }) => {
      if (t.id) {
        const { error } = await supabase
          .from("admin_email_templates")
          .update({ name: t.name, category: t.category ?? null, subject: t.subject, body_html: t.body_html })
          .eq("id", t.id);
        if (error) throw error;
        return t.id;
      }
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("admin_email_templates")
        .insert({
          name: t.name,
          category: t.category ?? null,
          subject: t.subject,
          body_html: t.body_html,
          created_by: user.user?.id ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "mail", "templates"] }),
  });
};

export const useDeleteTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("admin_email_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "mail", "templates"] }),
  });
};

/* ------------------------------- signature ------------------------------- */

export const useSignature = () =>
  useQuery({
    queryKey: ["admin", "mail", "signature"],
    queryFn: async (): Promise<string> => {
      const { data, error } = await supabase.from("admin_email_signatures").select("body_html").maybeSingle();
      if (error) throw error;
      return data?.body_html ?? "";
    },
  });

export const useSaveSignature = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bodyHtml: string) => {
      const { data: user } = await supabase.auth.getUser();
      const uid = user.user?.id;
      if (!uid) throw new Error("Not signed in.");
      const { error } = await supabase
        .from("admin_email_signatures")
        .upsert({ user_id: uid, body_html: bodyHtml }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "mail", "signature"] }),
  });
};

/* ---------------------------- recipient picker --------------------------- */

export const CONTACT_GROUPS = [
  "Inquiries",
  "Merchants",
  "Merchants — live",
  "Merchants — setting up",
  "Subscribers",
] as const;

export interface Contact {
  email: string;
  label: string;
  hint?: string;
  group: (typeof CONTACT_GROUPS)[number];
}

export const useMailContacts = () =>
  useQuery({
    queryKey: ["admin", "mail", "contacts"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Contact[]> => {
      const [inquiries, merchants, storefronts, subs] = await Promise.all([
        supabase.from("contact_submissions").select("email, name, company").order("created_at", { ascending: false }).limit(500),
        supabase
          .from("merchants")
          .select("id, contact_email, contact_name, business_name, phone, city, region, accepting_orders")
          .order("business_name")
          .limit(500),
        supabase.from("merchant_storefronts").select("merchant_id, is_published, location"),
        supabase.from("newsletter_subscribers").select("email").order("created_at", { ascending: false }).limit(1000),
      ]);
      if (inquiries.error) throw inquiries.error;
      if (merchants.error) throw merchants.error;
      if (storefronts.error) throw storefronts.error;
      if (subs.error) throw subs.error;

      const out: Contact[] = [];
      const seen = new Set<string>();
      const push = (email: string | null, label: string, group: Contact["group"], hint?: string) => {
        const e = (email ?? "").trim().toLowerCase();
        if (!e || seen.has(`${group}:${e}`)) return;
        seen.add(`${group}:${e}`);
        out.push({ email: e, label, group, hint });
      };

      const published = new Set(
        (storefronts.data ?? []).filter((s) => s.is_published).map((s) => s.merchant_id),
      );
      const storeLocation = new Map(
        (storefronts.data ?? []).filter((s) => s.location).map((s) => [s.merchant_id, s.location as string]),
      );

      (inquiries.data ?? []).forEach((r) => push(r.email, r.company ? `${r.name} · ${r.company}` : r.name, "Inquiries"));

      (merchants.data ?? []).forEach((r) => {
        const label = r.contact_name ? `${r.contact_name} · ${r.business_name}` : r.business_name;
        const place = [r.city, r.region].filter(Boolean).join(", ") || storeLocation.get(r.id) || null;
        const hint = [place, r.phone].filter(Boolean).join(" · ") || undefined;
        const isLive = published.has(r.id) && r.accepting_orders;
        push(r.contact_email, label, "Merchants", hint);
        push(r.contact_email, label, isLive ? "Merchants — live" : "Merchants — setting up", hint);
      });

      (subs.data ?? []).forEach((r) => push(r.email, r.email, "Subscribers"));
      return out;
    },
  });

/* -------------------------------- helpers -------------------------------- */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const parseAddresses = (raw: string): string[] =>
  raw
    .split(/[,;\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

export const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

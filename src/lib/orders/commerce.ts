import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Service-side commerce spine: catalog, jobs, quotes and invoices.
 *
 * Row-level security scopes every read and write to the merchant that owns the
 * record. Money totals shown here are for display; platform fees are always
 * recalculated server-side from the merchant's plan row before a charge.
 */

export type JobStatus =
  | "request"
  | "estimate"
  | "approved"
  | "deposit"
  | "scheduled"
  | "in_progress"
  | "invoiced"
  | "completed"
  | "cancelled";

export type QuoteStatus = "draft" | "sent" | "approved" | "declined" | "expired";
export type InvoiceStatus = "draft" | "sent" | "paid" | "void";

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  request: "Request",
  estimate: "Estimate",
  approved: "Approved",
  deposit: "Deposit",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  invoiced: "Invoiced",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const JOB_FLOW: JobStatus[] = [
  "request",
  "estimate",
  "approved",
  "deposit",
  "scheduled",
  "in_progress",
  "invoiced",
  "completed",
];

export const nextJobStatus = (status: JobStatus): JobStatus => {
  const i = JOB_FLOW.indexOf(status);
  if (i < 0) return status;
  return JOB_FLOW[Math.min(i + 1, JOB_FLOW.length - 1)];
};

export interface MerchantSummary {
  id: string;
  business_name: string;
  contact_email: string;
  plan_slug: string;
  industry_slug: string;
  purchase_models: string[];
  accepting_orders: boolean;
}

export interface MerchantJob {
  id: string;
  merchant_id: string;
  reference: string | null;
  status: JobStatus;
  title: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  service_address: string | null;
  problem_description: string | null;
  customer_notes: string | null;
  internal_notes: string | null;
  scheduled_for: string | null;
  scheduled_window: string | null;
  total_cents: number | null;
  created_at: string;
}

export interface QuoteLineItem {
  description: string;
  quantity: number;
  unit_price_cents: number;
}

export interface MerchantQuote {
  id: string;
  merchant_id: string;
  job_id: string | null;
  public_token: string;
  status: QuoteStatus;
  title: string;
  message: string | null;
  line_items: QuoteLineItem[];
  subtotal_cents: number;
  deposit_cents: number;
  expires_at: string | null;
  sent_at: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface MerchantInvoice {
  id: string;
  merchant_id: string;
  job_id: string | null;
  quote_id: string | null;
  kind: string;
  status: InvoiceStatus;
  amount_cents: number;
  due_at: string | null;
  paid_at: string | null;
  created_at: string;
}

const sel = (s: string): string => s;

/** The merchant record owned by the signed-in user, if there is one. */
export const useMyMerchant = () =>
  useQuery({
    queryKey: ["orders", "my-merchant"],
    queryFn: async (): Promise<MerchantSummary | null> => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data, error } = await supabase
        .from("merchants")
        .select(sel("id, business_name, contact_email, plan_slug, industry_slug, purchase_models, accepting_orders"))
        .eq("owner_id", auth.user.id)
        .maybeSingle()
        .returns<MerchantSummary | null>();
      if (error) throw error;
      return data ?? null;
    },
  });

export const useJobs = (merchantId?: string | null) =>
  useQuery({
    queryKey: ["orders", "jobs", merchantId],
    enabled: !!merchantId,
    queryFn: async (): Promise<MerchantJob[]> => {
      const { data, error } = await supabase
        .from("merchant_jobs")
        .select(
          sel(
            "id, merchant_id, reference, status, title, customer_name, customer_email, customer_phone, service_address, problem_description, customer_notes, internal_notes, scheduled_for, scheduled_window, total_cents, created_at"
          )
        )
        .eq("merchant_id", merchantId as string)
        .order("created_at", { ascending: false })
        .returns<MerchantJob[]>();
      if (error) throw error;
      return data ?? [];
    },
  });

export const useQuotes = (merchantId?: string | null) =>
  useQuery({
    queryKey: ["orders", "quotes", merchantId],
    enabled: !!merchantId,
    queryFn: async (): Promise<MerchantQuote[]> => {
      const { data, error } = await supabase
        .from("merchant_quotes")
        .select(
          sel(
            "id, merchant_id, job_id, public_token, status, title, message, line_items, subtotal_cents, deposit_cents, expires_at, sent_at, approved_at, created_at"
          )
        )
        .eq("merchant_id", merchantId as string)
        .order("created_at", { ascending: false })
        .returns<MerchantQuote[]>();
      if (error) throw error;
      return data ?? [];
    },
  });

export const useInvoices = (merchantId?: string | null) =>
  useQuery({
    queryKey: ["orders", "invoices", merchantId],
    enabled: !!merchantId,
    queryFn: async (): Promise<MerchantInvoice[]> => {
      const { data, error } = await supabase
        .from("merchant_invoices")
        .select(
          sel("id, merchant_id, job_id, quote_id, kind, status, amount_cents, due_at, paid_at, created_at")
        )
        .eq("merchant_id", merchantId as string)
        .order("created_at", { ascending: false })
        .returns<MerchantInvoice[]>();
      if (error) throw error;
      return data ?? [];
    },
  });

/* -------------------------------- mutations ------------------------------- */

export const useAdvanceJob = (merchantId?: string | null) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: JobStatus }) => {
      const { error } = await supabase.from("merchant_jobs").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders", "jobs", merchantId] }),
  });
};

export interface NewQuoteInput {
  merchant_id: string;
  job_id?: string | null;
  title: string;
  message?: string;
  line_items: QuoteLineItem[];
  deposit_cents: number;
  expires_at?: string | null;
}

export const quoteSubtotal = (items: QuoteLineItem[]) =>
  items.reduce((sum, i) => sum + Math.max(0, Math.round(i.quantity * i.unit_price_cents)), 0);

export const useCreateQuote = (merchantId?: string | null) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewQuoteInput) => {
      const subtotal = quoteSubtotal(input.line_items);
      const { data, error } = await supabase
        .from("merchant_quotes")
        .insert({
          merchant_id: input.merchant_id,
          job_id: input.job_id ?? null,
          title: input.title,
          message: input.message ?? null,
          line_items: input.line_items as unknown as never,
          subtotal_cents: subtotal,
          deposit_cents: Math.min(input.deposit_cents, subtotal),
          expires_at: input.expires_at ?? null,
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .select("id, public_token")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders", "quotes", merchantId] });
      qc.invalidateQueries({ queryKey: ["orders", "jobs", merchantId] });
    },
  });
};

export const useCreateInvoice = (merchantId?: string | null) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      merchant_id: string;
      job_id?: string | null;
      quote_id?: string | null;
      kind: "deposit" | "balance";
      amount_cents: number;
      due_at?: string | null;
    }) => {
      const { error } = await supabase.from("merchant_invoices").insert({
        merchant_id: input.merchant_id,
        job_id: input.job_id ?? null,
        quote_id: input.quote_id ?? null,
        kind: input.kind,
        amount_cents: Math.max(0, Math.round(input.amount_cents)),
        due_at: input.due_at ?? null,
        status: "sent",
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders", "invoices", merchantId] }),
  });
};

/** Public storefront: a visitor submits a service request. */
export interface ServiceRequestInput {
  merchant_id: string;
  title: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  service_address?: string;
  problem_description?: string;
  customer_notes?: string;
  service_id?: string | null;
}

export const submitServiceRequest = async (input: ServiceRequestInput) => {
  const { error } = await supabase.from("merchant_jobs").insert({
    merchant_id: input.merchant_id,
    service_id: input.service_id ?? null,
    title: input.title.slice(0, 160),
    customer_name: input.customer_name.slice(0, 120),
    customer_email: input.customer_email?.slice(0, 255) || null,
    customer_phone: input.customer_phone?.slice(0, 40) || null,
    service_address: input.service_address?.slice(0, 300) || null,
    problem_description: input.problem_description?.slice(0, 4000) || null,
    customer_notes: input.customer_notes?.slice(0, 2000) || null,
    status: "request",
  });
  if (error) throw error;
};

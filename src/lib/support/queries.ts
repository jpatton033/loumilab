import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SupportScope } from "./rules";

/**
 * Help Desk data. Every write goes through a security-definer function that
 * checks the caller's support level and the merchant's grant, and writes the
 * audit entry itself.
 */
const rpc = supabase.rpc.bind(supabase) as unknown as (
  fn: string,
  args?: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message: string } | null }>;

const call = async <T = unknown>(fn: string, args?: Record<string, unknown>) => {
  const { data, error } = await rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
};

export interface Ticket {
  id: string;
  merchant_id: string;
  topic: string;
  subject: string;
  status: "new" | "open" | "waiting" | "resolved";
  assignee_id: string | null;
  created_at: string;
  updated_at: string;
  merchants?: { business_name: string } | null;
}
export interface TicketMessage {
  id: string;
  author_kind: "merchant" | "staff";
  body: string;
  created_at: string;
}
export interface Grant {
  id: string;
  merchant_id: string;
  scopes: string[];
  status: string;
  expires_at: string | null;
  created_at: string;
  ticket_id: string | null;
}

export const useSupportLevel = () =>
  useQuery({
    queryKey: ["support", "level"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return 0;
      return (await call<number>("support_level", { _uid: data.user.id })) ?? 0;
    },
  });

const db = supabase as unknown as { from: (t: string) => any };

export const useTickets = (merchantId?: string) =>
  useQuery({
    queryKey: ["support", "tickets", merchantId ?? "all"],
    queryFn: async (): Promise<Ticket[]> => {
      let q = db.from("support_tickets").select("*, merchants(business_name)").order("updated_at", { ascending: false }).limit(200);
      if (merchantId) q = q.eq("merchant_id", merchantId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

export const useTicket = (id?: string) =>
  useQuery({
    queryKey: ["support", "ticket", id],
    enabled: !!id,
    queryFn: async () => {
      const [t, m] = await Promise.all([
        db.from("support_tickets").select("*, merchants(business_name)").eq("id", id).maybeSingle(),
        db.from("support_ticket_messages").select("id, author_kind, body, created_at").eq("ticket_id", id).order("created_at"),
      ]);
      if (t.error) throw t.error;
      if (m.error) throw m.error;
      return { ticket: t.data as Ticket | null, messages: (m.data ?? []) as TicketMessage[] };
    },
  });

export const useMerchantGrants = (merchantId?: string) =>
  useQuery({
    queryKey: ["support", "grants", merchantId],
    enabled: !!merchantId,
    queryFn: async (): Promise<Grant[]> => {
      const { data, error } = await db
        .from("support_access_grants")
        .select("*")
        .eq("merchant_id", merchantId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const useMerchantOverview = (merchantId?: string, viewAs = false) =>
  useQuery({
    queryKey: ["support", "overview", merchantId, viewAs],
    enabled: !!merchantId,
    staleTime: 30_000,
    queryFn: () => call<Record<string, any>>("support_merchant_overview", { _merchant: merchantId, _view_as: viewAs }),
  });

export const useStaffList = () =>
  useQuery({
    queryKey: ["support", "staff"],
    queryFn: async () => {
      const { data, error } = await db.from("support_staff").select("*").order("created_at");
      if (error) throw error;
      return (data ?? []) as { user_id: string; email: string; level: string; created_at: string }[];
    },
  });

const useInvalidating = <A,>(fn: (a: A) => Promise<unknown>) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: ["support"] }) });
};

export const useOpenTicket = () =>
  useInvalidating(async (a: { topic: string; subject: string; body: string; grantHours: number | null }) => {
    const id = await call<string>("merchant_open_ticket", {
      _topic: a.topic,
      _subject: a.subject,
      _body: a.body,
      _grant_hours: a.grantHours ?? 0,
    });
    supabase.functions.invoke("support-ticket-notify", { body: { ticketId: id } }).catch(() => undefined);
    return id;
  });

export const useReply = () =>
  useInvalidating((a: { ticketId: string; body: string }) => call("support_reply", { _ticket: a.ticketId, _body: a.body }));

export const useSetTicketStatus = () =>
  useInvalidating((a: { ticketId: string; status: string; assignSelf?: boolean }) =>
    call("support_ticket_set_status", { _ticket: a.ticketId, _status: a.status, _assign_self: !!a.assignSelf }),
  );

export const useRequestAccess = () =>
  useInvalidating((a: { merchantId: string; ticketId: string | null; scopes: SupportScope[] }) =>
    call("support_request_access", { _merchant: a.merchantId, _ticket: a.ticketId, _scopes: a.scopes }),
  );

export const useDecideAccess = () =>
  useInvalidating((a: { grantId: string; approve: boolean; hours: number }) =>
    call("merchant_decide_access", { _grant: a.grantId, _approve: a.approve, _hours: a.hours }),
  );

export const useRevokeAccess = () => useInvalidating((grantId: string) => call("revoke_support_access", { _grant: grantId }));

export const useApplyChange = () =>
  useInvalidating((a: { merchantId: string; scope: SupportScope; targetId?: string | null; patch: Record<string, unknown>; reason: string }) =>
    call("support_apply_change", {
      _merchant: a.merchantId,
      _scope: a.scope,
      _target: a.targetId ?? null,
      _patch: a.patch,
      _reason: a.reason,
    }),
  );

export const useSetStaff = () =>
  useInvalidating((a: { email: string; level: string }) => call("support_set_staff", { _email: a.email, _level: a.level }));

export interface SupportActivity {
  created_at: string;
  action: string;
  actor_role: string | null;
  new_value: unknown;
  reason: string | null;
}

/** The signed-in merchant's own support history (server-filtered). */
export const useMySupportActivity = (enabled: boolean) =>
  useQuery({
    queryKey: ["support", "my-activity"],
    enabled,
    queryFn: () => call<SupportActivity[]>("merchant_support_activity"),
  });

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Order-based messaging between a customer and the business they ordered from.
 *
 * Every read and write goes through a database function that re-checks the
 * order, the merchant's plan entitlement and the conversation lock date, so
 * hiding the UI is never the only gate. Customers are identified by the same
 * secret order token that powers their receipt — never by a conversation id.
 */

export type MessageSender = "customer" | "merchant" | "system";

export interface OrderMessage {
  id: string;
  sender: MessageSender;
  body: string;
  event_type: string | null;
  created_at: string;
}

export interface OrderConversationView {
  messaging_enabled: boolean;
  business_name: string | null;
  order_status: string;
  order_reference: string | null;
  order_paid: boolean;
  locked_at: string | null;
  locked: boolean;
  messages: OrderMessage[];
}

/* ------------------------------ customer side ----------------------------- */

/** The customer's conversation for one order, polled while the panel is open. */
export const useOrderConversation = (token?: string, active = true) =>
  useQuery({
    queryKey: ["orders", "conversation", token],
    enabled: Boolean(token),
    refetchInterval: active ? 8000 : false,
    queryFn: async (): Promise<OrderConversationView | null> => {
      const { data, error } = await supabase.rpc("get_order_conversation", {
        _token: token as string,
      });
      if (error) throw error;
      if (!data) return null;
      const view = data as unknown as OrderConversationView;
      return { ...view, messages: view.messages ?? [] };
    },
  });

export const useSendOrderMessage = (token?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase.rpc("send_order_message", {
        _token: token as string,
        _body: body,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders", "conversation", token] }),
  });
};

/* ------------------------------ merchant side ----------------------------- */

export interface MerchantConversation {
  id: string;
  order_id: string;
  last_message_at: string | null;
  merchant_unread_count: number;
  locked_at: string | null;
  order: {
    reference: string | null;
    public_token: string;
    customer_name: string;
    customer_email: string;
    status: string;
    total_cents: number;
    currency: string;
  } | null;
}

export const CONVERSATIONS_KEY = ["orders", "merchant-conversations"] as const;

/** Every order conversation for the signed-in merchant, newest activity first. */
export const useMerchantConversations = (merchantId?: string, enabled = true) => {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: [...CONVERSATIONS_KEY, merchantId ?? "none"],
    enabled: Boolean(merchantId) && enabled,
    queryFn: async (): Promise<MerchantConversation[]> => {
      const { data, error } = await supabase
        .from("order_conversations")
        .select(
          "id, order_id, last_message_at, merchant_unread_count, locked_at, orders!inner(reference, public_token, customer_name, customer_email, status, total_cents, currency)",
        )
        .eq("merchant_id", merchantId!)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(200);
      if (error) throw error;
      return ((data ?? []) as unknown as (Omit<MerchantConversation, "order"> & {
        orders: MerchantConversation["order"];
      })[]).map((row) => ({
        id: row.id,
        order_id: row.order_id,
        last_message_at: row.last_message_at,
        merchant_unread_count: row.merchant_unread_count,
        locked_at: row.locked_at,
        order: row.orders ?? null,
      }));
    },
  });

  // New customer messages land in the dashboard without a refresh.
  useEffect(() => {
    if (!merchantId || !enabled) return;
    const channel = supabase
      .channel(`merchant-messages-${merchantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_messages", filter: `merchant_id=eq.${merchantId}` },
        () => {
          void qc.invalidateQueries({ queryKey: [...CONVERSATIONS_KEY, merchantId] });
          void qc.invalidateQueries({ queryKey: ["orders", "conversation-messages"] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [merchantId, enabled, qc]);

  return query;
};

/** Full thread for one conversation the merchant owns. */
export const useConversationMessages = (conversationId?: string) =>
  useQuery({
    queryKey: ["orders", "conversation-messages", conversationId ?? "none"],
    enabled: Boolean(conversationId),
    queryFn: async (): Promise<OrderMessage[]> => {
      const { data, error } = await supabase
        .from("order_messages")
        .select("id, sender, body, event_type, created_at")
        .eq("conversation_id", conversationId!)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as OrderMessage[];
    },
  });

export const useMerchantSendMessage = (merchantId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, body }: { orderId: string; body: string }) => {
      const { error } = await supabase.rpc("merchant_send_order_message", {
        _order_id: orderId,
        _body: body,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...CONVERSATIONS_KEY, merchantId ?? "none"] });
      void qc.invalidateQueries({ queryKey: ["orders", "conversation-messages"] });
    },
  });
};

export const useMarkConversationRead = (merchantId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase.rpc("merchant_mark_conversation_read", {
        _conversation_id: conversationId,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [...CONVERSATIONS_KEY, merchantId ?? "none"] }),
  });
};

/** Unread customer messages per order, for badges on the order queue. */
export const unreadByOrder = (conversations?: MerchantConversation[]): Record<string, number> => {
  const map: Record<string, number> = {};
  (conversations ?? []).forEach((c) => {
    if (c.merchant_unread_count > 0) map[c.order_id] = c.merchant_unread_count;
  });
  return map;
};

export const totalUnread = (conversations?: MerchantConversation[]): number =>
  (conversations ?? []).reduce((sum, c) => sum + c.merchant_unread_count, 0);

/** A closed conversation stays readable but accepts no new messages. */
export const isConversationLocked = (lockedAt: string | null): boolean =>
  Boolean(lockedAt && new Date(lockedAt) <= new Date());

export const formatMessageTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

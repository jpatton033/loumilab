import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { logAudit } from "@/lib/admin/audit";
import { formatMessageTime, type OrderMessage } from "@/lib/orders/messaging";

interface AdminConversationRow {
  id: string;
  order_id: string;
  last_message_at: string | null;
  locked_at: string | null;
  merchants: { business_name: string } | null;
  orders: { reference: string | null; customer_name: string; status: string } | null;
}

const useAdminConversations = () =>
  useQuery({
    queryKey: ["admin", "order-conversations"],
    queryFn: async (): Promise<AdminConversationRow[]> => {
      const { data, error } = await supabase
        .from("order_conversations")
        .select(
          "id, order_id, last_message_at, locked_at, merchants(business_name), orders(reference, customer_name, status)",
        )
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as AdminConversationRow[];
    },
  });

const useAdminMessages = (conversationId?: string) =>
  useQuery({
    queryKey: ["admin", "order-conversation-messages", conversationId ?? "none"],
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

/**
 * Support-only, read-only view of order conversations. Opening a thread is
 * written to the audit log — administrative access is for support, safety,
 * disputes and troubleshooting, never routine browsing.
 */
const OrderConversationsPanel = () => {
  const { data: conversations, isLoading } = useAdminConversations();
  const [openId, setOpenId] = useState<string | null>(null);
  const { data: messages } = useAdminMessages(openId ?? undefined);
  const open = conversations?.find((c) => c.id === openId);

  const view = async (row: AdminConversationRow) => {
    setOpenId(row.id);
    try {
      await logAudit({
        action: "order_conversation.viewed",
        targetType: "order_conversation",
        targetId: row.id,
        reason: "Support review",
        metadata: { order_id: row.order_id, merchant: row.merchants?.business_name ?? null },
      });
    } catch {
      /* the viewer still opens; the audit failure surfaces in the log page */
    }
  };

  return (
    <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
        <div>
          <h2 className="font-display text-sm font-semibold">Order conversations</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Read-only. Every thread you open is recorded in the audit log.
          </p>
        </div>
        {open && (
          <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setOpenId(null)}>
            <ArrowLeft size={14} /> All conversations
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="px-6 py-8 text-sm text-muted-foreground">Loading…</p>
      ) : open ? (
        <div className="px-6 py-5">
          <p className="font-display text-sm font-semibold">
            {open.merchants?.business_name ?? "Merchant"} · {open.orders?.customer_name ?? "Customer"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {open.orders?.reference ? `Order ${open.orders.reference}` : "Order"} · {open.orders?.status}
            {open.locked_at && ` · closed ${formatMessageTime(open.locked_at)}`}
          </p>
          <div className="mt-4 space-y-3">
            {(messages ?? []).map((m) => (
              <div key={m.id} className="rounded-2xl border border-border p-3 text-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {m.sender} · {formatMessageTime(m.created_at)}
                </p>
                <p className="mt-1 whitespace-pre-wrap break-words">{m.body}</p>
              </div>
            ))}
            {!messages?.length && <p className="text-sm text-muted-foreground">No messages.</p>}
          </div>
        </div>
      ) : !conversations?.length ? (
        <p className="px-6 py-8 text-sm text-muted-foreground">No order conversations yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {conversations.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-6 py-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {c.merchants?.business_name ?? "Merchant"} · {c.orders?.customer_name ?? "Customer"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {c.orders?.reference ? `Order ${c.orders.reference}` : "Order"}
                  {c.last_message_at && ` · ${formatMessageTime(c.last_message_at)}`}
                </p>
              </div>
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => void view(c)}>
                <ShieldCheck size={14} /> Review
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OrderConversationsPanel;

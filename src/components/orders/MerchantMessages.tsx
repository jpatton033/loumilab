import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import OrderMessagesPanel from "@/components/orders/OrderMessagesPanel";
import { formatCents } from "@/lib/orders/storefront";
import { ORDER_STATUS_LABELS, type LiveOrderStatus } from "@/lib/orders/orders";
import {
  formatMessageTime,
  useConversationMessages,
  useMarkConversationRead,
  useMerchantConversations,
  useMerchantSendMessage,
  type MerchantConversation,
} from "@/lib/orders/messaging";
import { cn } from "@/lib/utils";

interface Props {
  merchantId: string;
  businessName: string;
  /** Order the merchant asked to message from the queue, if any. */
  startOrderId?: string | null;
  onStartHandled?: () => void;
}

const statusLabel = (status?: string) =>
  status ? (ORDER_STATUS_LABELS[status as LiveOrderStatus] ?? status) : "";

const MerchantMessages = ({ merchantId, businessName, startOrderId, onStartHandled }: Props) => {
  const { data: conversations, isLoading } = useMerchantConversations(merchantId);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const { data: messages } = useConversationMessages(activeId ?? undefined);
  const send = useMerchantSendMessage(merchantId);
  const markRead = useMarkConversationRead(merchantId);

  // Opening a thread from the order queue: use the existing conversation, or
  // hold the order so the first message creates one.
  useEffect(() => {
    if (!startOrderId) return;
    const existing = conversations?.find((c) => c.order_id === startOrderId);
    if (existing) {
      setActiveId(existing.id);
      setPendingOrderId(null);
    } else {
      setActiveId(null);
      setPendingOrderId(startOrderId);
    }
    onStartHandled?.();
  }, [startOrderId, conversations]);

  const active: MerchantConversation | undefined = conversations?.find((c) => c.id === activeId);

  // After the merchant sends the first message on an order with no thread yet,
  // the new conversation appears in the refetched list — adopt it so the view
  // stays on the thread instead of dropping back to the list.
  useEffect(() => {
    if (!pendingOrderId) return;
    const created = conversations?.find((c) => c.order_id === pendingOrderId);
    if (created) {
      setActiveId(created.id);
      setPendingOrderId(null);
    }
  }, [pendingOrderId, conversations]);

  useEffect(() => {
    if (active && active.merchant_unread_count > 0) markRead.mutate(active.id);
  }, [active?.id, active?.merchant_unread_count]);

  const sendTo = (orderId: string) => (body: string) => {
    send.mutate({ orderId, body });
  };

  if (active || pendingOrderId) {
    const orderId = active?.order_id ?? pendingOrderId!;
    const order = active?.order;
    return (
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full"
              onClick={() => {
                setActiveId(null);
                setPendingOrderId(null);
              }}
            >
              <ArrowLeft size={15} /> All messages
            </Button>
            <div className="min-w-0">
              <p className="truncate font-display font-semibold">
                {order?.customer_name ?? "Customer"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {order?.reference ? `Order ${order.reference}` : "Order"}
                {order && ` · ${statusLabel(order.status)} · ${formatCents(order.total_cents, order.currency)}`}
              </p>
            </div>
          </div>
          {order?.public_token && (
            <Button size="sm" variant="outline" asChild className="rounded-full">
              <Link to={`/orders/receipt/${order.public_token}`} target="_blank" rel="noreferrer">
                <ExternalLink size={14} /> View order
              </Link>
            </Button>
          )}
        </div>

        <OrderMessagesPanel
          messages={messages ?? []}
          viewer="merchant"
          otherName={order?.customer_name ?? "Customer"}
          locked={Boolean(active?.locked_at && new Date(active.locked_at) <= new Date())}
          lockedNote="This conversation closed 7 days after the order finished. The history stays available."
          sending={send.isPending}
          error={send.error ? (send.error as Error).message : null}
          placeholder="Message this customer about their order…"
          onSend={sendTo(orderId)}
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <p className="font-display font-semibold">Messages</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Order conversations with your customers, newest first.
        </p>
      </div>

      {isLoading ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground sm:px-6">Loading messages…</p>
      ) : !conversations?.length ? (
        <div className="px-5 py-12 text-center sm:px-6">
          <MessageSquare size={20} className="mx-auto text-muted-foreground" />
          <p className="mt-3 font-display font-semibold">No conversations yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            When a customer messages you about an order it appears here. You can also start a message
            from any paid order in your queue.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setActiveId(c.id)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-secondary/60 sm:px-6"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-display text-sm font-semibold">
                    <span className="truncate">{c.order?.customer_name ?? "Customer"}</span>
                    {c.merchant_unread_count > 0 && (
                      <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
                        {c.merchant_unread_count} new
                      </span>
                    )}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {c.order?.reference ? `Order ${c.order.reference}` : "Order"}
                    {c.order && ` · ${statusLabel(c.order.status)}`}
                    {c.last_message_at && ` · ${formatMessageTime(c.last_message_at)}`}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-xs",
                    c.merchant_unread_count > 0 ? "font-semibold text-foreground" : "text-muted-foreground",
                  )}
                >
                  Open
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground sm:px-6">
        Messages stay attached to the order and are kept for support and dispute records. Never ask a
        customer for card or bank details here — {businessName} is paid through Loumilab Orders.
      </p>
    </div>
  );
};

export default MerchantMessages;

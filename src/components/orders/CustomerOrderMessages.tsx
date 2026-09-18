import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import OrderMessagesPanel from "@/components/orders/OrderMessagesPanel";
import { useOrderConversation, useSendOrderMessage } from "@/lib/orders/messaging";

interface Props {
  token: string;
  /** Only paid orders can carry a conversation. */
  paid: boolean;
  storeName?: string | null;
}

/**
 * Customer-side messaging on the receipt. Nothing renders unless the business's
 * plan includes messaging, so a customer is never shown a channel that would
 * reach no one.
 */
const CustomerOrderMessages = ({ token, paid, storeName }: Props) => {
  const [open, setOpen] = useState(false);
  const { data } = useOrderConversation(token, open);
  const send = useSendOrderMessage(token);

  if (!paid || !data?.messaging_enabled) return null;

  const business = data.business_name ?? storeName ?? "the business";
  const unread = data.messages.filter((m) => m.sender === "merchant").length;

  return (
    <div className="mt-8 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="font-display font-semibold">Message {business}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask about pickup time, changes, or anything else about this order.
          </p>
        </div>
        <Button
          variant={open ? "ghost" : "outline"}
          className="h-11 w-full rounded-full sm:w-auto"
          onClick={() => setOpen((v) => !v)}
        >
          <MessageSquare size={15} />
          {open ? "Hide messages" : unread ? `View messages (${unread})` : "Message business"}
        </Button>
      </div>

      {open && (
        <OrderMessagesPanel
          messages={data.messages}
          viewer="customer"
          otherName={business}
          locked={data.locked}
          lockedNote="This conversation closed 7 days after your order finished. You can still read the history."
          sending={send.isPending}
          error={send.error ? (send.error as Error).message : null}
          placeholder={`Message ${business} about this order…`}
          onSend={(body) => send.mutate(body)}
        />
      )}
    </div>
  );
};

export default CustomerOrderMessages;

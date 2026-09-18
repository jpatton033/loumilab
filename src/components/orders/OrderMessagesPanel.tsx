import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatMessageTime, type MessageSender, type OrderMessage } from "@/lib/orders/messaging";

interface Props {
  messages: OrderMessage[];
  /** Which side is reading the thread. */
  viewer: "customer" | "merchant";
  /** Name shown on the other party's messages. */
  otherName: string;
  locked?: boolean;
  lockedNote?: string;
  sending?: boolean;
  error?: string | null;
  placeholder?: string;
  onSend: (body: string) => void;
  className?: string;
}

const bubbleTone = (sender: MessageSender, mine: boolean) => {
  if (sender === "system") return "bg-secondary text-muted-foreground";
  return mine ? "bg-foreground text-background" : "bg-secondary text-foreground";
};

/**
 * Shared conversation thread. Order events sit inline with the messages so the
 * thread doubles as a lightweight order activity timeline.
 */
const OrderMessagesPanel = ({
  messages,
  viewer,
  otherName,
  locked,
  lockedNote,
  sending,
  error,
  placeholder,
  onSend,
  className,
}: Props) => {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  const submit = () => {
    const body = draft.trim();
    if (!body || sending || locked) return;
    onSend(body);
    setDraft("");
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="max-h-[26rem] min-h-[8rem] flex-1 space-y-3 overflow-y-auto px-5 py-4 sm:px-6">
        {messages.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No messages yet. Start the conversation below.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender === viewer;
          if (m.sender === "system") {
            return (
              <div key={m.id} className="flex justify-center">
                <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                  {m.body} · {formatMessageTime(m.created_at)}
                </span>
              </div>
            );
          }
          return (
            <div key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
              <span className="px-1 text-[11px] font-medium text-muted-foreground">
                {mine ? "You" : otherName}
              </span>
              <div
                className={cn(
                  "mt-1 max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm",
                  bubbleTone(m.sender, mine),
                )}
              >
                {m.body}
              </div>
              <span className="mt-1 px-1 text-[11px] text-muted-foreground">
                {formatMessageTime(m.created_at)}
              </span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border bg-card px-5 py-4 sm:px-6">
        {locked ? (
          <p className="text-sm text-muted-foreground">
            {lockedNote ?? "This conversation is closed. You can still read the history."}
          </p>
        ) : (
          <>
            <Textarea
              value={draft}
              maxLength={2000}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={placeholder ?? "Write a message about this order…"}
              className="min-h-[4.5rem] resize-none rounded-2xl"
            />
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="hidden text-xs text-muted-foreground sm:block">
                Keep it about this order. Never share card or bank details.
              </p>
              <Button
                className="h-11 w-full rounded-full sm:w-auto"
                disabled={sending || !draft.trim()}
                onClick={submit}
              >
                <Send size={15} /> {sending ? "Sending…" : "Send"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderMessagesPanel;

import { Link } from "react-router-dom";
import { Check, ChevronRight, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import StoreStatusBadge from "@/components/orders/StoreStatusBadge";
import {
  STATUS_DESCRIPTIONS,
  useSetStorefrontStatus,
  type SetupSnapshot,
} from "@/lib/orders/setup";
import { toast } from "sonner";

interface Props {
  snapshot: SetupSnapshot;
  /** Industry wording, e.g. "Menu items" or "Services". */
  catalogLabel: string;
  onJump?: (id: SetupSnapshot["tasks"][number]["id"]) => void;
}

/**
 * The merchant's home base: where they are in setup, what's left, and the one
 * action that moves them forward. Collapses to a single line once live.
 */
const SetupChecklist = ({ snapshot, catalogLabel, onJump }: Props) => {
  const setStatus = useSetStorefrontStatus();

  if (!snapshot.merchantId) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <h2 className="font-display text-base font-semibold">Set up your store</h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Register your business, add what you sell, connect payments and publish when you're ready.
        </p>
        <Button asChild className="mt-5 rounded-full">
          <Link to="/orders/get-started">
            Start setup <ChevronRight size={15} />
          </Link>
        </Button>
      </div>
    );
  }

  const outstanding = snapshot.tasks.filter((t) => !t.done && t.id !== "publish");
  const publish = (status: "published" | "paused") => {
    if (!snapshot.storefrontId) return;
    setStatus.mutate(
      { id: snapshot.storefrontId, status },
      {
        onSuccess: () =>
          toast.success(status === "published" ? "Your store is live" : "Store paused", {
            description:
              status === "published"
                ? "Customers can order from your link right now."
                : "You can resume any time — your link stays the same.",
          }),
        onError: (error) =>
          toast.error("Couldn't update your store", {
            description: error instanceof Error ? error.message : "Please try again.",
          }),
      },
    );
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-base font-semibold">Store setup</h2>
            <StoreStatusBadge status={snapshot.status} />
          </div>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">{STATUS_DESCRIPTIONS[snapshot.status]}</p>
          {snapshot.slug && (
            <p className="mt-2 text-xs text-muted-foreground">
              loumilab.com/orders/store/{snapshot.slug}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {snapshot.slug && (
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to={`/orders/store/${snapshot.slug}`}>
                {snapshot.isPublic ? "View store" : "Preview"} <ExternalLink size={14} />
              </Link>
            </Button>
          )}
          {snapshot.isPublic ? (
            <Button
              size="sm"
              variant="secondary"
              className="rounded-full"
              disabled={setStatus.isPending}
              onClick={() => publish("paused")}
            >
              {setStatus.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
              Pause store
            </Button>
          ) : (
            <Button
              size="sm"
              className="rounded-full"
              disabled={!snapshot.canPublish || setStatus.isPending || !snapshot.storefrontId}
              onClick={() => publish("published")}
            >
              {setStatus.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
              {snapshot.status === "paused" ? "Resume store" : "Publish store"}
            </Button>
          )}
        </div>
      </div>

      {(!snapshot.isPublic || outstanding.length > 0) && (
        <>
          <div className="mt-6 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${Math.round((snapshot.completed / Math.max(1, snapshot.total)) * 100)}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {snapshot.completed}/{snapshot.total}
            </span>
          </div>

          <ul className="mt-5 divide-y divide-border border-t border-border">
            {snapshot.tasks.map((task) => (
              <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold ${
                      task.done
                        ? "border-transparent bg-accent/15 text-accent"
                        : "border-border text-muted-foreground"
                    }`}
                    aria-hidden="true"
                  >
                    {task.done ? <Check size={12} /> : ""}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {task.id === "catalog" ? catalogLabel : task.label}
                      {!task.required && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">Optional</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{task.detail}</p>
                  </div>
                </div>
                {!task.done && task.id !== "publish" && (
                  onJump ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full text-accent"
                      onClick={() => onJump(task.id)}
                    >
                      Finish <ChevronRight size={14} />
                    </Button>
                  ) : (
                    <Button asChild size="sm" variant="ghost" className="rounded-full text-accent">
                      <Link to={task.href}>
                        Finish <ChevronRight size={14} />
                      </Link>
                    </Button>
                  )
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default SetupChecklist;

import { Link, useNavigate } from "react-router-dom";
import { Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import StoreStatusBadge from "@/components/orders/StoreStatusBadge";
import StoreLink from "@/components/orders/StoreLink";
import PublishStoreButton from "@/components/orders/PublishStoreButton";
import { STATUS_DESCRIPTIONS, type SetupSnapshot } from "@/lib/orders/setup";

interface Props {
  snapshot: SetupSnapshot;
  /** Industry wording, e.g. "Menu items" or "Services". */
  catalogLabel: string;
  /** Return true to handle the task in place instead of navigating. */
  onJump?: (id: SetupSnapshot["tasks"][number]["id"]) => boolean | void;
}

/**
 * The merchant's home base: where they are in setup, what's left, and the one
 * action that moves them forward. Collapses to a single line once live.
 */
const SetupChecklist = ({ snapshot, catalogLabel, onJump }: Props) => {
  const navigate = useNavigate();

  if (!snapshot.merchantId) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <h2 className="font-display text-base font-semibold">Set up your store</h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Register your business, add what you sell, connect payments and publish when you're ready.
        </p>
        <Button asChild className="mt-5 w-full rounded-full sm:w-auto">
          <Link to="/orders/get-started">
            Start setup <ChevronRight size={15} />
          </Link>
        </Button>
      </div>
    );
  }

  const outstanding = snapshot.tasks.filter((t) => !t.done && t.id !== "publish");
  const firstOutstanding = snapshot.tasks.find((t) => t.required && t.id !== "publish" && !t.done);

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-base font-semibold">Store setup</h2>
            <StoreStatusBadge status={snapshot.status} />
          </div>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">{STATUS_DESCRIPTIONS[snapshot.status]}</p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {firstOutstanding && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                if (onJump?.(firstOutstanding.id)) return;
                navigate(firstOutstanding.href);
              }}
            >
              Continue setup <ChevronRight size={14} />
            </Button>
          )}
          <PublishStoreButton snapshot={snapshot} catalogLabel={catalogLabel} />
        </div>
      </div>

      {snapshot.slug && <StoreLink className="mt-5" slug={snapshot.slug} isPublic={snapshot.isPublic} />}

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
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full text-accent"
                    onClick={() => {
                      if (onJump?.(task.id)) return;
                      navigate(task.href);
                    }}
                  >
                    Finish <ChevronRight size={14} />
                  </Button>
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

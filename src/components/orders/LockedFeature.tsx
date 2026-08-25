import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import {
  ENTITLEMENT_LABELS,
  ENTITLEMENT_TIER,
  type EntitlementKey,
} from "@/lib/orders/entitlements";

interface LockedFeatureProps {
  entitlement: EntitlementKey;
  /** Optional override of the capability name. */
  label?: string;
  /** Short line describing what the capability does for this business. */
  description?: string;
  className?: string;
}

/**
 * Capabilities a merchant's plan does not include are shown, never hidden.
 * Quiet inline state — no popups, no dark surfaces.
 */
const LockedFeature = ({ entitlement, label, description, className = "" }: LockedFeatureProps) => {
  const name = label ?? ENTITLEMENT_LABELS[entitlement] ?? "This feature";
  const tier = ENTITLEMENT_TIER[entitlement] ?? "Business";

  return (
    <div
      className={`rounded-3xl border border-dashed border-border bg-secondary/60 p-6 text-center ${className}`}
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
        <Lock size={15} />
      </span>
      <p className="mt-4 font-display text-sm font-semibold">
        {name} is available with Loumilab {tier}
      </p>
      {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
      <Link
        to="/orders#pricing"
        className="mt-4 inline-block text-sm font-semibold text-accent hover:underline"
      >
        Compare plans
      </Link>
    </div>
  );
};

export default LockedFeature;

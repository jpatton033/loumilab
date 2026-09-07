import { Link } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PRIVACY_PATH, TERMS_PATH } from "@/data/orders/legal";
import { useAcceptAgreements, useAgreementStatus } from "@/lib/orders/agreements";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

/** One sentence, two links, one required tick. Used in the wizard and dashboard. */
const AgreementConsent = ({ checked, onCheckedChange, className }: Props) => (
  <label className={cn("flex cursor-pointer items-start gap-3 text-sm", className)}>
    <Checkbox
      checked={checked}
      onCheckedChange={(value) => onCheckedChange(value === true)}
      className="mt-0.5"
      aria-label="Agree to the Loumilab Orders Terms & Conditions and Privacy Policy"
    />
    <span className="text-muted-foreground">
      I have read and agree to the Loumilab Orders{" "}
      <Link
        to={TERMS_PATH}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-foreground underline underline-offset-4"
      >
        Terms &amp; Conditions
      </Link>{" "}
      and{" "}
      <Link
        to={PRIVACY_PATH}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-foreground underline underline-offset-4"
      >
        Privacy Policy
      </Link>
      .
    </span>
  </label>
);

interface CardProps {
  merchantId?: string | null;
  className?: string;
}

/**
 * Shown to merchants who joined before the agreement was required, or after the
 * documents change. Publishing stays blocked until this is done.
 */
export const AgreementConsentCard = ({ merchantId, className }: CardProps) => {
  const { data: status, isLoading } = useAgreementStatus();
  const accept = useAcceptAgreements(merchantId);
  const [checked, setChecked] = useLocalChecked();

  if (isLoading || !status?.signedIn || status.accepted) return null;

  return (
    <div
      className={cn(
        "rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div>
          <p className="font-display font-semibold">One quick thing before you go live</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Please confirm you agree to the merchant terms and privacy policy. You can keep looking around in the
            meantime, but publishing needs this first.
          </p>
        </div>
      </div>

      <AgreementConsent checked={checked} onCheckedChange={setChecked} className="mt-5" />

      <Button
        className="mt-5 rounded-full"
        disabled={!checked || accept.isPending}
        onClick={() =>
          accept.mutate(undefined, {
            onSuccess: () => toast.success("Thanks — you're all set", { description: "You can publish your store now." }),
            onError: (error) =>
              toast.error("Couldn't record your agreement", {
                description: error instanceof Error ? error.message : "Please try again.",
              }),
          })
        }
      >
        {accept.isPending ? <Loader2 size={14} className="animate-spin" /> : null} Agree and continue
      </Button>
    </div>
  );
};

/** Tiny local state helper so the card stays a single component. */
import { useState } from "react";
const useLocalChecked = () => useState(false);

export default AgreementConsent;

import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Copy, ExternalLink, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { storePath, storeUrl } from "@/lib/orders/setup";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  slug: string;
  /** Published stores are viewed; everything else is a private preview. */
  isPublic?: boolean;
  /** Compact inline row for headers; the card version adds a label and border. */
  variant?: "card" | "inline";
  className?: string;
}

/**
 * The merchant's storefront link, with everything they'd want to do with it.
 * Used everywhere the link appears so it always looks and behaves the same.
 */
const StoreLink = ({ slug, isPublic = false, variant = "card", className }: Props) => {
  const [copied, setCopied] = useState(false);
  const url = storeUrl(slug);
  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Store link copied", {
        description: isPublic ? "Paste it anywhere your customers are." : "It goes live once you publish your store.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the link", { description: url });
    }
  };

  const share = async () => {
    try {
      await navigator.share({ title: "Order online", url });
    } catch {
      // Sheet dismissed — nothing to report.
    }
  };

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" className="rounded-full" onClick={copy}>
        {copied ? <Check size={14} /> : <Copy size={14} />} Copy link
      </Button>
      {canShare && (
        <Button size="sm" variant="ghost" className="rounded-full" onClick={share}>
          <Share2 size={14} /> Share
        </Button>
      )}
      <Button asChild size="sm" variant={variant === "inline" ? "outline" : "ghost"} className="rounded-full">
        <Link to={storePath(slug)}>
          {isPublic ? "View store" : "Preview"} <ExternalLink size={14} />
        </Link>
      </Button>
    </div>
  );

  if (variant === "inline") {
    return (
      <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-2", className)}>
        <span className="truncate font-display text-sm font-semibold">loumilab.com{storePath(slug)}</span>
        {actions}
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border border-border bg-secondary p-4", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {isPublic ? "Your store link" : "Your store link (private until you publish)"}
      </p>
      <p className="mt-1.5 break-all font-display font-semibold">loumilab.com{storePath(slug)}</p>
      <div className="mt-3">{actions}</div>
    </div>
  );
};

export default StoreLink;

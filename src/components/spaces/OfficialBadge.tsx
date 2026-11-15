import { BadgeCheck } from "lucide-react";
import type { Designation } from "@/lib/spaces/designation";

export function OfficialBadge({ d, owner }: { d: Designation | null; owner?: string }) {
  if (!d) return null;
  if (d.official)
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-foreground" title={d.verified_at ? `Verified by Loumilab on ${new Date(d.verified_at).toLocaleDateString()}` : undefined}>
        <BadgeCheck className="h-4 w-4 text-dot" aria-hidden /> Official Loumilab Project
      </span>
    );
  return <span className="text-sm text-muted-foreground">Independent project{owner ? ` · Owned by ${owner}` : ""}</span>;
}

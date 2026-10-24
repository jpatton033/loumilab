import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AddToCalendar from "@/components/orders/AddToCalendar";
import { jobCalendarEvent } from "@/lib/orders/calendar";
import type { MerchantJob } from "@/lib/orders/commerce";

/** datetime-local value in the browser's own time zone. */
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
};

const SYNC_LABELS: Record<string, string> = {
  synced: "On calendar",
  pending: "Syncing…",
  failed: "Couldn't sync, retry",
};

const JobScheduleControls = ({
  job,
  businessName,
  industrySlug,
  onSave,
  syncStatus,
  onRetry,
}: {
  job: MerchantJob;
  businessName: string;
  industrySlug?: string | null;
  onSave: (scheduledFor: string | null) => void;
  syncStatus?: string | null;
  onRetry?: () => void;
}) => {
  const [value, setValue] = useState(toLocalInput(job.scheduled_for));
  const event = jobCalendarEvent({ ...job, businessName, industrySlug });
  const dirty = value !== toLocalInput(job.scheduled_for);
  const label = syncStatus ? SYNC_LABELS[syncStatus] : null;

  return (
    <>
      <Input
        type="datetime-local"
        aria-label={`Booked time for ${job.title}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-11 w-auto rounded-full text-sm sm:h-9"
      />
      {dirty && (
        <Button
          size="sm"
          className="rounded-full"
          onClick={() => onSave(value ? new Date(value).toISOString() : null)}
        >
          Save time
        </Button>
      )}
      {event && !dirty && <AddToCalendar event={event} />}
      {label &&
        (syncStatus === "failed" && onRetry ? (
          <button type="button" onClick={onRetry} className="text-xs text-destructive underline-offset-4 hover:underline">
            {label}
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">{label}</span>
        ))}
    </>
  );
};

export default JobScheduleControls;

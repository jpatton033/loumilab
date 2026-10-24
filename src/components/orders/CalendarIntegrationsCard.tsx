import { useState } from "react";
import { CalendarCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  PROVIDER_LABELS,
  connectCalendar,
  useCalendarLink,
  useCalendarList,
  useDisconnectCalendar,
  useInvalidateCalendar,
  useSelectCalendar,
  type CalendarProvider,
} from "@/lib/orders/calendarSync";

/** Manage Calendar Connections — paid plans only (server enforces it too). */
const CalendarIntegrationsCard = ({ merchantId }: { merchantId: string }) => {
  const { data: link, isLoading } = useCalendarLink(merchantId);
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState<CalendarProvider | null>(null);
  const invalidate = useInvalidateCalendar();
  const needsPick = !!link && !link.reconnect_required && (!link.calendar_id || picking);
  const list = useCalendarList(needsPick);
  const select = useSelectCalendar();
  const disconnect = useDisconnectCalendar();

  const onConnect = async (provider: CalendarProvider) => {
    setBusy(provider);
    try {
      await connectCalendar(provider);
      invalidate();
      toast({ title: `Connected to ${PROVIDER_LABELS[provider]}`, description: "Now choose which calendar to use." });
    } catch (e) {
      toast({ title: "Calendar not connected", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const reconnect = link?.reconnect_required || list.data?.reconnectRequired;

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
      <div className="flex items-center gap-2">
        <CalendarCheck2 size={18} className="text-accent" />
        <p className="font-display font-semibold">Calendar Integrations</p>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Sync appointments to your own calendar. Booked jobs are added, moved and removed automatically. Loumilab only
        touches the events it creates.
      </p>

      {isLoading ? null : !link ? (
        <div className="mt-5 flex flex-wrap gap-2">
          <Button className="min-h-11 rounded-full" disabled={!!busy} onClick={() => onConnect("google")}>
            {busy === "google" ? "Connecting…" : "Connect Google Calendar"}
          </Button>
          <Button variant="outline" className="min-h-11 rounded-full" disabled={!!busy} onClick={() => onConnect("microsoft")}>
            {busy === "microsoft" ? "Connecting…" : "Connect Outlook"}
          </Button>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-border bg-secondary px-4 py-3 text-sm">
            <p className="font-semibold">{PROVIDER_LABELS[link.provider]}</p>
            <p className="mt-0.5 text-muted-foreground">
              {link.account_email ?? "Connected account"}
              {link.calendar_name && !picking ? ` · ${link.calendar_name}` : ""}
            </p>
          </div>

          {reconnect ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Your {PROVIDER_LABELS[link.provider]} access needs to be renewed.</p>
              <Button className="min-h-11 rounded-full" disabled={!!busy} onClick={() => onConnect(link.provider)}>
                Reconnect {link.provider === "google" ? "Google" : "Outlook"}
              </Button>
            </div>
          ) : needsPick ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Choose the calendar for your bookings</p>
              {list.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading your calendars…</p>
              ) : list.error ? (
                <p className="text-sm text-destructive">We couldn't load your calendars. Try again in a moment.</p>
              ) : (
                <Select
                  onValueChange={(id) => {
                    const c = list.data?.calendars?.find((x) => x.id === id);
                    if (!c) return;
                    select.mutate(c, {
                      onSuccess: () => {
                        setPicking(false);
                        toast({ title: "Calendar saved", description: `New bookings will appear in ${c.name}.` });
                      },
                    });
                  }}
                >
                  <SelectTrigger className="min-h-11 rounded-full sm:max-w-sm">
                    <SelectValue placeholder="Select a calendar" />
                  </SelectTrigger>
                  <SelectContent>
                    {(list.data?.calendars ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        {c.primary ? " (main)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {!reconnect && link.calendar_id && !picking && (
              <Button variant="outline" size="sm" className="min-h-11 rounded-full sm:min-h-0" onClick={() => setPicking(true)}>
                Change calendar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="min-h-11 rounded-full sm:min-h-0"
              disabled={disconnect.isPending}
              onClick={() =>
                disconnect.mutate(undefined, {
                  onSuccess: () => toast({ title: "Calendar disconnected" }),
                  onError: () => toast({ title: "Couldn't disconnect", variant: "destructive" }),
                })
              }
            >
              Disconnect
            </Button>
          </div>
        </div>
      )}

      <p className="mt-5 text-xs text-muted-foreground">
        Apple Calendar: use “Add to Calendar” on each job to download an event file. Automatic Apple sync isn't available.
      </p>
    </div>
  );
};

export default CalendarIntegrationsCard;

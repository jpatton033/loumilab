import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminShell from "@/components/admin/AdminShell";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  MODULES,
  SECTION_GROUPS,
  THRESHOLDS,
  TIMEZONES,
  useBriefSettings,
  useUpdateBriefSettings,
  type BriefSettingsRow,
} from "@/lib/admin/dailyBrief";
import { Plus, Save, Trash2 } from "lucide-react";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const Panel = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
  <section className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
    <h2 className="font-hero text-lg font-semibold tracking-tight">{title}</h2>
    {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    <div className="mt-5">{children}</div>
  </section>
);

const AdminDailyBriefSettings = () => {
  const { data: settings, isLoading } = useBriefSettings();
  const update = useUpdateBriefSettings();

  const [form, setForm] = useState<BriefSettingsRow | null>(null);
  const [newRecipient, setNewRecipient] = useState("");

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  if (isLoading || !form) {
    return (
      <AdminShell title="Daily Brief Settings">
        <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
      </AdminShell>
    );
  }

  const set = <K extends keyof BriefSettingsRow>(key: K, value: BriefSettingsRow[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const addRecipient = () => {
    const email = newRecipient.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      toast({ title: "Enter a valid email address", variant: "destructive" });
      return;
    }
    if (form.recipients.includes(email)) {
      setNewRecipient("");
      return;
    }
    set("recipients", [...form.recipients, email]);
    setNewRecipient("");
  };

  const save = async () => {
    if (form.recipients.length === 0) {
      toast({ title: "Add at least one recipient", variant: "destructive" });
      return;
    }
    try {
      await update.mutateAsync({
        id: form.id,
        patch: {
          enabled: form.enabled,
          delivery_hour: form.delivery_hour,
          delivery_minute: form.delivery_minute,
          timezone: form.timezone,
          recipients: form.recipients,
          reporting_window: form.reporting_window,
          custom_window_hours: form.custom_window_hours,
          sections: form.sections,
          modules: form.modules,
          thresholds: form.thresholds,
          immediate_alerts: form.immediate_alerts,
        },
      });
      toast({ title: "Settings saved", description: "The next brief uses these settings." });
    } catch (err) {
      toast({ title: "Could not save", description: (err as Error).message, variant: "destructive" });
    }
  };

  return (
    <AdminShell
      title="Daily Brief Settings"
      description="Delivery time, recipients, which sections appear, and the thresholds that raise action items."
      actions={
        <>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/reports/daily-brief">Archive</Link>
          </Button>
          <Button size="sm" onClick={save} disabled={update.isPending}>
            <Save className="h-4 w-4" /> Save
          </Button>
        </>
      }
    >
      <SEOHead
        title="Daily Brief Settings | Loumilab Admin"
        description="Configure the Loumilab daily operations brief."
        path="/admin/settings/daily-brief"
        noindex
      />

      <div className="space-y-6">
        <Panel title="Delivery" description="The brief is generated and emailed once per day at this local time.">
          <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
            <div>
              <p className="font-medium">Daily brief enabled</p>
              <p className="text-xs text-muted-foreground">Turn off to pause the schedule without losing settings.</p>
            </div>
            <Switch checked={form.enabled} onCheckedChange={(v) => set("enabled", v)} />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="hour">Hour (24h)</Label>
              <Input
                id="hour"
                type="number"
                min={0}
                max={23}
                value={form.delivery_hour}
                onChange={(e) => set("delivery_hour", Math.min(23, Math.max(0, Number(e.target.value) || 0)))}
              />
            </div>
            <div>
              <Label htmlFor="minute">Minute</Label>
              <Input
                id="minute"
                type="number"
                min={0}
                max={59}
                step={5}
                value={form.delivery_minute}
                onChange={(e) => set("delivery_minute", Math.min(59, Math.max(0, Number(e.target.value) || 0)))}
              />
            </div>
            <div>
              <Label>Timezone</Label>
              <Select value={form.timezone} onValueChange={(v) => set("timezone", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Reporting window</Label>
              <Select
                value={form.reporting_window}
                onValueChange={(v) => set("reporting_window", v as BriefSettingsRow["reporting_window"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="previous_24h">Previous 24 hours</SelectItem>
                  <SelectItem value="previous_calendar_day">Previous calendar day</SelectItem>
                  <SelectItem value="custom">Custom hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.reporting_window === "custom" && (
              <div>
                <Label htmlFor="window-hours">Custom window (hours)</Label>
                <Input
                  id="window-hours"
                  type="number"
                  min={1}
                  max={168}
                  value={form.custom_window_hours}
                  onChange={(e) =>
                    set("custom_window_hours", Math.min(168, Math.max(1, Number(e.target.value) || 24)))
                  }
                />
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Recipients" description="Each address receives its own copy, tracked independently.">
          <div className="space-y-2">
            {form.recipients.map((email) => (
              <div
                key={email}
                className="flex items-center justify-between rounded-2xl border border-border px-4 py-2 text-sm"
              >
                <span className="truncate">{email}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => set("recipients", form.recipients.filter((r) => r !== email))}
                  aria-label={`Remove ${email}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              placeholder="name@loumilab.com"
              value={newRecipient}
              onChange={(e) => setNewRecipient(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addRecipient();
                }
              }}
            />
            <Button variant="outline" onClick={addRecipient}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </Panel>

        <Panel title="Sections" description="Only enabled sections appear in the brief. Pre-launch areas are marked.">
          <div className="space-y-6">
            {SECTION_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {group.label}
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {group.items.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-border px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{item.label}</p>
                        {item.note && <p className="text-xs text-muted-foreground">{item.note}</p>}
                      </div>
                      <Switch
                        checked={form.sections[item.key] !== false}
                        onCheckedChange={(v) => set("sections", { ...form.sections, [item.key]: v })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Business modules" description="Turn a module off to drop all of its sections from the brief.">
          <div className="grid gap-2 sm:grid-cols-2">
            {MODULES.map((module) => (
              <div key={module.key} className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
                <p className="text-sm font-medium">{module.label}</p>
                <Switch
                  checked={form.modules[module.key] !== false}
                  onCheckedChange={(v) => set("modules", { ...form.modules, [module.key]: v })}
                />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Thresholds" description="These values decide when something becomes an action item or alert.">
          <div className="grid gap-4 sm:grid-cols-2">
            {THRESHOLDS.filter((t) => form.thresholds[t.key] !== undefined).map((t) => (
              <div key={t.key}>
                <Label htmlFor={t.key}>{t.label}</Label>
                <Input
                  id={t.key}
                  type="number"
                  min={t.min}
                  max={t.max}
                  value={form.thresholds[t.key]}
                  onChange={(e) =>
                    set("thresholds", {
                      ...form.thresholds,
                      [t.key]: Math.min(t.max, Math.max(t.min, Number(e.target.value) || t.min)),
                    })
                  }
                />
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Immediate alerts"
          description="Critical events that email right away instead of waiting for the next brief."
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.keys(form.immediate_alerts).map((key) => (
              <div key={key} className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
                <p className="text-sm font-medium capitalize">{key.replace(/_/g, " ")}</p>
                <Switch
                  checked={form.immediate_alerts[key] !== false}
                  onCheckedChange={(v) => set("immediate_alerts", { ...form.immediate_alerts, [key]: v })}
                />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AdminShell>
  );
};

export default AdminDailyBriefSettings;

import { useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useSetStaff, useStaffList, useSupportLevel } from "@/lib/support/queries";

const LEVELS = [
  ["viewer", "Support Viewer"],
  ["specialist", "Support Specialist"],
  ["admin", "Support Administrator"],
] as const;

const SupportTeam = () => {
  const { data: staff = [] } = useStaffList();
  const { data: level = 0 } = useSupportLevel();
  const setStaff = useSetStaff();
  const [email, setEmail] = useState("");
  const [lvl, setLvl] = useState("viewer");
  const run = (e: string, l: string) =>
    setStaff.mutate({ email: e, level: l }, { onSuccess: () => { toast.success("Support team updated"); setEmail(""); }, onError: (x) => toast.error(x.message) });

  return (
    <AdminShell title="Support Team" description="Who can help merchants, and at what level. Loumilab admins are always Support Administrators.">
      <SEOHead title="Support Team | Loumilab Admin" description="Support team." path="/admin/support-team" noindex />
      {level >= 3 && (
        <div className="mb-6 flex flex-wrap gap-2 rounded-3xl border border-border bg-card p-5">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email of an existing Loumilab account" className="max-w-sm" />
          <select className="h-10 rounded-xl border border-input bg-background px-3 text-sm" value={lvl} onChange={(e) => setLvl(e.target.value)}>
            {LEVELS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <Button className="rounded-full" disabled={!email.trim() || setStaff.isPending} onClick={() => run(email, lvl)}>Add or update</Button>
        </div>
      )}
      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        {staff.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No support staff added yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {staff.map((s) => (
              <li key={s.user_id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                <span>{s.email}</span>
                <span className="flex items-center gap-2">
                  {LEVELS.find(([v]) => v === s.level)?.[1]}
                  {level >= 3 && <Button size="sm" variant="ghost" className="rounded-full" onClick={() => run(s.email, "none")}>Remove</Button>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
};

export default SupportTeam;

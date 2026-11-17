import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DomainSearch from "./DomainSearch";
import { normalizeDomain } from "../../../supabase/functions/_shared/domainSearch";

type Row = { id: string; hostname: string; verification_token: string; status: string };
const STATUS: Record<string, string> = { pending_dns: "Waiting for DNS records", verified: "Ownership verified", active: "Live with HTTPS", failed: "Check failed" };

export default function SpacesDomains({ appId, slug, canManage }: { appId: string; slug: string; canManage: boolean }) {
  const nav = useNavigate();
  const [mode, setMode] = useState<"find" | "connect">("connect");
  const [rows, setRows] = useState<Row[]>([]);
  const [host, setHost] = useState("");
  const load = useCallback(async () => {
    const { data } = await supabase.from("spaces_custom_domains").select("id,hostname,verification_token,status").eq("app_id", appId).order("created_at");
    setRows((data as Row[]) ?? []);
  }, [appId]);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    const h = normalizeDomain(host);
    if (!h) return toast.error("Enter a domain like shop.yourbusiness.com");
    if (h.endsWith("loumilab.com")) return toast.error("Loumilab addresses are assigned automatically.");
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("spaces_custom_domains").insert({ app_id: appId, hostname: h, created_by: u.user?.id });
    if (error) return toast.error(error.code === "23505" ? "That domain is already connected to an app." : error.message);
    setHost(""); load();
  };
  const remove = async (id: string) => { await supabase.from("spaces_custom_domains").delete().eq("id", id); load(); };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button variant={mode === "connect" ? "default" : "outline"} className="rounded-full" onClick={() => setMode("connect")}>Connect a domain you own</Button>
        <Button variant={mode === "find" ? "default" : "outline"} className="rounded-full" onClick={() => setMode("find")}>Find a new domain</Button>
      </div>
      {mode === "find" ? (
        <DomainSearch surface="spaces" proceedLabel="Request this domain" onProceed={(r) => nav(`/services/business-email/start?package=email_domain&domain=${encodeURIComponent(r.name)}`)} />
      ) : (
        <>
          {canManage && (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input value={host} onChange={(e) => setHost(e.target.value)} placeholder="app.yourbusiness.com" className="rounded-full" />
              <Button className="rounded-full" onClick={add}>Add domain</Button>
            </div>)}
          <p className="text-sm text-muted-foreground">You don't need to buy your domain through Loumilab. We never change your DNS — you add these records at your domain provider, then our team confirms ownership, HTTPS and routing.</p>
          {rows.length === 0 ? <p className="text-sm text-muted-foreground">No custom domains yet.</p> : rows.map((r) => (
            <div key={r.id} className="rounded-3xl border border-border p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-foreground">{r.hostname}</p>
                <span className="text-sm text-muted-foreground">{STATUS[r.status] ?? r.status}</span>
              </div>
              <table className="mt-4 w-full text-left text-xs"><thead className="text-muted-foreground"><tr><th className="py-1 pr-3">Type</th><th className="pr-3">Name</th><th>Value</th></tr></thead>
                <tbody className="font-mono text-foreground">
                  <tr><td className="py-1 pr-3">CNAME</td><td className="pr-3 break-all">{r.hostname}</td><td className="break-all">{slug}.spaces.loumilab.com</td></tr>
                  <tr><td className="py-1 pr-3">TXT</td><td className="pr-3 break-all">_loumilab.{r.hostname}</td><td className="break-all">loumilab-verify={r.verification_token}</td></tr>
                </tbody></table>
              {canManage && <Button variant="ghost" size="sm" className="mt-3" onClick={() => remove(r.id)}>Remove</Button>}
            </div>))}
        </>
      )}
    </div>
  );
}

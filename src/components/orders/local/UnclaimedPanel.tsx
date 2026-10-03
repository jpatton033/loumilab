import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { submitClaim, submitRequest } from "@/lib/local/importer";
import { AffiliationPicker } from "./VisitorListingForm";

type Mode = null | "claim" | "correction" | "removal";

/** Notice + claim / update / removal actions on unclaimed Local profiles. */
const UnclaimedPanel = ({ slug, lastChecked }: { slug: string; lastChecked: string | null }) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [f, setF] = useState({ name: "", role: "", email: "", message: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => { supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session)); }, []);

  const send = async () => {
    setBusy(true);
    try {
      if (mode === "claim") await submitClaim(slug, f.name, f.role, f.message);
      else if (mode) await submitRequest(slug, mode, f.name, f.email, f.message);
      toast({ title: "Thanks — we'll review it", description: mode === "claim" ? "We'll email you once your claim is checked." : "Our team will look at your request." });
      setMode(null); setF({ name: "", role: "", email: "", message: "" });
    } catch (e) { toast({ title: "Couldn't send", description: e instanceof Error ? e.message : String(e), variant: "destructive" }); }
    finally { setBusy(false); }
  };

  return (
    <div className="rounded-3xl border border-border bg-secondary/60 p-5 text-sm">
      <span className="inline-flex rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">Unclaimed</span>
      <p className="mt-3 text-muted-foreground">This business has not claimed its Loumilab Local profile. Information is compiled from public sources and may be incomplete or out of date.</p>
      {lastChecked && <p className="mt-2 text-xs text-muted-foreground">Information last checked {new Date(lastChecked).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</p>}
      <div className="mt-4 grid gap-2">
        <Button className="rounded-full" onClick={() => setMode("claim")}>Own this business? Claim it for free.</Button>
        <Button variant="ghost" className="rounded-full" onClick={() => setMode("correction")}>Suggest an update</Button>
        <Button variant="ghost" className="rounded-full text-muted-foreground" onClick={() => setMode("removal")}>Request removal</Button>
      </div>

      <Dialog open={!!mode} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mode === "claim" ? "Claim this business" : mode === "correction" ? "Suggest an update" : "Request removal"}</DialogTitle>
            <DialogDescription>
              {mode === "claim" ? "Free. No store, plan or payment needed. We review every claim by hand." : "Our team reviews every request."}
            </DialogDescription>
          </DialogHeader>
          {mode === "claim" && !signedIn ? (
            <div className="space-y-3 text-sm">
              <p>Sign in or create a free account first, then come back to this page.</p>
              <Button asChild className="w-full rounded-full"><Link to={`/sign-in?next=${encodeURIComponent(`/orders/local/${slug}`)}`}>Sign in to claim</Link></Button>
            </div>
          ) : (
            <div className="grid gap-3">
              <Input placeholder="Your name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={120} />
              {mode === "claim"
                ? <AffiliationPicker value={f.role} onChange={(v) => setF({ ...f, role: v })} only={["owner", "manager"]} />
                : <Input type="email" placeholder="Your email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} maxLength={160} />}
              <Textarea rows={4} maxLength={mode === "claim" ? 1500 : 2000} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })}
                placeholder={mode === "claim" ? "How can we confirm you run this business? e.g. an email on the business's own domain, or a message from its official Instagram." : mode === "correction" ? "What should be updated?" : "Why should this listing be removed? If you represent the business, tell us how we can confirm it."} />
              <Button disabled={busy || !f.name.trim() || !f.message.trim() || (mode !== "claim" && !f.email.trim())} onClick={send} className="rounded-full">Send</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnclaimedPanel;

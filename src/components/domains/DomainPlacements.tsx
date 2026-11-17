import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DomainSearch from "./DomainSearch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const toRequest = (name: string) => `/services/business-email/start?package=email_domain&domain=${encodeURIComponent(name)}`;

/** Homepage: compact editorial search inside Managed Business Technology. */
export function HomeDomainSearch() {
  const nav = useNavigate();
  return (
    <div className="mt-12 border-t border-atmo-ivory/12 pt-10">
      <h3 className="font-hero text-2xl font-semibold text-atmo-ivory sm:text-3xl">Your next idea starts with a name.</h3>
      <p className="mt-2 text-atmo-ivory/65">Find a domain for your business, brand, or next big idea.</p>
      <div className="mt-6"><DomainSearch surface="business" variant="editorial" limit={5} placeholder="Search a name or domain..." onProceed={(r) => nav(toRequest(r.name))} /></div>
    </div>
  );
}

/** Business Domain page: the primary, fullest search, right under the hero. */
export function BusinessDomainSearch() {
  const nav = useNavigate();
  return (
    <section id="search" className="section-container scroll-mt-24 py-16 lg:py-24" aria-labelledby="domain-search-title">
      <div className="max-w-4xl">
        <h2 id="domain-search-title" className="font-hero text-4xl font-semibold tracking-tight lg:text-6xl">Find the right domain. We'll handle the rest.</h2>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Search available domains and explore professional registration, setup, and management with Loumilab.</p>
      </div>
      <div className="mt-10"><DomainSearch surface="business" variant="full" placeholder="Search a domain or business name..." onProceed={(r) => nav(toRequest(r.name))} /></div>
    </section>
  );
}

/** Spaces public page: concise "Your app. Your domain." block with a search sheet. */
export function SpacesDomainBlock({ ivory, muted, line }: { ivory: string; muted: string; line: string }) {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  return (
    <div className={`mt-10 border-t ${line} pt-6`}>
      <h3 className={`font-hero text-2xl font-semibold ${ivory}`}>Your app. Your domain.</h3>
      <p className={`mt-2 ${muted}`}>Built something worth sharing? Give your application its own address. Find a domain or connect one you already own.</p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-3">
        {[["Your identity", "Launch under your own name."], ["Easy to share", "Give users a memorable link."], ["More control", "Use a domain you own."]].map(([t, b]) => (
          <li key={t}><p className={`font-semibold ${ivory}`}>{t}</p><p className={`text-sm ${muted}`}>{b}</p></li>))}
      </ul>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={() => setOpen(true)} className="inline-flex h-11 items-center rounded-full bg-atmo-ivory px-6 text-sm font-medium text-atmo-obsidian transition-colors hover:bg-atmo-ivory/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Find a Domain</button>
        <Link to="/spaces/sign-in?next=/spaces/app" className={`inline-flex h-11 items-center rounded-full border border-atmo-ivory/25 px-6 text-sm font-medium transition-colors hover:bg-atmo-ivory/10 ${ivory}`}>Connect an Existing Domain</Link>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>Find a domain for your app</DialogTitle><DialogDescription>Live results from the registry. Nothing is bought automatically.</DialogDescription></DialogHeader>
          <DomainSearch surface="spaces" variant="full" limit={6} proceedLabel="Request this domain" onProceed={(r) => { setOpen(false); nav(toRequest(r.name)); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { navMenus } from "@/data/navigation";
import { usePublishedArticles } from "@/lib/kc/queries";
import { usePublishedIssues } from "@/lib/thedot/queries";

type Hit = { label: string; to: string; desc?: string; external?: boolean };

const pages: Hit[] = [
  { label: "Home", to: "/" },
  { label: "About Loumilab", to: "/about" },
  { label: "Contact / Start a Project", to: "/contact" },
  { label: "Loumilab Orders pricing", to: "/orders/pricing" },
  { label: "Loumilab Local", to: "/orders/local" },
];

/** Site-wide search: pages, solutions, products, Knowledge Center and The Dot. */
const SiteSearch = ({ className = "" }: { className?: string }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: articles = [] } = usePublishedArticles({ limit: 60 });
  const { data: issues = [] } = usePublishedIssues(30);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) { e.preventDefault(); setOpen((o) => !o); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const groups = useMemo(() => {
    const byMenu = navMenus.map((m) => ({ heading: m.label, items: m.groups.flatMap((g) => g.items) as Hit[] }));
    return [
      ...byMenu,
      { heading: "Knowledge Center", items: articles.map((a) => ({ label: a.title, desc: a.summary ?? undefined, to: `/resources/${a.kc_sections?.slug ?? "guides"}/${a.slug}` })) },
      { heading: "The Dot.", items: issues.map((i) => ({ label: `Issue ${String(i.issue_number).padStart(3, "0")} — ${i.title}`, desc: i.subtitle ?? undefined, to: `/the-dot/issue/${i.slug}` })) },
      { heading: "Pages", items: pages },
    ].filter((g) => g.items.length);
  }, [articles, issues]);

  const go = (h: Hit) => { setOpen(false); if (h.external) window.open(h.to, "_blank", "noopener"); else navigate(h.to); };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Search Loumilab" className={`inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card/60 px-3 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}>
        <Search size={16} strokeWidth={1.75} />
        <span className="hidden xl:inline">Search</span>
        <kbd className="hidden rounded border border-border px-1.5 text-[0.6875rem] xl:inline">/</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search solutions, products, guides, The Dot.…" />
        <CommandList className="max-h-[60vh]">
          <CommandEmpty>Nothing found. Try “email”, “orders” or “security”.</CommandEmpty>
          {groups.map((g) => (
            <CommandGroup key={g.heading} heading={g.heading}>
              {g.items.map((h) => (
                <CommandItem key={g.heading + h.to} value={`${h.label} ${h.desc ?? ""} ${g.heading}`} onSelect={() => go(h)} className="flex flex-col items-start gap-0.5 py-2.5">
                  <span className="font-medium text-foreground">{h.label}</span>
                  {h.desc && <span className="line-clamp-1 text-xs text-muted-foreground">{h.desc}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default SiteSearch;

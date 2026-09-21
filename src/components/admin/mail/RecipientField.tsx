import { useMemo, useState } from "react";
import { Check, Plus, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CONTACT_GROUPS, EMAIL_RE, parseAddresses, useMailContacts, type Contact } from "@/lib/admin/mail";
import { cn } from "@/lib/utils";

/** Address chips with a searchable picker of known Loumilab contacts. */
export function RecipientField({
  label,
  value,
  onChange,
  withPicker = false,
}: {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  withPicker?: boolean;
}) {
  const [raw, setRaw] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const commit = (text: string) => {
    const parsed = parseAddresses(text).filter((e) => EMAIL_RE.test(e));
    if (parsed.length) onChange([...new Set([...value, ...parsed])]);
    setRaw("");
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background px-2 py-1.5">
      <span className="pl-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      {value.map((e) => (
        <span key={e} className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
          {e}
          <button type="button" aria-label={`Remove ${e}`} onClick={() => onChange(value.filter((v) => v !== e))}>
            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </button>
        </span>
      ))}
      <input
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
            if (raw.trim()) {
              e.preventDefault();
              commit(raw);
            }
          } else if (e.key === "Backspace" && !raw && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => raw.trim() && commit(raw)}
        placeholder={value.length ? "" : "name@example.com"}
        className="min-w-[160px] flex-1 bg-transparent px-1 py-1 text-sm outline-none"
        aria-label={`${label} addresses`}
      />
      {withPicker && (
        <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="gap-1">
              <Users className="h-4 w-4" /> Contacts
            </Button>
          </DialogTrigger>
          <ContactPicker selected={value} onChange={onChange} onClose={() => setPickerOpen(false)} />
        </Dialog>
      )}
    </div>
  );
}

function ContactPicker({
  selected,
  onChange,
  onClose,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
  onClose: () => void;
}) {
  const { data: contacts, isLoading } = useMailContacts();
  const [term, setTerm] = useState("");
  const [group, setGroup] = useState<"all" | Contact["group"]>("all");

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    return (contacts ?? []).filter(
      (c) =>
        (group === "all" || c.group === group) &&
        (!t ||
          c.email.includes(t) ||
          c.label.toLowerCase().includes(t) ||
          (c.hint ?? "").toLowerCase().includes(t)),
    );
  }, [contacts, term, group]);

  const toggle = (email: string) =>
    onChange(selected.includes(email) ? selected.filter((v) => v !== email) : [...selected, email]);

  const addAll = () => onChange([...new Set([...selected, ...filtered.map((c) => c.email)])]);

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Choose recipients</DialogTitle>
        <DialogDescription>Search inquiries, Loumilab Orders merchants and newsletter subscribers.</DialogDescription>
      </DialogHeader>

      <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search name or email" />
      <div className="flex flex-wrap gap-1.5">
        {(["all", ...CONTACT_GROUPS] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGroup(g)}
            className={cn(
              "rounded-full border border-border px-2.5 py-1 text-xs transition-colors",
              group === g ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {g === "all" ? "Everyone" : g}
          </button>
        ))}
        <Button type="button" variant="ghost" size="sm" className="ml-auto gap-1" onClick={addAll} disabled={!filtered.length}>
          <Plus className="h-3.5 w-3.5" /> Add all ({filtered.length})
        </Button>
      </div>

      <div className="max-h-72 overflow-auto rounded-xl border border-border">
        {isLoading && <p className="p-4 text-sm text-muted-foreground">Loading contacts…</p>}
        {!isLoading && !filtered.length && <p className="p-4 text-sm text-muted-foreground">No matches.</p>}
        {filtered.map((c) => {
          const active = selected.includes(c.email);
          return (
            <button
              key={`${c.group}-${c.email}`}
              type="button"
              onClick={() => toggle(c.email)}
              className="flex w-full items-center gap-3 border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-muted"
            >
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded border border-border",
                  active && "bg-foreground text-background",
                )}
              >
                {active && <Check className="h-3 w-3" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{c.label}</span>
                <span className="block truncate text-xs text-muted-foreground">{c.email}</span>
                {c.hint && <span className="block truncate text-xs text-muted-foreground/80">{c.hint}</span>}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.group}</span>
            </button>
          );
        })}
      </div>

      <Button type="button" onClick={onClose}>
        Done · {selected.length} selected
      </Button>
    </DialogContent>
  );
}

export default RecipientField;

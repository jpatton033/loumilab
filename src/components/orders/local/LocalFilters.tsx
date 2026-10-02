import { LOCAL_CATEGORIES, RADIUS_OPTIONS, type LocalSearch } from "@/lib/orders/local";
import { cn } from "@/lib/utils";

interface Props {
  value: LocalSearch;
  onChange: (next: LocalSearch) => void;
  hasZip: boolean;
}

const Toggle = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    aria-pressed={on}
    onClick={onClick}
    className={cn(
      "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
      on ? "border-foreground bg-foreground text-background" : "border-border bg-card text-foreground hover:border-foreground/40",
    )}
  >
    {children}
  </button>
);

const LocalFilters = ({ value, onChange, hasZip }: Props) => (
  <div className="flex flex-col gap-6">
    <div>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Category</p>
      <div className="flex flex-wrap gap-2">
        <Toggle on={!value.category} onClick={() => onChange({ ...value, category: undefined })}>All</Toggle>
        {LOCAL_CATEGORIES.map((c) => (
          <Toggle key={c.id} on={value.category === c.id} onClick={() => onChange({ ...value, category: value.category === c.id ? undefined : c.id })}>
            {c.label}
          </Toggle>
        ))}
      </div>
    </div>
    <div>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Distance {!hasZip && <span className="normal-case tracking-normal">(enter a ZIP code)</span>}
      </p>
      <div className={cn("flex flex-wrap gap-2", !hasZip && "pointer-events-none opacity-50")}>
        {RADIUS_OPTIONS.map((r) => (
          <Toggle key={r} on={(value.radius ?? 25) === r} onClick={() => onChange({ ...value, radius: r })}>{r} mi</Toggle>
        ))}
      </div>
    </div>
    <div>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Ordering</p>
      <div className="flex flex-wrap gap-2">
        <Toggle on={!!value.pickup} onClick={() => onChange({ ...value, pickup: !value.pickup })}>Pickup</Toggle>
        <Toggle on={!!value.delivery} onClick={() => onChange({ ...value, delivery: !value.delivery })}>Delivery</Toggle>
        <Toggle on={!!value.accepting} onClick={() => onChange({ ...value, accepting: !value.accepting })}>Accepting orders</Toggle>
      </div>
    </div>
  </div>
);

export default LocalFilters;

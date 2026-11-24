import { useMemo, useState } from "react";

export interface GNode { key: string; label: string; mentions?: number }
export interface GEdge { id: string; source_key: string; target_key: string; predicate: string; weight: number; contradicted?: boolean; status?: string }

/** Circular relationship graph: hover or focus a node to highlight its links. */
export default function RelationGraph({ nodes, edges, onSelect, selected, plain }: { nodes: GNode[]; edges: GEdge[]; onSelect?: (id: string) => void; selected?: string | null; plain?: boolean }) {
  const [hover, setHover] = useState<string | null>(null);
  const pos = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    nodes.forEach((n, i) => { const a = (i / Math.max(nodes.length, 1)) * Math.PI * 2 - Math.PI / 2; m.set(n.key, { x: 300 + Math.cos(a) * 210, y: 230 + Math.sin(a) * 170 }); });
    return m;
  }, [nodes]);
  if (!nodes.length) return <div className="flex h-72 items-center justify-center rounded-3xl border border-atmo-ivory/10 text-sm text-atmo-ivory/50">No relationships yet.</div>;
  return (
    <svg viewBox="0 0 600 460" className="w-full rounded-3xl border border-atmo-ivory/10 bg-atmo-charcoal/30" role="img" aria-label={`Relationship graph with ${nodes.length} items and ${edges.length} links`}>
      {edges.map((e) => {
        const a = pos.get(e.source_key), b = pos.get(e.target_key); if (!a || !b) return null;
        const lit = !hover || hover === e.source_key || hover === e.target_key || selected === e.id;
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        return (
          <g key={e.id} className="cursor-pointer" onClick={() => onSelect?.(e.id)} opacity={lit ? 1 : 0.15} style={{ transition: "opacity 200ms" }}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={e.contradicted ? "stroke-destructive" : selected === e.id ? "stroke-dot" : "stroke-atmo-ivory"} strokeOpacity={0.25 + e.weight * 0.6} strokeWidth={1 + e.weight * 3} strokeDasharray={e.contradicted ? "5 5" : undefined} />
            <text x={mx} y={my - 6} textAnchor="middle" className="fill-atmo-ivory/70 text-[11px]">{plain ? e.predicate : `${e.predicate} · ${e.weight.toFixed(2)}`}</text>
          </g>);
      })}
      {nodes.map((n) => { const p = pos.get(n.key)!; return (
        <g key={n.key} tabIndex={0} onMouseEnter={() => setHover(n.key)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(n.key)} onBlur={() => setHover(null)} className="outline-none">
          <circle cx={p.x} cy={p.y} r={6 + Math.min(n.mentions ?? 1, 6) * 1.5} className="fill-atmo-ivory" />
          <text x={p.x} y={p.y + 26} textAnchor="middle" className="fill-atmo-ivory text-[13px] font-medium">{n.label}</text>
        </g>); })}
    </svg>
  );
}

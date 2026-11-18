import { NavLink } from "react-router-dom";
import Layout from "@/components/Layout";
import { cn } from "@/lib/utils";

const tabs = [["/senti", "Overview"], ["/senti/lab", "Lab"], ["/senti/research", "Research"], ["/senti/updates", "Updates"]] as const;

export function SentiNav() {
  return (
    <nav aria-label="Senti" className="border-b border-atmo-ivory/10 bg-atmo-obsidian">
      <div className="section-container flex gap-6 overflow-x-auto py-4 text-sm">
        <span className="font-hero font-semibold text-atmo-ivory">Senti<span className="text-atmo-ivory/50"> by Loumilab</span></span>
        {tabs.map(([to, l]) => (
          <NavLink key={to} to={to} end className={({ isActive }) => cn("whitespace-nowrap transition-colors", isActive ? "text-atmo-ivory" : "text-atmo-ivory/55 hover:text-atmo-ivory")}>{l}</NavLink>
        ))}
      </div>
    </nav>
  );
}

export default function SentiShell({ children, nav = true }: { children: React.ReactNode; nav?: boolean }) {
  return <Layout><div className="bg-atmo-obsidian text-atmo-ivory [&_h1]:text-atmo-ivory [&_h2]:text-atmo-ivory [&_h3]:text-atmo-ivory">{nav && <SentiNav />}{children}</div></Layout>;
}

export const Eyebrow = ({ children }: { children: React.ReactNode }) => <p className="text-xs font-semibold uppercase tracking-[0.18em] text-atmo-ivory/55">{children}</p>;

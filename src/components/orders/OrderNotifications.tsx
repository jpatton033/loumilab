import { useEffect, useState } from "react";
import { Bell, CheckCircle2, CreditCard, Package } from "lucide-react";

const notifications = [
  { id: "n1", icon: Bell, title: "New Order", detail: "$24.00" },
  { id: "n2", icon: CheckCircle2, title: "Order #1042 Confirmed", detail: "Sunday Kitchen" },
  { id: "n3", icon: CreditCard, title: "Payment Received", detail: "$24.00" },
  { id: "n4", icon: Package, title: "Ready for Pickup", detail: "Order #1042" },
];

/** Subtle, looping order notifications shown around the hero phone mockup. */
const OrderNotifications = ({ className }: { className?: string }) => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % notifications.length), 2600);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className={className} aria-hidden="true">
      <div className="space-y-3">
        {notifications.map((n, i) => {
          const Icon = n.icon;
          const isActive = i === active;
          return (
            <div
              key={n.id}
              className={`flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-[var(--shadow-soft)] transition-all duration-700 ${
                isActive ? "translate-x-0 opacity-100" : "translate-x-2 opacity-45"
              }`}
              style={{ transitionTimingFunction: "var(--ease-brand)" }}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-500 ${
                  isActive ? "bg-accent/10 text-accent" : "bg-secondary text-muted-foreground"
                }`}
              >
                <Icon size={15} />
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-semibold">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderNotifications;

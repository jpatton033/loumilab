import {
  BadgePercent,
  BookOpen,
  Dot,
  FileClock,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  UserCog,
  Mail,
  MapPinned,
  ScrollText,
  Send,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Store,
  Tags,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { AdminCounts } from "@/lib/admin/queries";

export interface AdminNavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  /** Extra path prefixes that should mark this item active. */
  match?: string[];
  /** Resolves the badge shown next to the label. */
  badge?: (counts?: AdminCounts) => string | number | undefined;
  tag?: string;
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
  /** Visible to Help Desk support staff (not only full admins). */
  support?: boolean;
}

export const adminNav: AdminNavGroup[] = [
  {
    label: "Workspace",
    items: [
      { title: "Overview", url: "/admin/overview", icon: LayoutDashboard },
      {
        title: "Inquiries",
        url: "/admin/inquiries",
        icon: Inbox,
        badge: (c) => (c?.inquiriesNew ? c.inquiriesNew : undefined),
      },
    ],
  },
  {
    label: "Support",
    support: true,
    items: [
      { title: "Help Desk", url: "/admin/support", icon: LifeBuoy, match: ["/admin/support/"] },
      { title: "Support Team", url: "/admin/support-team", icon: UserCog },
    ],
  },
  {
    label: "Mail",
    items: [{ title: "Loumilab Mail", url: "/admin/mail", icon: Send }],
  },
  {
    label: "Content",
    items: [
      {
        title: "Knowledge Center",
        url: "/admin/knowledge",
        icon: BookOpen,
        match: ["/admin/knowledge"],
      },
      { title: "The Dot.", url: "/admin/the-dot", icon: Dot, match: ["/admin/the-dot"] },
      { title: "Hero Showcase", url: "/admin/hero", icon: Sparkles },
      { title: "Newsletter", url: "/admin/newsletter", icon: Mail },
    ],
  },
  {
    label: "Orders",
    items: [
      { title: "Overview", url: "/admin/orders", icon: ShoppingBag },
      { title: "Merchants & Contacts", url: "/admin/merchants", icon: Users },
      { title: "Plans & Fees", url: "/admin/plans", icon: Tags },
      { title: "Promotions", url: "/admin/promotions", icon: BadgePercent },
      { title: "Industries", url: "/admin/industries", icon: Store },
      { title: "Custom Projects", url: "/admin/custom-projects", icon: Wrench },
      { title: "Local Importer", url: "/admin/local-importer", icon: MapPinned },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Daily Brief", url: "/admin/reports/daily-brief", icon: FileClock },
      { title: "Brief Settings", url: "/admin/settings/daily-brief", icon: SlidersHorizontal },
    ],
  },
  {
    label: "Governance",
    items: [{ title: "Audit Log", url: "/admin/audit-log", icon: ScrollText }],
  },
];


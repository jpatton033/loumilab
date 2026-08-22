import {
  BookOpen,
  Inbox,
  LayoutDashboard,
  Mail,
  ShoppingBag,
  Sparkles,
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
    label: "Content",
    items: [
      {
        title: "Knowledge Center",
        url: "/admin/knowledge",
        icon: BookOpen,
        match: ["/admin/knowledge"],
      },
      { title: "Hero Showcase", url: "/admin/hero", icon: Sparkles },
      { title: "Newsletter", url: "/admin/newsletter", icon: Mail },
    ],
  },
  {
    label: "Products",
    items: [{ title: "Orders", url: "/admin/orders", icon: ShoppingBag, tag: "Preview" }],
  },
];

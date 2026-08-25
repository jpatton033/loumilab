import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Loumilab Orders is industry-adaptive. An industry row carries the wording,
 * the dashboard/storefront modules and the workflow stages for that kind of
 * business, so adding HVAC or pest control later is a database row — not code.
 *
 * Food industries stay first and remain the flagship experience.
 */

export type ModuleKey =
  | "orders"
  | "jobs"
  | "menu"
  | "products"
  | "services"
  | "customers"
  | "schedule"
  | "estimates"
  | "payments"
  | "analytics";

export interface IndustryTerms {
  catalog: string;
  catalogItem: string;
  transaction: string;
  transactions: string;
  schedule: string;
  notes: string;
  location: string;
  customer: string;
  cta: string;
}

export interface OrdersIndustry {
  id: string;
  slug: string;
  name: string;
  group_label: string;
  description: string | null;
  icon: string;
  is_food: boolean;
  is_active: boolean;
  display_order: number;
  terminology: Partial<IndustryTerms>;
  modules: ModuleKey[];
  workflow: string[];
  default_purchase_models: string[];
  created_at: string;
  updated_at: string;
}

export const DEFAULT_TERMS: IndustryTerms = {
  catalog: "Products & Services",
  catalogItem: "Item",
  transaction: "Order",
  transactions: "Orders",
  schedule: "Scheduling",
  notes: "Customer notes",
  location: "Location",
  customer: "Customer",
  cta: "Get Started",
};

export const DEFAULT_MODULES: ModuleKey[] = [
  "orders",
  "products",
  "customers",
  "payments",
  "analytics",
];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  orders: "Orders",
  jobs: "Jobs",
  menu: "Menu",
  products: "Products",
  services: "Services",
  customers: "Customers",
  schedule: "Schedule",
  estimates: "Estimates",
  payments: "Payments",
  analytics: "Analytics",
};

/** Which entitlement, if any, a module depends on. */
export const MODULE_ENTITLEMENT: Partial<Record<ModuleKey, string>> = {
  schedule: "orders.scheduling",
  estimates: "quotes.enabled",
};

export interface PurchaseModel {
  id: string;
  label: string;
  description: string;
}

export const PURCHASE_MODELS: PurchaseModel[] = [
  { id: "products", label: "Products", description: "Customers buy items at a set price." },
  { id: "services", label: "Services", description: "Customers request work you perform." },
  { id: "appointments", label: "Appointments", description: "Customers book a time with you." },
  { id: "custom_quotes", label: "Custom quotes", description: "Every job is priced individually." },
  { id: "recurring", label: "Recurring work", description: "Repeat visits or ongoing plans." },
];

const INDUSTRY_COLUMNS =
  "id, slug, name, group_label, description, icon, is_food, is_active, display_order, terminology, modules, workflow, default_purchase_models, created_at, updated_at";

const normalize = (rows: unknown[]): OrdersIndustry[] =>
  (rows ?? []).map((r) => {
    const row = r as OrdersIndustry;
    return {
      ...row,
      terminology: (row.terminology ?? {}) as Partial<IndustryTerms>,
      modules: (row.modules ?? []) as ModuleKey[],
      workflow: (row.workflow ?? []) as string[],
      default_purchase_models: row.default_purchase_models ?? [],
    };
  });

/** Industries a merchant can pick from. */
export const useIndustries = () =>
  useQuery({
    queryKey: ["orders", "industries", "active"],
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<OrdersIndustry[]> => {
      const { data, error } = await supabase
        .from("orders_industries")
        .select(INDUSTRY_COLUMNS)
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return normalize(data ?? []);
    },
  });

/** Every industry, including inactive ones — admin only via RLS. */
export const useAllIndustries = () =>
  useQuery({
    queryKey: ["orders", "industries", "all"],
    queryFn: async (): Promise<OrdersIndustry[]> => {
      const { data, error } = await supabase
        .from("orders_industries")
        .select(INDUSTRY_COLUMNS)
        .order("display_order");
      if (error) throw error;
      return normalize(data ?? []);
    },
  });

/* ------------------------------- resolvers -------------------------------- */

export const resolveTerms = (industry?: OrdersIndustry | null): IndustryTerms => ({
  ...DEFAULT_TERMS,
  ...(industry?.terminology ?? {}),
});

export const resolveModules = (industry?: OrdersIndustry | null): ModuleKey[] =>
  industry?.modules?.length ? industry.modules : DEFAULT_MODULES;

export const resolveWorkflow = (industry?: OrdersIndustry | null): string[] =>
  industry?.workflow?.length ? industry.workflow : ["New", "Confirmed", "In Progress", "Completed"];

export const findIndustry = (industries: OrdersIndustry[] | undefined, slug: string | null | undefined) =>
  industries?.find((i) => i.slug === slug) ?? null;

/** Group industries for pickers, keeping food-first ordering. */
export const groupIndustries = (industries: OrdersIndustry[]) => {
  const groups: { label: string; items: OrdersIndustry[] }[] = [];
  industries.forEach((industry) => {
    const group = groups.find((g) => g.label === industry.group_label);
    if (group) group.items.push(industry);
    else groups.push({ label: industry.group_label, items: [industry] });
  });
  return groups;
};

/** Convenience hook: resolve terms + modules + workflow for one industry slug. */
export const useIndustryExperience = (slug: string | null | undefined) => {
  const { data: industries, isLoading } = useIndustries();
  const industry = findIndustry(industries, slug ?? "food-catering");
  return {
    isLoading,
    industries: industries ?? [],
    industry,
    terms: resolveTerms(industry),
    modules: resolveModules(industry),
    workflow: resolveWorkflow(industry),
  };
};

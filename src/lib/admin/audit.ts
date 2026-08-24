import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

/**
 * Append-only audit trail. Every significant admin action (plan change, fee
 * override, refund decision, merchant suspension, support-view session…) must
 * be recorded. Row-level security allows insert + select for staff only, and
 * grants no update or delete to anyone.
 */
export interface AuditEntry {
  action: string;
  targetType?: string;
  targetId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export const logAudit = async (entry: AuditEntry) => {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return;

  const { error } = await supabase.from("audit_logs").insert({
    actor_id: user.id,
    actor_email: user.email ?? null,
    actor_role: "admin",
    action: entry.action,
    target_type: entry.targetType ?? null,
    target_id: entry.targetId ?? null,
    old_value: (entry.oldValue ?? null) as never,
    new_value: (entry.newValue ?? null) as never,
    reason: entry.reason ?? null,
    metadata: (entry.metadata ?? null) as never,
  });

  // An audit failure must never silently pass as success for the caller.
  if (error) throw error;
};

export interface AuditLogRow {
  id: string;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  old_value: unknown;
  new_value: unknown;
  reason: string | null;
  created_at: string;
}

export const useAuditLog = (limit = 100) =>
  useQuery({
    queryKey: ["admin", "audit-log", limit],
    queryFn: async (): Promise<AuditLogRow[]> => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, actor_email, actor_role, action, target_type, target_id, old_value, new_value, reason, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as AuditLogRow[];
    },
  });

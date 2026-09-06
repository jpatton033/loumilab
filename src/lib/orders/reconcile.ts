import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Stripe webhooks can be delayed or dropped, which used to leave a genuinely
 * paid order stuck on "Awaiting payment". These helpers ask Stripe directly and
 * finish the order server-side, so payment status is self-healing.
 */

type SyncResult = { synced?: number; status?: string; error?: string };

export const syncOrders = async (body: { token?: string } = {}): Promise<SyncResult> => {
  const { data, error } = await supabase.functions.invoke<SyncResult>("orders-order-sync", { body });
  if (error) return { error: error.message };
  return data ?? {};
};

/**
 * Sweeps the merchant's pending orders once per mount (and again whenever the
 * pending count changes), refreshing the dashboard when something settled.
 */
export const useReconcilePendingOrders = (merchantId?: string, pendingCount = 0) => {
  const qc = useQueryClient();
  const lastRun = useRef<string>("");

  useEffect(() => {
    if (!merchantId || pendingCount < 1) return;
    const signature = `${merchantId}:${pendingCount}`;
    if (lastRun.current === signature) return;
    lastRun.current = signature;

    void (async () => {
      const result = await syncOrders();
      if (result.synced && result.synced > 0) {
        await qc.invalidateQueries({ queryKey: ["orders", "live-orders", merchantId] });
        await qc.invalidateQueries({ queryKey: ["orders", "merchant-orders", merchantId] });
      }
    })();
  }, [merchantId, pendingCount, qc]);
};

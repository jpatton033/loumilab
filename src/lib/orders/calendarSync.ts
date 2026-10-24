import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type CalendarProvider = "google" | "microsoft";

export const PROVIDER_LABELS: Record<CalendarProvider, string> = {
  google: "Google Calendar",
  microsoft: "Outlook",
};

export interface CalendarLink {
  provider: CalendarProvider;
  calendar_id: string | null;
  calendar_name: string | null;
  account_email: string | null;
  reconnect_required: boolean;
}

export interface JobCalendarEvent {
  job_id: string;
  sync_status: "pending" | "synced" | "failed" | "removed";
  last_error: string | null;
}

async function invoke<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(fn, { body });
  if (error) {
    let msg = error.message;
    if (error instanceof FunctionsHttpError) {
      try {
        const j = await error.context.clone().json();
        msg = j?.error ?? msg;
      } catch {
        /* keep message */
      }
    }
    throw new Error(msg);
  }
  return data as T;
}

const LINK_KEY = ["orders", "calendar-link"] as const;
const EVENTS_KEY = ["orders", "calendar-events"] as const;

export const useCalendarLink = (merchantId?: string | null) =>
  useQuery({
    queryKey: [...LINK_KEY, merchantId],
    enabled: !!merchantId,
    queryFn: async (): Promise<CalendarLink | null> => {
      const { data, error } = await supabase
        .from("merchant_calendar_links")
        .select("provider, calendar_id, calendar_name, account_email, reconnect_required")
        .eq("merchant_id", merchantId as string)
        .maybeSingle();
      if (error) throw error;
      return (data as CalendarLink) ?? null;
    },
  });

export const useJobCalendarEvents = (merchantId?: string | null) =>
  useQuery({
    queryKey: [...EVENTS_KEY, merchantId],
    enabled: !!merchantId,
    queryFn: async (): Promise<Record<string, JobCalendarEvent>> => {
      const { data, error } = await supabase
        .from("merchant_job_calendar_events")
        .select("job_id, sync_status, last_error")
        .eq("merchant_id", merchantId as string);
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((r) => [r.job_id, r as JobCalendarEvent]));
    },
  });

export const useCalendarList = (enabled: boolean) =>
  useQuery({
    queryKey: ["orders", "calendar-list"],
    enabled,
    retry: false,
    queryFn: () =>
      invoke<{ calendars?: { id: string; name: string; primary: boolean }[]; reconnectRequired?: boolean }>(
        "calendar-manage",
        { action: "list_calendars" }
      ),
  });

export const useInvalidateCalendar = () => {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: LINK_KEY });
    void qc.invalidateQueries({ queryKey: EVENTS_KEY });
    void qc.invalidateQueries({ queryKey: ["orders", "calendar-list"] });
  };
};

export const useSelectCalendar = () => {
  const inv = useInvalidateCalendar();
  return useMutation({
    mutationFn: (c: { id: string; name: string }) =>
      invoke("calendar-manage", { action: "select", calendar_id: c.id, calendar_name: c.name }),
    onSuccess: inv,
  });
};

export const useDisconnectCalendar = () => {
  const inv = useInvalidateCalendar();
  return useMutation({ mutationFn: () => invoke("calendar-manage", { action: "disconnect" }), onSuccess: inv });
};

/** Mirror one job onto the merchant's calendar; never throws into the job flow. */
export async function syncJobToCalendar(jobId: string) {
  try {
    return await invoke<{ status: string }>("calendar-sync", { job_id: jobId });
  } catch (e) {
    console.error("calendar-sync failed:", e);
    return null;
  }
}

export async function retryFailedCalendarSyncs() {
  try {
    return await invoke("calendar-sync", { retry_failed: true });
  } catch {
    return null;
  }
}

function waitForOAuthCompletion(popup: Window, connectorId: string) {
  return new Promise<void>((resolve, reject) => {
    let poll: number | undefined;
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      if (poll !== undefined) window.clearInterval(poll);
    };
    const onMessage = (event: MessageEvent) => {
      const type = event.data?.type;
      if (
        event.origin !== window.location.origin ||
        event.source !== popup ||
        event.data?.connectorId !== connectorId ||
        (type !== "appUserConnectorOAuthComplete" && type !== "appUserConnectorOAuthFailed")
      )
        return;
      cleanup();
      if (type === "appUserConnectorOAuthComplete") return resolve();
      popup.close();
      reject(new Error(event.data?.reason ?? "The calendar connection didn't finish."));
    };
    window.addEventListener("message", onMessage);
    poll = window.setInterval(() => {
      if (!popup.closed) return;
      cleanup();
      reject(new Error("The sign-in window closed before finishing."));
    }, 500);
  });
}

export const CONNECTOR_IDS: Record<CalendarProvider, string> = {
  google: "google_calendar",
  microsoft: "microsoft_outlook",
};

/** Call directly inside a click handler so the popup isn't blocked. */
export async function connectCalendar(provider: CalendarProvider) {
  const popup = window.open("", "lovable-oauth", "width=600,height=720");
  if (!popup) throw new Error("Your browser blocked the sign-in window. Allow pop-ups and try again.");
  try {
    const { authorizationUrl } = await invoke<{ authorizationUrl: string }>("calendar-oauth-start", {
      provider,
      origin: window.location.origin,
    });
    const done = waitForOAuthCompletion(popup, CONNECTOR_IDS[provider]);
    popup.location.href = authorizationUrl;
    await done;
  } catch (e) {
    popup.close();
    throw e;
  }
}

export async function completeCalendarOAuth(provider: CalendarProvider, code: string) {
  await invoke("calendar-oauth-complete", { provider, code });
}

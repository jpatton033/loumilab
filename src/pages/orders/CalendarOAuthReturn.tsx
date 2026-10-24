import { useEffect, useState } from "react";
import { CONNECTOR_IDS, completeCalendarOAuth, type CalendarProvider } from "@/lib/orders/calendarSync";

/** Popup landing page after Google/Microsoft consent. Forwards only the one-time code. */
const CalendarOAuthReturn = ({ provider }: { provider: CalendarProvider }) => {
  const [message, setMessage] = useState("Finishing your calendar connection…");
  const connectorId = CONNECTOR_IDS[provider];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const notify = (type: "appUserConnectorOAuthComplete" | "appUserConnectorOAuthFailed", reason?: string) => {
      window.opener?.postMessage({ type, connectorId, reason }, window.location.origin);
    };
    if (params.get("success") !== "true") {
      setMessage("The calendar connection didn't finish. You can close this window and try again.");
      notify("appUserConnectorOAuthFailed");
      window.close();
      return;
    }
    const code = params.get("code");
    if (!code) {
      const reason =
        params.get("offline_access_allowed") === "false"
          ? "This calendar connection can't be used yet: offline access must be enabled on the workspace calendar app."
          : "The calendar connection didn't finish.";
      setMessage(reason);
      notify("appUserConnectorOAuthFailed", reason);
      return;
    }
    completeCalendarOAuth(provider, code)
      .then(() => {
        notify("appUserConnectorOAuthComplete");
        window.close();
      })
      .catch(() => {
        setMessage("We couldn't finish the connection. Close this window and try again.");
        notify("appUserConnectorOAuthFailed");
        window.close();
      });
  }, [provider, connectorId]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
};

export default CalendarOAuthReturn;

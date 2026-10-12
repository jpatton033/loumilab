import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { unsubscribeDot } from "@/lib/thedot/queries";

const TheDotUnsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<"working" | "done" | "error">("working");

  useEffect(() => {
    if (!/^[0-9a-f-]{36}$/i.test(token)) {
      setState("error");
      return;
    }
    unsubscribeDot(token)
      .then((ok) => setState(ok ? "done" : "error"))
      .catch(() => setState("error"));
  }, [token]);

  return (
    <Layout>
      <SEOHead title="Unsubscribe | The Dot." description="Manage your The Dot. subscription." path="/the-dot/unsubscribe" noindex />
      <section className="container mx-auto max-w-xl px-6 py-32 text-center">
        <h1 className="font-hero text-4xl font-bold text-foreground">
          {state === "working" ? "One moment…" : state === "done" ? "You're unsubscribed." : "Link not recognised."}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {state === "done"
            ? "You won't receive new issues of The Dot. by email. The archive is always open."
            : state === "error"
              ? "This unsubscribe link is invalid or already used. Contact hello@loumilab.com if you keep receiving emails."
              : ""}
        </p>
        <Link to="/the-dot" className="mt-8 inline-block text-accent hover:underline">
          Back to The Dot.
        </Link>
      </section>
    </Layout>
  );
};

export default TheDotUnsubscribe;

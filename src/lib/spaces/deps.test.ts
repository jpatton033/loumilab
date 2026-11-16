import { describe, it, expect } from "vitest";
import { detectDependencies, checkEnvVar, scanArtifact, redact } from "../../../supabase/functions/_shared/spacesDeps";

const files: Record<string, string> = {
  "app/package.json": JSON.stringify({ dependencies: { "@supabase/supabase-js": "2", "@stripe/stripe-js": "1" }, devDependencies: { vite: "5" } }),
  "app/src/integrations/supabase/client.ts": "export const supabase = createClient(SUPABASE_URL, KEY)",
  "app/src/pages/Login.tsx": "await supabase.auth.signInWithPassword({email})",
  "app/src/pages/Pay.tsx": "await supabase.functions.invoke('create-checkout'); loadStripe(pk)",
  "app/supabase/migrations/001.sql": "create table t(); alter table t enable row level security;",
  "app/supabase/functions/create-checkout/index.ts": "stripe.checkout.sessions.create()",
};
const deps = detectDependencies(Object.keys(files), (p) => files[p] ?? null);
const ids = deps.map((d) => d.id);
const svc = "eyJhbGciOiJIUzI1NiJ9." + btoa(JSON.stringify({ role: "service_role" })).replace(/=/g, "") + ".sig";

describe("Spaces dependency detection", () => {
  it("finds Supabase database, auth, functions, RLS, Vite and Stripe", () => {
    for (const id of ["supabase_db", "supabase_auth", "supabase_functions", "supabase_rls", "vite", "stripe"]) expect(ids).toContain(id);
  });
  it("never marks anything verified from source alone", () => expect(deps.some((d) => d.status === "verified")).toBe(false));
  it("finds nothing in a plain static site", () => expect(detectDependencies(["index.html"], () => "<html>")).toEqual([]));
});

describe("Spaces env var rules", () => {
  it("refuses service-role keys even as private", () => expect(checkEnvVar("SB_KEY", svc, "private_build")).toMatch(/never accepted/));
  it("refuses Stripe secret keys as public", () => expect(checkEnvVar("VITE_STRIPE", "sk_live_abc123", "public")).toMatch(/Stripe secret key/));
  it("accepts a publishable value", () => expect(checkEnvVar("VITE_SUPABASE_URL", "https://x.supabase.co", "public")).toBeNull());
  it("public names must start with VITE_", () => expect(checkEnvVar("API_URL", "x", "public")).not.toBeNull());
  it("flags private values leaked into built files", () => expect(scanArtifact("a='supersecretvalue'", ["supersecretvalue"])).toContain("private build value"));
  it("redacts private values from logs", () => expect(redact("token=supersecret ok", ["supersecret"])).toBe("token=••• ok"));
});

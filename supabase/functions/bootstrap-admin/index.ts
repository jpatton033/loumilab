// One-time bootstrap: creates the Loumilab super admin account and grants the
// admin role. It refuses to run once any admin already exists, so it cannot be
// used to mint additional privileged accounts.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const ADMIN_EMAIL = "hello@loumilab.com";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const handler = async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  console.log("bootstrap-admin invoked", {
    hasUrl: Boolean(Deno.env.get("SUPABASE_URL")),
    hasServiceKey: Boolean(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")),
  });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { count, error: countError } = await admin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  console.log("role count", { count, countError: countError?.message });
  if (countError) return json({ error: countError.message }, 500);
  if ((count ?? 0) > 0) return json({ status: "already_bootstrapped" });

  // Random throwaway password — the real one is set through the reset flow.
  const tempPassword = crypto.randomUUID().slice(0, 24).toUpperCase() + "!9a";

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: tempPassword,
    email_confirm: true,
  });

  console.log("createUser", { id: created?.user?.id, err: createError?.message });
  let userId = created?.user?.id;

  if (createError) {
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    userId = list?.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL)?.id;
    if (!userId) return json({ error: createError.message }, 500);
  }

  const { error: roleError } = await admin.from("user_roles").insert({ user_id: userId, role: "admin" });
  if (roleError && !roleError.message.includes("duplicate")) return json({ error: roleError.message }, 500);

  console.log("role insert done", userId);
  return json({ status: "ok", email: ADMIN_EMAIL, user_id: userId });
};

Deno.serve(async (req) => {
  try {
    return await handler(req);
  } catch (e) {
    console.error("bootstrap-admin failed", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

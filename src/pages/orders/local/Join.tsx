import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Eyebrow from "@/components/brand/Eyebrow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import LocalProfileCard from "@/components/orders/local/LocalProfileCard";
import { useMyMerchant } from "@/lib/orders/commerce";
import { useCreateLocalMerchant } from "@/lib/orders/local";

const POINTS = ["Free for businesses and customers", "No store, plan or payment setup needed", "Add online ordering later, if you want it"];

/** Free Local listing flow — also the "My Local listing" home for Local-only merchants. */
const LocalJoin = () => {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  const { data: merchant, isLoading } = useMyMerchant();
  const create = useCreateLocalMerchant();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  useEffect(() => { if (user?.email && !email) setEmail(user.email); }, [user]);

  const start = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return toast({ title: "Enter your business name", variant: "destructive" });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return toast({ title: "Enter a valid email", variant: "destructive" });
    try { await create.mutateAsync({ businessName: name, email }); }
    catch (err) { toast({ title: "Couldn't start your listing", description: (err as Error).message, variant: "destructive" }); }
  };

  return (
    <Layout>
      <SEOHead
        title="List Your Food Business on Loumilab Local — Free"
        description="Get discovered locally for free. List your home kitchen, bakery, catering or food truck on Loumilab Local in a few minutes — no payment setup required."
        path="/orders/local/join"
      />
      <section className="section-container pt-14 pb-24 lg:pt-20">
        <Link to="/orders/local" className="text-sm font-medium text-muted-foreground hover:text-foreground">← Loumilab Local</Link>
        <Eyebrow className="mt-8 block">Loumilab Local</Eyebrow>
        <h1 className="mt-4 max-w-3xl font-hero text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          {merchant ? "Your Local listing" : "Get discovered locally — for free."}
        </h1>
        {!merchant && (
          <ul className="mt-6 grid gap-2 text-muted-foreground">
            {POINTS.map((p) => <li key={p} className="flex items-center gap-2"><Check size={16} className="text-accent" /> {p}</li>)}
          </ul>
        )}

        <div className="mt-10">
          {user === undefined || (user && isLoading) ? (
            <div className="h-64 animate-pulse rounded-3xl bg-secondary" />
          ) : !user ? (
            <div className="max-w-xl rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
              <h2 className="font-display text-xl font-semibold">Start your free listing</h2>
              <p className="mt-2 text-sm text-muted-foreground">Sign in or create an account so you can edit your listing anytime. It takes a minute.</p>
              <Button asChild size="lg" className="mt-6 rounded-full">
                <Link to="/sign-in?next=/orders/local/join">Continue <ArrowRight size={16} /></Link>
              </Button>
            </div>
          ) : !merchant ? (
            <form onSubmit={start} className="grid max-w-xl gap-5 rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
              <h2 className="font-display text-xl font-semibold">About your business</h2>
              <div className="grid gap-2">
                <Label htmlFor="join-name">Business name</Label>
                <Input id="join-name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="join-email">Contact email <span className="text-muted-foreground">(private — for Loumilab only)</span></Label>
                <Input id="join-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Button type="submit" size="lg" className="rounded-full" disabled={create.isPending}>
                {create.isPending ? "Starting…" : "Next: your listing"}
              </Button>
            </form>
          ) : (
            <LocalProfileCard merchantId={merchant.id} standalone />
          )}
        </div>
      </section>
    </Layout>
  );
};

export default LocalJoin;
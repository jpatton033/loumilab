import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, MapPin, Search, SlidersHorizontal } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Eyebrow from "@/components/brand/Eyebrow";
import PhotoSplit from "@/components/brand/PhotoSplit";
import localPickup from "@/assets/people/local-pickup.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import LocalBusinessCard from "@/components/orders/local/LocalBusinessCard";
import LocalFilters from "@/components/orders/local/LocalFilters";
import { LOCAL_CATEGORIES, useLocalFeatured, useLocalSearch, type LocalSearch } from "@/lib/orders/local";

const fromParams = (p: URLSearchParams): LocalSearch => ({
  q: p.get("q") ?? "",
  place: p.get("near") ?? "",
  radius: Number(p.get("radius")) || 25,
  category: p.get("category") ?? undefined,
  pickup: p.get("pickup") === "1",
  delivery: p.get("delivery") === "1",
  accepting: p.get("open") === "1",
});

const toParams = (s: LocalSearch) => {
  const p = new URLSearchParams();
  if (s.q) p.set("q", s.q);
  if (s.place) p.set("near", s.place);
  if (s.radius && s.radius !== 25) p.set("radius", String(s.radius));
  if (s.category) p.set("category", s.category);
  if (s.pickup) p.set("pickup", "1");
  if (s.delivery) p.set("delivery", "1");
  if (s.accepting) p.set("open", "1");
  return p;
};

const LocalIndex = () => {
  const [params, setParams] = useSearchParams();
  const search = useMemo(() => fromParams(params), [params]);
  const [q, setQ] = useState(search.q ?? "");
  const [place, setPlace] = useState(search.place ?? "");
  const update = (next: LocalSearch) => setParams(toParams(next), { replace: true });

  // Debounce typing into the URL (and therefore the query).
  useEffect(() => {
    const t = setTimeout(() => {
      if (q !== (search.q ?? "") || place !== (search.place ?? "")) update({ ...search, q, place });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, place]);

  const { data: results = [], isLoading } = useLocalSearch(search);
  const { data: featured = [] } = useLocalFeatured();
  const hasZip = /^\s*\d{5}/.test(search.place ?? "");
  const filtersActive = !!(search.category || search.pickup || search.delivery || search.accepting);
  const searching = !!(search.q || search.place || filtersActive);

  return (
    <Layout>
      <SEOHead
        title="Loumilab Local | Discover Local Food Businesses Near You"
        description="Discover local home chefs, bakers, meal-prep businesses, caterers, food trucks and pop-ups near you on Loumilab Local. Free to browse, no account needed."
        path="/orders/local"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Loumilab Orders", item: "https://loumilab.com/orders" },
              { "@type": "ListItem", position: 2, name: "Loumilab Local", item: "https://loumilab.com/orders/local" },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Local food businesses on Loumilab Local",
            itemListElement: results.slice(0, 20).map((b, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: b.name,
              url: `https://loumilab.com/orders/local/${b.slug}`,
            })),
          },
        ] as never}
      />

      {/* Hero + search */}
      <section className="section-container pt-7 pb-10 lg:pt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-display text-lg font-semibold tracking-tight">Loumilab <span className="text-accent">Local</span></p>
          <Link to="/orders/local/join" className="text-sm font-medium text-muted-foreground hover:text-foreground">List your business — free</Link>
        </div>
        <Eyebrow className="mt-8 block">Discover local food businesses</Eyebrow>
        <h1 className="mt-4 max-w-3xl font-hero text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
          Discover what's cooking near you.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">
          Find local chefs, bakers, meal-prep businesses, caterers, and other independent food businesses in your community.
        </p>

        <form
          role="search"
          onSubmit={(e) => { e.preventDefault(); update({ ...search, q, place }); }}
          className="mt-10 grid gap-2 rounded-3xl border border-border bg-card p-2 shadow-[var(--shadow-soft)] sm:grid-cols-[1.5fr_1fr_auto]"
        >
          <label className="flex items-center gap-3 rounded-2xl px-4">
            <Search size={18} className="shrink-0 text-muted-foreground" />
            <span className="sr-only">Search businesses, food or cuisine</span>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tacos, cupcakes, meal prep, business name…" className="h-12 border-0 px-0 shadow-none focus-visible:ring-0" />
          </label>
          <label className="flex items-center gap-3 rounded-2xl px-4 sm:border-l sm:border-border">
            <MapPin size={18} className="shrink-0 text-muted-foreground" />
            <span className="sr-only">City or ZIP code</span>
            <Input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="City or ZIP" className="h-12 border-0 px-0 shadow-none focus-visible:ring-0" />
          </label>
          <Button type="submit" size="lg" className="h-12 rounded-2xl px-8">Search</Button>
        </form>
      </section>

      {/* Categories */}
      <section className="section-container pb-12">
        <h2 className="font-display text-2xl font-semibold">Explore categories</h2>
        <div className="-mx-4 mt-5 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-9">
          {LOCAL_CATEGORIES.map((c) => {
            const on = search.category === c.id;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={on}
                onClick={() => update({ ...search, category: on ? undefined : c.id })}
                className={`group relative h-28 w-32 shrink-0 snap-start overflow-hidden rounded-2xl border text-left sm:w-auto ${on ? "border-foreground ring-2 ring-foreground" : "border-border"}`}
              >
                <img src={c.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute inset-0 bg-gradient-to-t from-foreground/75 to-transparent" />
                <span className="absolute bottom-3 left-3 right-3 text-sm font-semibold text-background">{c.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured */}
      {!searching && featured.length > 0 && (
        <section className="section-container pb-12">
          <h2 className="font-display text-2xl font-semibold">Featured local businesses</h2>
          <p className="mt-1 text-sm text-muted-foreground">Hand-picked by the Loumilab team.</p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((b) => <LocalBusinessCard key={b.slug} business={b} />)}
          </div>
        </section>
      )}

      {/* Results */}
      <section className="section-container pb-20">
        <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <LocalFilters value={search} onChange={update} hasZip={hasZip} />
            </div>
          </aside>
          <div>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold">
                {searching ? `${results.length} ${results.length === 1 ? "business" : "businesses"}` : "All local businesses"}
              </h2>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="rounded-full lg:hidden">
                    <SlidersHorizontal size={15} /> Filters{filtersActive && " •"}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl">
                  <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
                  <div className="mt-6"><LocalFilters value={search} onChange={update} hasZip={hasZip} /></div>
                </SheetContent>
              </Sheet>
            </div>

            {isLoading ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2].map((i) => <div key={i} className="h-80 animate-pulse rounded-3xl bg-secondary" />)}
              </div>
            ) : results.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-border bg-secondary p-10 text-center">
                <p className="font-display text-lg font-semibold">No businesses match yet.</p>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Try a wider distance, a nearby city, or another category. New local businesses join Loumilab Local every week.
                </p>
                {searching && (
                  <Button variant="outline" className="mt-5 rounded-full" onClick={() => { setQ(""); setPlace(""); update({}); }}>
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((b) => <LocalBusinessCard key={b.slug} business={b} />)}
              </div>
            )}
          </div>
        </div>
      </section>

      <PhotoSplit
        reverse
        image={localPickup}
        alt="A café owner handing a customer her order across the counter of a neighborhood shop"
        eyebrow="Neighborhood discovery"
        title="Find the people who make your neighborhood taste better."
        className="mb-24"
      >
        <p>Bakers, home chefs, caterers and corner cafés — discover who's cooking near you and order straight from them.</p>
      </PhotoSplit>

      {/* Merchant CTA */}
      <section className="section-container pb-24">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-border bg-secondary p-8 sm:flex-row sm:items-center sm:p-12">
          <div>
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">List your business on Loumilab Local. It's free.</h2>
            <p className="mt-2 max-w-lg text-muted-foreground">
              Get discovered by neighbours in a few minutes — no store or payment setup needed. Add online ordering with Loumilab Orders whenever you're ready.
            </p>
          </div>
          <Button asChild size="lg" className="rounded-full">
            <Link to="/orders/local/join">List my business <ArrowRight size={16} /></Link>
          </Button>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">Loumilab Local is part of <Link to="/orders" className="underline underline-offset-4">Loumilab Orders</Link>.</p>
      </section>
    </Layout>
  );
};

export default LocalIndex;

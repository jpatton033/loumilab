import { Link, useParams } from "react-router-dom";
import { ArrowRight, Globe, Mail, MapPin, Phone } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Eyebrow from "@/components/brand/Eyebrow";
import { Button } from "@/components/ui/button";
import UnclaimedPanel from "@/components/orders/local/UnclaimedPanel";
import { categoryLabel, SOCIAL_KEYS, SOCIAL_LABELS, useLocalBusiness } from "@/lib/orders/local";

const LocalBusinessPage = () => {
  const { slug } = useParams();
  const { data: b, isLoading } = useLocalBusiness(slug);

  if (isLoading) return <Layout><div className="section-container py-20"><div className="h-96 animate-pulse rounded-3xl bg-secondary" /></div></Layout>;
  if (!b) {
    return (
      <Layout>
        <section className="section-container py-24 text-center">
          <h1 className="font-display text-3xl font-semibold">This listing isn't available</h1>
          <p className="mt-3 text-muted-foreground">It may have been hidden by the business.</p>
          <Button asChild className="mt-6 rounded-full"><Link to="/orders/local">Explore Loumilab Local</Link></Button>
        </section>
      </Layout>
    );
  }

  const meta = [categoryLabel(b.category), ...(b.cuisines ?? [])].filter(Boolean).join(" · ");
  const photos = (b.gallery_urls ?? []).filter((u) => u !== b.image_url);
  const socials = SOCIAL_KEYS.filter((k) => b.social_links?.[k]);
  const initials = b.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Layout>
      <SEOHead
        title={`${b.name} | Loumilab Local`}
        description={(b.description ?? `${b.name} on Loumilab Local${b.area ? ` — ${b.area}` : ""}.`).slice(0, 155)}
        path={`/orders/local/${b.slug}`}
        jsonLd={{
          "@context": "https://schema.org", "@type": "FoodEstablishment", name: b.name,
          description: b.description ?? undefined, image: b.image_url ?? undefined,
          url: `https://loumilab.com/orders/local/${b.slug}`,
          areaServed: b.area ?? undefined, telephone: b.public_phone ?? undefined,
          sameAs: [b.website_url, ...socials.map((k) => b.social_links[k])].filter(Boolean),
        } as never}
      />
      <section className="section-container pt-10 pb-24 lg:pt-16">
        <Link to="/orders/local" className="text-sm font-medium text-muted-foreground hover:text-foreground">← Loumilab Local</Link>

        <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-secondary">
          {b.image_url ? <img src={b.image_url} alt="" className="aspect-[21/9] w-full object-cover" /> : <div className="aspect-[21/9]" />}
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="flex items-center gap-4">
              {b.logo_url ? (
                <img src={b.logo_url} alt="" className="h-16 w-16 rounded-2xl border border-border object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-foreground font-semibold text-background">{initials}</div>
              )}
              <div className="min-w-0">
                <Eyebrow>Loumilab Local</Eyebrow>
                <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">{b.name}</h1>
              </div>
            </div>
            {meta && <p className="mt-4 text-sm text-muted-foreground">{meta}</p>}
            {b.description && <p className="mt-4 max-w-2xl text-lg">{b.description}</p>}
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {b.area && <span className="inline-flex items-center gap-1"><MapPin size={14} /> {b.area}</span>}
              {b.pickup && <span className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-semibold">Pickup</span>}
              {b.delivery && <span className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-semibold">Delivery</span>}
            </div>

            {b.hours_text && <p className="mt-4 text-sm"><span className="font-semibold">Hours:</span> {b.hours_text}</p>}
            {photos.length > 0 && (
              <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((u) => <img key={u} src={u} alt="" loading="lazy" className="aspect-square w-full rounded-2xl object-cover" />)}
              </div>
            )}
          </div>

          <aside className="h-fit rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] lg:sticky lg:top-28">
            {b.ownership_status === "unclaimed" && <div className="mb-6"><UnclaimedPanel slug={b.slug} lastChecked={b.last_checked_at ?? null} /></div>}
            {b.store_slug ? (
              <>
                <Button asChild size="lg" className="w-full rounded-full">
                  <Link to={`/orders/store/${b.store_slug}?from=local`}>Order Online <ArrowRight size={16} /></Link>
                </Button>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  {b.accepting ? "Accepting orders now" : "Not accepting orders right now — you can still browse the menu"}
                </p>
              </>
            ) : null}
            <div className={`grid gap-2 ${b.store_slug ? "mt-6" : ""}`}>
              {b.website_url && <Button asChild variant="outline" className="justify-start rounded-full"><a href={b.website_url} target="_blank" rel="noopener noreferrer nofollow"><Globe size={15} /> Website</a></Button>}
              {b.public_phone && <Button asChild variant="outline" className="justify-start rounded-full"><a href={`tel:${b.public_phone}`}><Phone size={15} /> {b.public_phone}</a></Button>}
              {b.public_email && <Button asChild variant="outline" className="justify-start rounded-full"><a href={`mailto:${b.public_email}`}><Mail size={15} /> Email</a></Button>}
              {socials.map((k) => (
                <Button key={k} asChild variant="ghost" className="justify-start rounded-full">
                  <a href={b.social_links[k]} target="_blank" rel="noopener noreferrer nofollow">{SOCIAL_LABELS[k]}</a>
                </Button>
              ))}
              {!b.store_slug && !b.website_url && !b.public_phone && !b.public_email && socials.length === 0 && (
                <p className="text-sm text-muted-foreground">This business hasn't added contact options yet.</p>
              )}
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  );
};

export default LocalBusinessPage;
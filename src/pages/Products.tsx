import Layout from "@/components/Layout";
import SectionHeading from "@/components/SectionHeading";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

const products = [
  {
    name: "FormFlow",
    desc: "AI-powered form builder with smart validation and conditional logic. Create beautiful, conversion-optimized forms in minutes.",
    status: "Live" as const,
  },
  {
    name: "MetricPulse",
    desc: "Real-time analytics dashboard for SaaS products. Track MRR, churn, LTV, and user engagement in one unified view.",
    status: "Beta" as const,
  },
  {
    name: "ShipKit",
    desc: "SaaS boilerplate with auth, payments, email, and admin dashboard pre-built. Launch your next product in days.",
    status: "Coming Soon" as const,
  },
  {
    name: "ContentForge",
    desc: "AI content generation platform for marketing teams. Blog posts, social media, email campaigns — all on-brand.",
    status: "Coming Soon" as const,
  },
];

const statusStyles = {
  Live: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  Beta: "bg-accent/10 text-accent border-accent/30",
  "Coming Soon": "bg-muted text-muted-foreground border-border",
};

const Products = () => (
  <Layout>
    <SEOHead
      title="Our Products — FormFlow, MetricPulse, ShipKit — LOUMILAB"
      description="Explore LOUMILAB's product suite: AI form builder, SaaS analytics dashboard, and rapid launch boilerplate."
      path="/products"
    />
    <section className="section-padding pt-32 lg:pt-40">
      <div className="section-container">
        <SectionHeading
          label="Labs / Products"
          title="SaaS products we're building"
          description="We don't just build for clients — we build our own products too. Real-world expertise that directly benefits every project we take on."
        />
        <div className="grid md:grid-cols-2 gap-6">
          {products.map((product) => (
            <div
              key={product.name}
              className="group glass-card rounded-2xl p-8 hover:border-accent/30 transition-all duration-500 glow-hover flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-display text-xl font-semibold">{product.name}</h3>
                <Badge variant="outline" className={statusStyles[product.status]}>
                  {product.status}
                </Badge>
              </div>
              <p className="text-muted-foreground leading-relaxed flex-1">{product.desc}</p>
              {product.status === "Live" && (
                <button className="mt-6 inline-flex items-center gap-2 text-accent text-sm font-medium hover:underline">
                  Visit product <ExternalLink size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  </Layout>
);

export default Products;

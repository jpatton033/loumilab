import Layout from "@/components/Layout";
import SectionHeading from "@/components/SectionHeading";
import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search, PenTool, Hammer, Rocket, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: Search,
    num: "01",
    title: "Discovery & Strategy",
    desc: "We dig into your goals, audience, and competitive landscape to define the product vision, scope, and success metrics.",
  },
  {
    icon: PenTool,
    num: "02",
    title: "UX/UI & Prototyping",
    desc: "Wireframes, user flows, and high-fidelity designs crafted collaboratively. You see and approve before we build.",
  },
  {
    icon: Hammer,
    num: "03",
    title: "Build & Develop",
    desc: "AI-powered development for speed without compromise. We ship production-ready code in rapid iterations.",
  },
  {
    icon: Rocket,
    num: "04",
    title: "Launch Fast",
    desc: "QA, performance optimization, and deployment. We launch lean so you can start learning from real users immediately.",
  },
  {
    icon: TrendingUp,
    num: "05",
    title: "Iterate, Scale & Optimize",
    desc: "Data-driven iterations, feature expansion, and infrastructure scaling based on real user feedback and analytics.",
  },
];

const HowWeWork = () => (
  <Layout>
    <SEOHead
      title="Our Process — From Idea to Launch — LOUMILAB"
      description="Discovery, design, build, launch, and scale. Learn how LOUMILAB delivers digital products with speed and precision."
      path="/how-we-work"
    />
    <section className="section-padding pt-32 lg:pt-40">
      <div className="section-container">
        <SectionHeading
          label="Process"
          title="How we bring products to life"
          description="Transparent, collaborative, and fast. Our product-focused process gets you from idea to launch in weeks."
        />
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[23px] top-8 bottom-8 w-px bg-gradient-to-b from-accent via-border to-transparent hidden lg:block" />

          <div className="space-y-8 lg:space-y-12">
            {steps.map((step) => (
              <div key={step.num} className="relative grid lg:grid-cols-[56px_1fr] gap-6 items-start">
                <div className="relative z-10 w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-display font-semibold text-sm shadow-lg">
                  {step.num}
                </div>
                <div className="glass-card rounded-2xl p-8 hover:border-accent/30 transition-all duration-500 glow-hover">
                  <div className="flex items-center gap-3 mb-3">
                    <step.icon className="text-accent" size={20} />
                    <h3 className="font-display text-xl font-semibold">{step.title}</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed max-w-xl">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-16 text-center">
          <Button variant="accent" size="lg" asChild className="glow-hover">
            <Link to="/contact">
              Start Your Project <ArrowRight size={18} />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  </Layout>
);

export default HowWeWork;

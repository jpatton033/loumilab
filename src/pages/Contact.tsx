import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, Mail } from "lucide-react";
import DiamondLogo from "@/components/DiamondLogo";

const Contact = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Message sent!", description: "We'll get back to you within 24 hours." });
    setForm({ name: "", email: "", company: "", message: "" });
  };

  return (
    <Layout>
      <section className="section-padding pt-32 lg:pt-40">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
            <div>
              <DiamondLogo size="lg" className="mb-8" />
              <span className="inline-block text-accent font-display text-sm font-medium uppercase tracking-[0.2em] mb-4">
                Contact
              </span>
              <h1 className="text-4xl lg:text-5xl font-semibold leading-tight mb-6">
                Let's build something{" "}
                <span className="text-gradient">extraordinary</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-10">
                Have a project in mind? Tell us about it. We respond to every inquiry within 24 hours.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail size={18} className="text-accent" />
                  <span>hello@pristinecollective.dev</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground/80">Name</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                    required
                    className="bg-secondary/50 border-border/50 focus:border-accent focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground/80">Email</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@company.com"
                    required
                    className="bg-secondary/50 border-border/50 focus:border-accent focus:ring-accent/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground/80">Company</label>
                <Input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="Your company (optional)"
                  className="bg-secondary/50 border-border/50 focus:border-accent focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground/80">Tell us about your project</label>
                <Textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="What are you looking to build? Timeline, budget, and any other details..."
                  rows={6}
                  required
                  className="bg-secondary/50 border-border/50 focus:border-accent focus:ring-accent/20 resize-none"
                />
              </div>
              <Button variant="accent" size="lg" type="submit" className="w-full sm:w-auto glow-hover">
                Send Message <Send size={16} />
              </Button>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;

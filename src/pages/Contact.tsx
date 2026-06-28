import { useState } from "react";
import { z } from "zod";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DiamondLogo from "@/components/DiamondLogo";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Please enter a valid email").regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Please enter a valid email address").max(255, "Email must be less than 255 characters"),
  company: z.string().trim().max(200, "Company must be less than 200 characters").optional().or(z.literal("")),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000, "Message must be less than 2000 characters"),
});

const Contact = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);

  const [honeypot, setHoneypot] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot check
    if (honeypot) return;

    // Rate limiting
    const lastSub = localStorage.getItem("last_contact_submission");
    if (lastSub && Date.now() - parseInt(lastSub) < 60000) {
      toast({ title: "Please wait", description: "You can submit again in a moment.", variant: "destructive" });
      return;
    }

    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    const { error } = await supabase
      .from("contact_submissions")
      .insert({
        name: result.data.name,
        email: result.data.email,
        company: result.data.company || null,
        message: result.data.message,
      });

    if (error) {
      toast({ title: "Something went wrong", description: "Please try again or email us directly.", variant: "destructive" });
    } else {
      toast({ title: "Message sent!", description: "We'll get back to you within 24 hours." });
      setForm({ name: "", email: "", company: "", message: "" });
      localStorage.setItem("last_contact_submission", Date.now().toString());

      // Send email notifications (best-effort, don't block on failure)
      try {
        await supabase.functions.invoke("send-contact-email", {
          body: { email: result.data.email },
        });
      } catch (emailError) {
        console.error("Email notification failed:", emailError);
      }
    }
    setSubmitting(false);
  };

  return (
    <Layout>
      <SEOHead
        title="Contact LOUMILAB — Start Your Project Today"
        description="Get in touch to discuss your next website, SaaS product, or digital project. Fast quotes, transparent process."
        path="/contact"
      />
      <section className="section-padding pt-32 lg:pt-40">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
            <div>
              <DiamondLogo size="lg" variant="silver" className="mb-8" />
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
                  <span>hello@loumilab.com</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Honeypot field - hidden from users, catches bots */}
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ position: "absolute", left: "-9999px", opacity: 0 }}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground/80">Name</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                    required
                    className="bg-secondary/50 border-border/50 focus:border-accent focus:ring-accent/20"
                    maxLength={100}
                  />
                  {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
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
                    maxLength={255}
                  />
                  {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground/80">Company</label>
                <Input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="Your company (optional)"
                  className="bg-secondary/50 border-border/50 focus:border-accent focus:ring-accent/20"
                  maxLength={200}
                />
                {errors.company && <p className="text-sm text-destructive mt-1">{errors.company}</p>}
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
                  maxLength={2000}
                />
                {errors.message && <p className="text-sm text-destructive mt-1">{errors.message}</p>}
              </div>
              <Button variant="accent" size="lg" type="submit" className="w-full sm:w-auto glow-hover" disabled={submitting}>
                {submitting ? "Sending..." : "Send Message"} <Send size={16} />
              </Button>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;

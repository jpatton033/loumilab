CREATE TABLE public.hero_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  nav_label text NOT NULL,
  eyebrow text NOT NULL,
  headline text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text,
  attribution text,
  logo_text text,
  accent_hsl text NOT NULL DEFAULT '217 91% 50%',
  treatment text NOT NULL DEFAULT 'app-panels',
  layout text NOT NULL DEFAULT 'split',
  desktop_image_url text,
  mobile_image_url text,
  media_video_url text,
  cta_primary_label text,
  cta_primary_href text,
  cta_secondary_label text,
  cta_secondary_href text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.hero_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hero_products TO authenticated;
GRANT ALL ON public.hero_products TO service_role;

ALTER TABLE public.hero_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active featured hero products"
  ON public.hero_products FOR SELECT TO anon, authenticated
  USING (is_active = true AND is_featured = true);

CREATE POLICY "Admins can view all hero products"
  ON public.hero_products FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert hero products"
  ON public.hero_products FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update hero products"
  ON public.hero_products FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete hero products"
  ON public.hero_products FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_hero_products_updated_at
  BEFORE UPDATE ON public.hero_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX hero_products_order_idx ON public.hero_products (display_order);

INSERT INTO public.hero_products
  (slug, name, nav_label, eyebrow, headline, description, category, attribution, logo_text, accent_hsl, treatment, layout, cta_primary_label, cta_primary_href, cta_secondary_label, cta_secondary_href, display_order)
VALUES
  ('orders', 'Loumilab Orders', 'Orders', 'LOUMILAB ORDERS', 'Turn Followers Into Customers.',
   'Create your storefront. Share your link. Take orders. Get paid.', 'Commerce Platform', 'Built by Loumilab', 'Loumilab Orders',
   '217 91% 50%', 'orders-devices', 'split', 'Explore Orders', '/orders', 'Learn More', '/products', 1),
  ('vurtti', 'Vurtti', 'Vurtti', 'VURTTI', 'Smarter Compliance. Powered by AI.',
   'Modern compliance management, intelligent workflows, and operational visibility built for growing organizations.',
   'Compliance Technology', 'Designed & Developed by Loumilab', 'Vurtti',
   '190 85% 42%', 'vurtti-dashboard', 'centered', 'Explore Vurtti', '/products', 'Visit Vurtti', 'https://www.vurttidocs.com', 2),
  ('digital-experiences', 'Digital Experiences', 'Websites', 'DIGITAL EXPERIENCES', 'Built to Make an Impression.',
   'Modern websites and digital experiences engineered for performance, security, and growth.',
   'Websites', 'Designed by Loumilab', NULL,
   '262 72% 52%', 'browser-stack', 'split', 'Explore Our Work', '/work', NULL, NULL, 3),
  ('software', 'Software by Loumilab', 'Software', 'SOFTWARE BY LOUMILAB', 'Ideas Into Products.',
   'From concept to launch, we design and build software that solves real problems.',
   'Product Engineering', 'Built by Loumilab', NULL,
   '150 60% 38%', 'app-panels', 'centered', 'Explore Products', '/products', NULL, NULL, 4);
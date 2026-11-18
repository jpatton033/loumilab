CREATE TABLE public.senti_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  training_consent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '30 days'
);
CREATE TABLE public.senti_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.senti_sessions(id) ON DELETE CASCADE,
  seq int NOT NULL,
  text text NOT NULL,
  time_hint text,
  polarity smallint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.senti_events (session_id, seq);
CREATE TABLE public.senti_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.senti_sessions(id) ON DELETE CASCADE,
  key text NOT NULL,
  label text NOT NULL,
  kind text NOT NULL DEFAULT 'thing',
  mentions int NOT NULL DEFAULT 1,
  UNIQUE (session_id, key)
);
CREATE TABLE public.senti_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.senti_sessions(id) ON DELETE CASCADE,
  source_key text NOT NULL,
  target_key text NOT NULL,
  predicate text NOT NULL,
  weight real NOT NULL DEFAULT 0,
  support int NOT NULL DEFAULT 0,
  contradict int NOT NULL DEFAULT 0,
  evidence uuid[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','corrected','rejected')),
  revised_from uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, source_key, target_key, predicate)
);
CREATE INDEX ON public.senti_relations (session_id);
CREATE TABLE public.senti_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.senti_sessions(id) ON DELETE CASCADE,
  relation_id uuid,
  action text NOT NULL,
  before jsonb,
  after jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.senti_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'update' CHECK (kind IN ('update','document')),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  version text,
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.senti_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  live_enabled boolean NOT NULL DEFAULT true,
  demo_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.senti_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  op text NOT NULL,
  ok boolean NOT NULL,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.senti_audit (created_at DESC);

GRANT SELECT ON public.senti_sessions, public.senti_events, public.senti_entities, public.senti_relations, public.senti_corrections, public.senti_audit TO authenticated;
GRANT SELECT ON public.senti_updates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.senti_updates TO authenticated;
GRANT SELECT, UPDATE ON public.senti_settings TO authenticated;
GRANT SELECT ON public.senti_settings TO anon;
GRANT ALL ON public.senti_sessions, public.senti_events, public.senti_entities, public.senti_relations, public.senti_corrections, public.senti_updates, public.senti_settings, public.senti_audit TO service_role;

ALTER TABLE public.senti_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.senti_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.senti_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.senti_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.senti_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.senti_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.senti_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.senti_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff read" ON public.senti_sessions FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff read" ON public.senti_events FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff read" ON public.senti_entities FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff read" ON public.senti_relations FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff read" ON public.senti_corrections FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff read" ON public.senti_audit FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "public read published" ON public.senti_updates FOR SELECT TO anon, authenticated USING (published OR public.is_staff(auth.uid()));
CREATE POLICY "staff insert" ON public.senti_updates FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff update" ON public.senti_updates FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff delete" ON public.senti_updates FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "anyone read settings" ON public.senti_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "staff update settings" ON public.senti_settings FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
INSERT INTO public.senti_settings (id) VALUES (1);
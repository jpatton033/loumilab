CREATE TABLE public.senti_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.senti_collections TO authenticated;
GRANT ALL ON public.senti_collections TO service_role;
ALTER TABLE public.senti_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their collections" ON public.senti_collections FOR ALL TO authenticated
  USING (owner_id = auth.uid() AND public.senti_is_researcher(auth.uid()))
  WITH CHECK (owner_id = auth.uid() AND public.senti_is_researcher(auth.uid()));

CREATE TABLE public.senti_explorations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  session_id uuid NOT NULL UNIQUE REFERENCES public.senti_sessions(id) ON DELETE CASCADE,
  collection_id uuid REFERENCES public.senti_collections(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.senti_explorations TO authenticated;
GRANT ALL ON public.senti_explorations TO service_role;
ALTER TABLE public.senti_explorations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read their explorations" ON public.senti_explorations FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Owners update their explorations" ON public.senti_explorations FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners delete their explorations" ON public.senti_explorations FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE TABLE public.senti_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exploration_id uuid NOT NULL REFERENCES public.senti_explorations(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  title text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('text','pdf','docx','txt','markdown','link')),
  original_text text NOT NULL,
  text text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  file_path text,
  sha256 text,
  passages integer NOT NULL DEFAULT 0,
  engine_version text NOT NULL,
  research_consent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, DELETE ON public.senti_sources TO authenticated;
GRANT ALL ON public.senti_sources TO service_role;
ALTER TABLE public.senti_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read their sources" ON public.senti_sources FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Owners delete their sources" ON public.senti_sources FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE INDEX senti_sources_exploration_idx ON public.senti_sources(exploration_id);

ALTER TABLE public.senti_events ADD COLUMN source_id uuid REFERENCES public.senti_sources(id) ON DELETE SET NULL;
ALTER TABLE public.senti_events ADD COLUMN passage_index integer;

CREATE POLICY "Researchers upload own Senti sources" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'senti-sources' AND (storage.foldername(name))[1] = auth.uid()::text AND public.senti_is_researcher(auth.uid()));
CREATE POLICY "Owners read own Senti sources" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'senti-sources' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners delete own Senti sources" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'senti-sources' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE TABLE public.senti_researchers (
  user_id uuid PRIMARY KEY,
  granted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.senti_researchers TO authenticated;
GRANT ALL ON public.senti_researchers TO service_role;
ALTER TABLE public.senti_researchers ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.senti_is_researcher(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _uid IS NOT NULL AND (EXISTS (SELECT 1 FROM public.senti_researchers WHERE user_id = _uid) OR public.has_role(_uid, 'admin'))
$$;

CREATE POLICY "researchers read" ON public.senti_researchers FOR SELECT TO authenticated USING (public.senti_is_researcher(auth.uid()));

-- Extend existing research tables
ALTER TABLE public.senti_sessions ADD COLUMN scope text NOT NULL DEFAULT 'public' CHECK (scope IN ('public','studio')),
  ADD COLUMN owner_id uuid, ADD COLUMN title text;
ALTER TABLE public.senti_sessions ALTER COLUMN token_hash DROP NOT NULL;
ALTER TABLE public.senti_events ADD COLUMN source text NOT NULL DEFAULT 'public_lab',
  ADD COLUMN event_type text NOT NULL DEFAULT 'text', ADD COLUMN attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN occurred_at timestamptz, ADD COLUMN actor_key text, ADD COLUMN action text, ADD COLUMN target_key text, ADD COLUMN outcome text;
ALTER TABLE public.senti_entities ADD COLUMN attributes jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.senti_relations ADD COLUMN kind text NOT NULL DEFAULT 'inferred' CHECK (kind IN ('fact','inferred','hypothesis')),
  ADD COLUMN version int NOT NULL DEFAULT 1, ADD COLUMN valid_at timestamptz, ADD COLUMN superseded_by uuid;
ALTER TABLE public.senti_relations DROP CONSTRAINT IF EXISTS senti_relations_status_check;
ALTER TABLE public.senti_relations ADD CONSTRAINT senti_relations_status_check CHECK (status IN ('active','corrected','rejected','superseded'));

CREATE TABLE public.senti_relation_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relation_id uuid NOT NULL REFERENCES public.senti_relations(id) ON DELETE CASCADE,
  version int NOT NULL,
  snapshot jsonb NOT NULL,
  reason text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.senti_relation_versions (relation_id, version);

CREATE TABLE public.senti_engine_versions (
  id text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('rules','memory','model')),
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('operational','experimental','planned','retired')),
  released_at timestamptz,
  public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.senti_datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  origin text NOT NULL DEFAULT '',
  permissions text NOT NULL DEFAULT '',
  synthetic boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.senti_dataset_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid NOT NULL REFERENCES public.senti_datasets(id) ON DELETE CASCADE,
  version text NOT NULL,
  schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  records jsonb NOT NULL DEFAULT '[]'::jsonb,
  record_count int NOT NULL DEFAULT 0,
  splits jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text NOT NULL DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dataset_id, version)
);
CREATE TABLE public.senti_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  hypothesis text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'language',
  dataset_version_id uuid REFERENCES public.senti_dataset_versions(id) ON DELETE SET NULL,
  engine_version text REFERENCES public.senti_engine_versions(id),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  criteria text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','queued','running','completed','failed','archived')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.senti_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id uuid NOT NULL REFERENCES public.senti_experiments(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','completed','failed')),
  engine_version text NOT NULL,
  dataset_version_id uuid,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  created_by uuid,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE TABLE public.senti_eval_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.senti_runs(id) ON DELETE CASCADE,
  category text NOT NULL,
  baseline text NOT NULL CHECK (baseline IN ('rules','memory','model','llm')),
  metric text NOT NULL,
  value double precision,
  n int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'measured' CHECK (status IN ('measured','not_configured','not_available')),
  engine_version text NOT NULL,
  dataset_version_id uuid,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.senti_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  engine_version text REFERENCES public.senti_engine_versions(id),
  status text NOT NULL DEFAULT 'not_trained' CHECK (status IN ('not_trained','training','evaluated','operational')),
  training_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  dataset_version_id uuid,
  checkpoint text,
  notes text NOT NULL DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.senti_journal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'observation' CHECK (kind IN ('question','hypothesis','experiment','observation','failure','finding','decision','future')),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  experiment_id uuid REFERENCES public.senti_experiments(id) ON DELETE SET NULL,
  author_id uuid,
  published_update_id uuid REFERENCES public.senti_updates(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.senti_journal_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.senti_journal(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  edited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.senti_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','active','done')),
  target text,
  done_at timestamptz,
  public boolean NOT NULL DEFAULT true,
  sort int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.senti_relation_versions, public.senti_engine_versions, public.senti_datasets, public.senti_dataset_versions, public.senti_experiments, public.senti_runs, public.senti_eval_results, public.senti_models, public.senti_journal, public.senti_journal_revisions, public.senti_milestones TO authenticated;
GRANT ALL ON public.senti_relation_versions, public.senti_engine_versions, public.senti_datasets, public.senti_dataset_versions, public.senti_experiments, public.senti_runs, public.senti_eval_results, public.senti_models, public.senti_journal, public.senti_journal_revisions, public.senti_milestones TO service_role;

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['senti_relation_versions','senti_engine_versions','senti_datasets','senti_dataset_versions','senti_experiments','senti_runs','senti_eval_results','senti_models','senti_journal','senti_journal_revisions','senti_milestones'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "researchers all" ON public.%I FOR ALL TO authenticated USING (public.senti_is_researcher(auth.uid())) WITH CHECK (public.senti_is_researcher(auth.uid()))', t);
  END LOOP;
END $$;

CREATE POLICY "researchers read" ON public.senti_sessions FOR SELECT TO authenticated USING (public.senti_is_researcher(auth.uid()));
CREATE POLICY "researchers read" ON public.senti_events FOR SELECT TO authenticated USING (public.senti_is_researcher(auth.uid()));
CREATE POLICY "researchers read" ON public.senti_entities FOR SELECT TO authenticated USING (public.senti_is_researcher(auth.uid()));
CREATE POLICY "researchers read" ON public.senti_relations FOR SELECT TO authenticated USING (public.senti_is_researcher(auth.uid()));
CREATE POLICY "researchers read" ON public.senti_corrections FOR SELECT TO authenticated USING (public.senti_is_researcher(auth.uid()));
CREATE POLICY "researchers manage updates" ON public.senti_updates FOR ALL TO authenticated USING (public.senti_is_researcher(auth.uid())) WITH CHECK (public.senti_is_researcher(auth.uid()));

-- Journal edit history
CREATE OR REPLACE FUNCTION public.senti_journal_history() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.title IS DISTINCT FROM NEW.title OR OLD.body IS DISTINCT FROM NEW.body THEN
    INSERT INTO public.senti_journal_revisions (entry_id, title, body, edited_by) VALUES (OLD.id, OLD.title, OLD.body, auth.uid());
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER senti_journal_history BEFORE UPDATE ON public.senti_journal FOR EACH ROW EXECUTE FUNCTION public.senti_journal_history();

-- Admin grants
CREATE OR REPLACE FUNCTION public.senti_set_researcher(_email text, _grant boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Only admins can change researcher access'; END IF;
  SELECT id INTO uid FROM auth.users WHERE lower(email) = lower(trim(_email)) LIMIT 1;
  IF uid IS NULL THEN RETURN false; END IF;
  IF _grant THEN INSERT INTO public.senti_researchers (user_id, granted_by) VALUES (uid, auth.uid()) ON CONFLICT DO NOTHING;
  ELSE DELETE FROM public.senti_researchers WHERE user_id = uid; END IF;
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.senti_researcher_list()
RETURNS TABLE (user_id uuid, email text, created_at timestamptz) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.user_id, u.email::text, r.created_at FROM public.senti_researchers r JOIN auth.users u ON u.id = r.user_id
  WHERE public.has_role(auth.uid(), 'admin') ORDER BY r.created_at
$$;

-- Public status summary (published/public items only)
CREATE OR REPLACE FUNCTION public.senti_public_status()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'engines', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', id, 'kind', kind, 'description', description, 'status', status, 'released_at', released_at) ORDER BY created_at) FROM public.senti_engine_versions WHERE public), '[]'::jsonb),
    'milestones', COALESCE((SELECT jsonb_agg(jsonb_build_object('title', title, 'description', description, 'status', status, 'target', target, 'done_at', done_at) ORDER BY sort, created_at) FROM public.senti_milestones WHERE public), '[]'::jsonb),
    'evaluations', COALESCE((SELECT jsonb_agg(jsonb_build_object('category', category, 'baseline', baseline, 'metric', metric, 'value', value, 'n', n, 'engine_version', engine_version, 'created_at', created_at) ORDER BY created_at DESC) FROM (SELECT * FROM public.senti_eval_results WHERE published AND status = 'measured' ORDER BY created_at DESC LIMIT 30) e), '[]'::jsonb),
    'models_operational', (SELECT count(*) FROM public.senti_models WHERE status = 'operational'),
    'last_verified', (SELECT max(created_at) FROM public.senti_eval_results WHERE published AND status = 'measured')
  )
$$;
GRANT EXECUTE ON FUNCTION public.senti_public_status() TO anon, authenticated;

INSERT INTO public.senti_engine_versions (id, kind, description, status, released_at) VALUES
  ('senti-rules-0.1', 'rules', 'Rule-based sentence reader: finds names and things, links them through the verb between them, notes negation and time words.', 'operational', now()),
  ('senti-core-0.1', 'memory', 'Relational memory and event engine: structured events, stable entities, versioned relationships with evidence, retrieval, supersession and explanations. Not a trained model.', 'operational', now()),
  ('senti-learn-0.1', 'model', 'First learning experiments on top of Core. Not built or trained yet.', 'planned', NULL)
ON CONFLICT DO NOTHING;
INSERT INTO public.senti_milestones (title, description, status, sort, done_at) VALUES
  ('Public research Lab', 'Isolated visitor sessions with evidence-backed relationships and corrections.', 'done', 1, now()),
  ('Senti Core v0.1', 'Persistent relational memory with versioned relationships and traceable evidence.', 'done', 2, now()),
  ('First reproducible baselines', 'Rules-only and structured-memory evaluations on synthetic datasets.', 'active', 3, NULL),
  ('Python research service', 'Move Core to an independent Python/FastAPI service with the same API.', 'planned', 4, NULL),
  ('First learning experiment', 'Train and evaluate a first experimental model against the baselines.', 'planned', 5, NULL);
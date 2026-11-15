ALTER TABLE public.spaces_versions ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'static';
ALTER TABLE public.spaces_versions ADD COLUMN IF NOT EXISTS has_compiled boolean NOT NULL DEFAULT false;
ALTER TABLE public.spaces_versions ADD COLUMN IF NOT EXISTS source_path text;
ALTER TABLE public.spaces_versions ADD COLUMN IF NOT EXISTS classification jsonb;
UPDATE public.spaces_versions SET has_compiled = (status = 'ready');
ALTER TABLE public.spaces_versions DROP CONSTRAINT IF EXISTS spaces_versions_status_check;
ALTER TABLE public.spaces_versions ADD CONSTRAINT spaces_versions_status_check CHECK (status IN ('ready','failed','build_required','preserved','needs_services','unsupported'));
ALTER TABLE public.spaces_versions ADD CONSTRAINT spaces_versions_kind_check CHECK (kind IN ('static','vite_source','source_archive','needs_services','unsupported'));
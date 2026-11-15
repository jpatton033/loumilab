ALTER TABLE public.spaces_apps
  ADD COLUMN IF NOT EXISTS edge_status text NOT NULL DEFAULT 'off',
  ADD COLUMN IF NOT EXISTS edge_version_id uuid,
  ADD COLUMN IF NOT EXISTS edge_error text,
  ADD COLUMN IF NOT EXISTS edge_checked_at timestamptz;
ALTER TABLE public.spaces_apps ADD CONSTRAINT spaces_apps_edge_status_check CHECK (edge_status IN ('off','deploying','pending','live','failed'));
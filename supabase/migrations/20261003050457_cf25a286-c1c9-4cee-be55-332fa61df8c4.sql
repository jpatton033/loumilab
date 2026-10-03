ALTER TABLE public.local_importer_settings
  ADD COLUMN IF NOT EXISTS weekly_credit_limit integer NOT NULL DEFAULT 250,
  ADD COLUMN IF NOT EXISTS credits_used_week integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS usage_week date;
ALTER TABLE public.local_importer_settings ALTER COLUMN max_pages_per_domain SET DEFAULT 1;
ALTER TABLE public.local_importer_settings ALTER COLUMN recrawl_cooldown_days SET DEFAULT 30;
UPDATE public.local_importer_settings SET max_pages_per_domain = 1, recrawl_cooldown_days = 30, weekly_credit_limit = 250 WHERE id = 1;
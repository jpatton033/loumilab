ALTER TABLE public.dot_issues ADD COLUMN IF NOT EXISTS emailed_at timestamptz;
ALTER TABLE public.dot_issues ADD COLUMN IF NOT EXISTS emailed_count integer NOT NULL DEFAULT 0;
-- Issue 001 predates email delivery; mark it as already handled so no surprise send.
UPDATE public.dot_issues SET emailed_at = now() WHERE status = 'published' AND emailed_at IS NULL;
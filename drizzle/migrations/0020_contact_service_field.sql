ALTER TABLE public.contact_submissions ADD COLUMN IF NOT EXISTS service text CHECK (service IS NULL OR char_length(service) <= 80);
ALTER TABLE public.contact_submissions DROP CONSTRAINT IF EXISTS contact_submissions_budget_len;
ALTER TABLE public.contact_submissions ADD CONSTRAINT contact_submissions_budget_len CHECK (budget IS NULL OR char_length(budget) <= 80);
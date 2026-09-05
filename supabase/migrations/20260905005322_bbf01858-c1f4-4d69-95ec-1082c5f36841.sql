ALTER TABLE public.merchant_welcome_emails ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'welcome';
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.merchant_welcome_emails'::regclass AND contype IN ('p','u')
      AND conname = 'merchant_welcome_emails_pkey'
  ) THEN
    ALTER TABLE public.merchant_welcome_emails DROP CONSTRAINT merchant_welcome_emails_pkey;
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS merchant_welcome_emails_merchant_kind_idx
  ON public.merchant_welcome_emails (merchant_id, kind);
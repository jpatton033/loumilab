UPDATE public.merchant_stripe_accounts
SET livemode = true
WHERE livemode = false
  AND stripe_account_id LIKE 'acct_%';
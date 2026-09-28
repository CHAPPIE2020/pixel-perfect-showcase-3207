-- M2 — Stripe credits system (course 2 module 2.3)
-- Adapted from the m2-stripe-credits skill template for this repo:
--   * jobs.status keeps this project's M1 values (pending/downloading/transcribe/done)
--     and only adds 'insufficient_credits'
--   * profiles did not exist before M2 → existing auth users get a profiles row
--     (30 credits) in section 6, not just a ledger row
--   * every policy is created idempotently so the file can be re-run safely

-- 0. profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1. credits_balance on profiles (1 credit = 1 minute of video)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS credits_balance numeric NOT NULL DEFAULT 30;

-- 2. Ledger table (source of truth; profiles.credits_balance is derived)
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('purchase', 'deduction', 'signup_bonus', 'admin_grant')),
  description text,
  job_id uuid REFERENCES public.jobs(id),
  stripe_payment_intent_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id
  ON public.credit_transactions(user_id, created_at DESC);

-- Idempotency: at most one purchase row per Stripe payment_intent
CREATE UNIQUE INDEX IF NOT EXISTS uniq_credit_tx_payment_intent
  ON public.credit_transactions(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own transactions" ON public.credit_transactions
    FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Products catalog (credits-per-tier lives here, not on the Stripe price)
CREATE TABLE IF NOT EXISTS public.credit_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  credits numeric NOT NULL,
  price_usd numeric NOT NULL,
  stripe_price_id text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_products ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can view active products" ON public.credit_products
    FOR SELECT TO authenticated USING (active = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Stripe sandbox prices created in M2 Step 3 (account acct_1UKToRLMv6c1mt6H)
INSERT INTO public.credit_products (name, credits, price_usd, stripe_price_id)
SELECT v.name, v.credits, v.price_usd, v.stripe_price_id
FROM (VALUES
  ('10 Credits', 10, 10.00, 'price_1UKZLtLMv6c1mt6HToNSDGcr'),
  ('45 Credits', 45, 30.00, 'price_1UKZLuLMv6c1mt6HozgcfkVg'),
  ('90 Credits', 90, 60.00, 'price_1UKZLxLMv6c1mt6HdYQskrbQ')
) AS v(name, credits, price_usd, stripe_price_id)
WHERE NOT EXISTS (
  SELECT 1 FROM public.credit_products p WHERE p.stripe_price_id = v.stripe_price_id
);

-- 4. Signup trigger: 30-credit welcome bonus
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, email, credits_balance)
    VALUES (NEW.id, 'user', NEW.email, 30)
    ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.credit_transactions (user_id, amount, type, description)
    VALUES (NEW.id, 30, 'signup_bonus', 'Welcome bonus — 30 free credits');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. New job status: insufficient_credits (keeps this project's M1 statuses)
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_status_check
  CHECK (status IN ('pending', 'downloading', 'transcribe', 'done', 'insufficient_credits'));

-- 6. Backfill users created before this migration: profile row + signup_bonus ledger row
INSERT INTO public.profiles (id, role, email, credits_balance)
SELECT u.id, 'user', u.email, 30
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.credit_transactions (user_id, amount, type, description)
SELECT u.id, 30, 'signup_bonus', 'Welcome bonus — 30 free credits (backfilled)'
FROM auth.users u
LEFT JOIN public.credit_transactions ct
  ON ct.user_id = u.id AND ct.type = 'signup_bonus'
WHERE ct.id IS NULL;


ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_trabalho_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_saude_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_casa_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_financeiro_at timestamptz;

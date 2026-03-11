
CREATE TABLE IF NOT EXISTS public.configuracoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  chave text NOT NULL,
  valor jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, chave)
);

ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own settings" ON public.configuracoes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add user_id to activity_log for proper tracking
ALTER TABLE public.activity_log ADD COLUMN IF NOT EXISTS user_id uuid;

-- Update RLS on activity_log to be user-scoped
DROP POLICY IF EXISTS "Allow all on activity_log" ON public.activity_log;
CREATE POLICY "Users manage own logs" ON public.activity_log
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

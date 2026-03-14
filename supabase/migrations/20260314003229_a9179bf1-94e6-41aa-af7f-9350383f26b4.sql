-- Add user_id column to log_consolidado
ALTER TABLE public.log_consolidado ADD COLUMN user_id uuid;

-- Backfill: leave NULL for now (existing data is system-generated)

-- Drop the old permissive policy
DROP POLICY IF EXISTS "Allow all on log_consolidado" ON public.log_consolidado;

-- Create proper RLS policies scoped to user_id
CREATE POLICY "log_consolidado_select" ON public.log_consolidado
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "log_consolidado_insert" ON public.log_consolidado
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "log_consolidado_update" ON public.log_consolidado
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "log_consolidado_delete" ON public.log_consolidado
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Also allow service role to bypass (it already does by default, but be explicit)
-- Service role always bypasses RLS, no policy needed.

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_log_consolidado_user_id ON public.log_consolidado(user_id);
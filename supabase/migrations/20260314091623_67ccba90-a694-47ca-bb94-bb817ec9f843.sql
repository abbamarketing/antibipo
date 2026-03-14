
-- Add user_id to tarefas_casa, registros_limpeza, lista_compras
DO $$
DECLARE
  v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users LIMIT 1;
  IF v_uid IS NULL THEN
    RAISE NOTICE 'No users found, skipping population';
    RETURN;
  END IF;

  -- tarefas_casa
  ALTER TABLE public.tarefas_casa ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  UPDATE public.tarefas_casa SET user_id = v_uid WHERE user_id IS NULL;
  ALTER TABLE public.tarefas_casa ALTER COLUMN user_id SET NOT NULL;
  ALTER TABLE public.tarefas_casa ALTER COLUMN user_id SET DEFAULT auth.uid();

  -- registros_limpeza
  ALTER TABLE public.registros_limpeza ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  UPDATE public.registros_limpeza SET user_id = v_uid WHERE user_id IS NULL;
  ALTER TABLE public.registros_limpeza ALTER COLUMN user_id SET NOT NULL;
  ALTER TABLE public.registros_limpeza ALTER COLUMN user_id SET DEFAULT auth.uid();

  -- lista_compras
  ALTER TABLE public.lista_compras ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  UPDATE public.lista_compras SET user_id = v_uid WHERE user_id IS NULL;
  ALTER TABLE public.lista_compras ALTER COLUMN user_id SET NOT NULL;
  ALTER TABLE public.lista_compras ALTER COLUMN user_id SET DEFAULT auth.uid();
END $$;

-- Drop permissive policies and create strict ones
DROP POLICY IF EXISTS "Allow all on tarefas_casa" ON tarefas_casa;
CREATE POLICY "tarefas_casa_usuario_proprio" ON tarefas_casa
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow all on registros_limpeza" ON registros_limpeza;
CREATE POLICY "registros_limpeza_usuario_proprio" ON registros_limpeza
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow all on lista_compras" ON lista_compras;
CREATE POLICY "lista_compras_usuario_proprio" ON lista_compras
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tarefas_casa_user ON tarefas_casa(user_id);
CREATE INDEX IF NOT EXISTS idx_registros_limpeza_user ON registros_limpeza(user_id);
CREATE INDEX IF NOT EXISTS idx_lista_compras_user ON lista_compras(user_id);

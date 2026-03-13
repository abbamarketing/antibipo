
-- 1. Add user_id column to all shared tables
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.registros_humor ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.registros_sono ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.medicamentos ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.sessoes_energia ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.registros_medicamento ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Drop old permissive policies
DROP POLICY IF EXISTS "Allow all on tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow all on registros_humor" ON public.registros_humor;
DROP POLICY IF EXISTS "Allow all on registros_sono" ON public.registros_sono;
DROP POLICY IF EXISTS "Allow all on medicamentos" ON public.medicamentos;
DROP POLICY IF EXISTS "Allow all on clientes" ON public.clientes;
DROP POLICY IF EXISTS "Allow all on sessoes_energia" ON public.sessoes_energia;
DROP POLICY IF EXISTS "Allow all on registros_medicamento" ON public.registros_medicamento;

-- 3. Create strict RLS policies per operation

-- tasks
CREATE POLICY "tasks_select" ON public.tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "tasks_delete" ON public.tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- registros_humor
CREATE POLICY "humor_select" ON public.registros_humor FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "humor_insert" ON public.registros_humor FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "humor_update" ON public.registros_humor FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "humor_delete" ON public.registros_humor FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- registros_sono
CREATE POLICY "sono_select" ON public.registros_sono FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "sono_insert" ON public.registros_sono FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sono_update" ON public.registros_sono FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "sono_delete" ON public.registros_sono FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- medicamentos
CREATE POLICY "med_select" ON public.medicamentos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "med_insert" ON public.medicamentos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "med_update" ON public.medicamentos FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "med_delete" ON public.medicamentos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- clientes
CREATE POLICY "clientes_select" ON public.clientes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "clientes_insert" ON public.clientes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "clientes_update" ON public.clientes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "clientes_delete" ON public.clientes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- sessoes_energia
CREATE POLICY "energia_select" ON public.sessoes_energia FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "energia_insert" ON public.sessoes_energia FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "energia_update" ON public.sessoes_energia FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "energia_delete" ON public.sessoes_energia FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- registros_medicamento
CREATE POLICY "medreg_select" ON public.registros_medicamento FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "medreg_insert" ON public.registros_medicamento FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "medreg_update" ON public.registros_medicamento FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "medreg_delete" ON public.registros_medicamento FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. Composite indexes for DayScore performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_registros_humor_user_data ON public.registros_humor(user_id, data);
CREATE INDEX IF NOT EXISTS idx_registros_sono_user_data ON public.registros_sono(user_id, data);
CREATE INDEX IF NOT EXISTS idx_sessoes_energia_user_data ON public.sessoes_energia(user_id, data);
CREATE INDEX IF NOT EXISTS idx_registros_med_user_data ON public.registros_medicamento(user_id, data);
CREATE INDEX IF NOT EXISTS idx_medicamentos_user ON public.medicamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_user ON public.clientes(user_id);

-- 5. Update reset_user_data function to use user_id filtering
CREATE OR REPLACE FUNCTION public.reset_user_data(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  IF auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Ação não permitida para este usuário';
  END IF;

  DELETE FROM public.activity_log WHERE user_id = p_user_id;
  DELETE FROM public.configuracoes WHERE user_id = p_user_id;
  DELETE FROM public.tracker_registros WHERE user_id = p_user_id;
  DELETE FROM public.custom_trackers WHERE user_id = p_user_id;
  DELETE FROM public.diario_entradas WHERE user_id = p_user_id;
  DELETE FROM public.metas_pessoais WHERE user_id = p_user_id;
  DELETE FROM public.registros_peso WHERE user_id = p_user_id;
  DELETE FROM public.reports_semanais WHERE user_id = p_user_id;
  DELETE FROM public.reunioes WHERE user_id = p_user_id;
  DELETE FROM public.carteira_docs WHERE user_id = p_user_id;
  DELETE FROM public.tasks WHERE user_id = p_user_id;
  DELETE FROM public.registros_medicamento WHERE user_id = p_user_id;
  DELETE FROM public.medicamentos WHERE user_id = p_user_id;
  DELETE FROM public.registros_humor WHERE user_id = p_user_id;
  DELETE FROM public.registros_sono WHERE user_id = p_user_id;
  DELETE FROM public.sessoes_energia WHERE user_id = p_user_id;
  DELETE FROM public.clientes WHERE user_id = p_user_id;
  DELETE FROM public.tarefas_casa WHERE true;
  DELETE FROM public.registros_limpeza WHERE true;
  DELETE FROM public.lista_compras WHERE true;
  DELETE FROM public.bm_exercicios WHERE true;
  DELETE FROM public.bm_refeicoes WHERE true;
  DELETE FROM public.bm_log_estado WHERE true;
  DELETE FROM public.bm_metas WHERE true;
  DELETE FROM public.bm_analise_semanal WHERE true;
  DELETE FROM public.log_consolidado WHERE true;
  DELETE FROM public.fc_lancamento_tags WHERE true;
  DELETE FROM public.fc_lancamentos WHERE true;
  DELETE FROM public.fc_tags WHERE true;
  DELETE FROM public.fc_consolidacao WHERE true;

  UPDATE public.profiles SET
    nome = NULL, data_nascimento = NULL, peso_kg = NULL, altura_cm = NULL,
    objetivo_saude = NULL, trabalho_tipo = NULL, trabalho_horas_dia = NULL,
    trabalho_desafio = NULL, trabalho_clientes_ativos = NULL, trabalho_equipe = NULL,
    casa_moradores = NULL, casa_comodos = NULL, casa_pets = false,
    casa_frequencia_ideal = NULL, casa_desafio = NULL,
    financeiro_faixa_renda = NULL, financeiro_objetivo = NULL,
    financeiro_controla_gastos = NULL, financeiro_principal_gasto = NULL,
    financeiro_reserva = NULL,
    onboarding_saude = false, onboarding_trabalho = false,
    onboarding_casa = false, onboarding_financeiro = false,
    onboarding_saude_at = NULL, onboarding_trabalho_at = NULL,
    onboarding_casa_at = NULL, onboarding_financeiro_at = NULL,
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$function$;

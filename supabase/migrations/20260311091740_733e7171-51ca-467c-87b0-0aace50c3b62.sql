
-- Fix ALL RLS policies: they were created as RESTRICTIVE (no permissive policy exists, so all access is denied)
-- We need to drop them and recreate as PERMISSIVE

-- ========== PROFILES ==========
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ========== ACTIVITY_LOG ==========
DROP POLICY IF EXISTS "Allow all on activity_log" ON public.activity_log;
CREATE POLICY "Allow all on activity_log" ON public.activity_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== BM_ANALISE_SEMANAL ==========
DROP POLICY IF EXISTS "Allow all on bm_analise_semanal" ON public.bm_analise_semanal;
CREATE POLICY "Allow all on bm_analise_semanal" ON public.bm_analise_semanal FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== BM_EXERCICIOS ==========
DROP POLICY IF EXISTS "Allow all on bm_exercicios" ON public.bm_exercicios;
CREATE POLICY "Allow all on bm_exercicios" ON public.bm_exercicios FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== BM_LOG_ESTADO ==========
DROP POLICY IF EXISTS "Allow all on bm_log_estado" ON public.bm_log_estado;
CREATE POLICY "Allow all on bm_log_estado" ON public.bm_log_estado FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== BM_METAS ==========
DROP POLICY IF EXISTS "Allow all on bm_metas" ON public.bm_metas;
CREATE POLICY "Allow all on bm_metas" ON public.bm_metas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== BM_REFEICOES ==========
DROP POLICY IF EXISTS "Allow all on bm_refeicoes" ON public.bm_refeicoes;
CREATE POLICY "Allow all on bm_refeicoes" ON public.bm_refeicoes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== CLIENTES ==========
DROP POLICY IF EXISTS "Allow all on clientes" ON public.clientes;
CREATE POLICY "Allow all on clientes" ON public.clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== FC_CONSOLIDACAO ==========
DROP POLICY IF EXISTS "Allow all on fc_consolidacao" ON public.fc_consolidacao;
CREATE POLICY "Allow all on fc_consolidacao" ON public.fc_consolidacao FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== FC_LANCAMENTO_TAGS ==========
DROP POLICY IF EXISTS "Allow all on fc_lancamento_tags" ON public.fc_lancamento_tags;
CREATE POLICY "Allow all on fc_lancamento_tags" ON public.fc_lancamento_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== FC_LANCAMENTOS ==========
DROP POLICY IF EXISTS "Allow all on fc_lancamentos" ON public.fc_lancamentos;
CREATE POLICY "Allow all on fc_lancamentos" ON public.fc_lancamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== FC_TAGS ==========
DROP POLICY IF EXISTS "Allow all on fc_tags" ON public.fc_tags;
CREATE POLICY "Allow all on fc_tags" ON public.fc_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== LISTA_COMPRAS ==========
DROP POLICY IF EXISTS "Allow all on lista_compras" ON public.lista_compras;
CREATE POLICY "Allow all on lista_compras" ON public.lista_compras FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== LOG_CONSOLIDADO ==========
DROP POLICY IF EXISTS "Allow all on log_consolidado" ON public.log_consolidado;
CREATE POLICY "Allow all on log_consolidado" ON public.log_consolidado FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== MEDICAMENTOS ==========
DROP POLICY IF EXISTS "Allow all on medicamentos" ON public.medicamentos;
CREATE POLICY "Allow all on medicamentos" ON public.medicamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== REGISTROS_HUMOR ==========
DROP POLICY IF EXISTS "Allow all on registros_humor" ON public.registros_humor;
CREATE POLICY "Allow all on registros_humor" ON public.registros_humor FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== REGISTROS_LIMPEZA ==========
DROP POLICY IF EXISTS "Allow all on registros_limpeza" ON public.registros_limpeza;
CREATE POLICY "Allow all on registros_limpeza" ON public.registros_limpeza FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== REGISTROS_MEDICAMENTO ==========
DROP POLICY IF EXISTS "Allow all on registros_medicamento" ON public.registros_medicamento;
CREATE POLICY "Allow all on registros_medicamento" ON public.registros_medicamento FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== REGISTROS_SONO ==========
DROP POLICY IF EXISTS "Allow all on registros_sono" ON public.registros_sono;
CREATE POLICY "Allow all on registros_sono" ON public.registros_sono FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== SESSOES_ENERGIA ==========
DROP POLICY IF EXISTS "Allow all on sessoes_energia" ON public.sessoes_energia;
CREATE POLICY "Allow all on sessoes_energia" ON public.sessoes_energia FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== TAREFAS_CASA ==========
DROP POLICY IF EXISTS "Allow all on tarefas_casa" ON public.tarefas_casa;
CREATE POLICY "Allow all on tarefas_casa" ON public.tarefas_casa FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== TASKS ==========
DROP POLICY IF EXISTS "Allow all on tasks" ON public.tasks;
CREATE POLICY "Allow all on tasks" ON public.tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== CARTEIRA_DOCS ==========
DROP POLICY IF EXISTS "Users manage own docs" ON public.carteira_docs;
CREATE POLICY "Users manage own docs" ON public.carteira_docs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ========== DIARIO_ENTRADAS ==========
DROP POLICY IF EXISTS "Users manage own diary" ON public.diario_entradas;
CREATE POLICY "Users manage own diary" ON public.diario_entradas FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ========== METAS_PESSOAIS ==========
DROP POLICY IF EXISTS "Users manage own goals" ON public.metas_pessoais;
CREATE POLICY "Users manage own goals" ON public.metas_pessoais FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ========== REGISTROS_PESO ==========
DROP POLICY IF EXISTS "Users can manage own weight records" ON public.registros_peso;
CREATE POLICY "Users can manage own weight records" ON public.registros_peso FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ========== REPORTS_SEMANAIS ==========
DROP POLICY IF EXISTS "Users manage own reports" ON public.reports_semanais;
CREATE POLICY "Users manage own reports" ON public.reports_semanais FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ========== REUNIOES ==========
DROP POLICY IF EXISTS "Users manage own meetings" ON public.reunioes;
CREATE POLICY "Users manage own meetings" ON public.reunioes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

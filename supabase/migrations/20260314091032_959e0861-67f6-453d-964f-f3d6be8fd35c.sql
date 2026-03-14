
-- Drop existing per-command policies and replace with unified ALL policies

-- tasks
DROP POLICY IF EXISTS "tasks_open" ON tasks;
DROP POLICY IF EXISTS "tasks_delete" ON tasks;
DROP POLICY IF EXISTS "tasks_insert" ON tasks;
DROP POLICY IF EXISTS "tasks_select" ON tasks;
DROP POLICY IF EXISTS "tasks_update" ON tasks;
CREATE POLICY "tasks_usuario_proprio" ON tasks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- medicamentos
DROP POLICY IF EXISTS "medicamentos_open" ON medicamentos;
DROP POLICY IF EXISTS "med_delete" ON medicamentos;
DROP POLICY IF EXISTS "med_insert" ON medicamentos;
DROP POLICY IF EXISTS "med_select" ON medicamentos;
DROP POLICY IF EXISTS "med_update" ON medicamentos;
CREATE POLICY "medicamentos_usuario_proprio" ON medicamentos
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- registros_medicamento
DROP POLICY IF EXISTS "registros_medicamento_open" ON registros_medicamento;
DROP POLICY IF EXISTS "medreg_delete" ON registros_medicamento;
DROP POLICY IF EXISTS "medreg_insert" ON registros_medicamento;
DROP POLICY IF EXISTS "medreg_select" ON registros_medicamento;
DROP POLICY IF EXISTS "medreg_update" ON registros_medicamento;
CREATE POLICY "registros_medicamento_usuario_proprio" ON registros_medicamento
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- registros_sono
DROP POLICY IF EXISTS "registros_sono_open" ON registros_sono;
DROP POLICY IF EXISTS "sono_delete" ON registros_sono;
DROP POLICY IF EXISTS "sono_insert" ON registros_sono;
DROP POLICY IF EXISTS "sono_select" ON registros_sono;
DROP POLICY IF EXISTS "sono_update" ON registros_sono;
CREATE POLICY "registros_sono_usuario_proprio" ON registros_sono
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- registros_humor
DROP POLICY IF EXISTS "registros_humor_open" ON registros_humor;
DROP POLICY IF EXISTS "humor_delete" ON registros_humor;
DROP POLICY IF EXISTS "humor_insert" ON registros_humor;
DROP POLICY IF EXISTS "humor_select" ON registros_humor;
DROP POLICY IF EXISTS "humor_update" ON registros_humor;
CREATE POLICY "registros_humor_usuario_proprio" ON registros_humor
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- sessoes_energia
DROP POLICY IF EXISTS "sessoes_energia_open" ON sessoes_energia;
DROP POLICY IF EXISTS "energia_delete" ON sessoes_energia;
DROP POLICY IF EXISTS "energia_insert" ON sessoes_energia;
DROP POLICY IF EXISTS "energia_select" ON sessoes_energia;
DROP POLICY IF EXISTS "energia_update" ON sessoes_energia;
CREATE POLICY "sessoes_energia_usuario_proprio" ON sessoes_energia
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- clientes
DROP POLICY IF EXISTS "clientes_open" ON clientes;
DROP POLICY IF EXISTS "clientes_delete" ON clientes;
DROP POLICY IF EXISTS "clientes_insert" ON clientes;
DROP POLICY IF EXISTS "clientes_select" ON clientes;
DROP POLICY IF EXISTS "clientes_update" ON clientes;
CREATE POLICY "clientes_usuario_proprio" ON clientes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- activity_log
DROP POLICY IF EXISTS "activity_log_open" ON activity_log;
DROP POLICY IF EXISTS "Users manage own logs" ON activity_log;
CREATE POLICY "activity_log_usuario_proprio" ON activity_log
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_medicamentos_user_id ON medicamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_registros_medicamento_user_data ON registros_medicamento(user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_registros_sono_user_data ON registros_sono(user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_registros_humor_user_data ON registros_humor(user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_sessoes_energia_user_data ON sessoes_energia(user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_criado ON activity_log(user_id, criado_em DESC);

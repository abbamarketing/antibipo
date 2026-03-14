-- Composite indexes for useDayContext and Edge Functions performance
CREATE INDEX IF NOT EXISTS idx_registros_humor_user_data ON registros_humor(user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_registros_sono_user_data ON registros_sono(user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_registros_medicamento_user_data ON registros_medicamento(user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_criado ON activity_log(user_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status) WHERE status NOT IN ('feito', 'descartado');
CREATE INDEX IF NOT EXISTS idx_tasks_user_feito_em ON tasks(user_id, feito_em DESC) WHERE status = 'feito';
CREATE INDEX IF NOT EXISTS idx_tracker_registros_user_data ON tracker_registros(user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_diario_entradas_user_data ON diario_entradas(user_id, data DESC);
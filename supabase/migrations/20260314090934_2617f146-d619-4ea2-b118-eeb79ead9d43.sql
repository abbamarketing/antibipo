
CREATE TABLE IF NOT EXISTS agentes_relatorios (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent           TEXT NOT NULL,
  tipo            TEXT NOT NULL,
  periodo         DATE NOT NULL,
  timestamp       TIMESTAMPTZ DEFAULT NOW(),
  status          TEXT NOT NULL,
  signals         JSONB NOT NULL,
  patterns        TEXT[] DEFAULT ARRAY[]::TEXT[],
  context         JSONB DEFAULT '{}'::JSONB,
  cross_domain    JSONB DEFAULT '{}'::JSONB,
  episode_risk    JSONB DEFAULT '{}'::JSONB,
  module_recs     JSONB DEFAULT '{}'::JSONB,
  nudge_context   JSONB DEFAULT '{}'::JSONB,
  alerts          JSONB[] DEFAULT ARRAY[]::JSONB[],
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT agentes_relatorios_user_agent_periodo UNIQUE (user_id, agent, periodo)
);
ALTER TABLE agentes_relatorios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agentes_relatorios_usuario_proprio" ON agentes_relatorios
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS agentes_orquestracao (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  periodo                     DATE NOT NULL,
  timestamp                   TIMESTAMPTZ DEFAULT NOW(),
  day_score_base              SMALLINT,
  day_score_recalibrated      SMALLINT,
  score_shift                 SMALLINT,
  alert_level_original        TEXT,
  alert_level_recalibrated    TEXT,
  weight_adjustment_reason    TEXT,
  weights                     JSONB NOT NULL DEFAULT '{}'::JSONB,
  module_order                TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  modules_to_show             TEXT[] DEFAULT ARRAY[]::TEXT[],
  modules_to_hide             TEXT[] DEFAULT ARRAY[]::TEXT[],
  manic_precursor             BOOLEAN DEFAULT FALSE,
  depressive_precursor        BOOLEAN DEFAULT FALSE,
  manic_confidence            NUMERIC(3,2) DEFAULT 0,
  depressive_confidence       NUMERIC(3,2) DEFAULT 0,
  days_until_crisis           SMALLINT,
  nudge_tone                  TEXT,
  nudge_focus                 TEXT,
  nudge_factual_base          TEXT,
  preventive_action           TEXT,
  meds_adherence_7d           SMALLINT,
  meds_status                 TEXT,
  meds_as_anchor              BOOLEAN,
  similar_pattern_history     JSONB,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT agentes_orquestracao_user_periodo UNIQUE (user_id, periodo)
);
ALTER TABLE agentes_orquestracao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agentes_orquestracao_usuario_proprio" ON agentes_orquestracao
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS agentes_config (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  med_gap_threshold         SMALLINT DEFAULT 2,
  sleep_quality_threshold   SMALLINT DEFAULT 2,
  mood_volatility_threshold NUMERIC(3,1) DEFAULT 3.0,
  spending_spike_threshold  NUMERIC(3,2) DEFAULT 1.5,
  notify_on_warning         BOOLEAN DEFAULT TRUE,
  notify_on_crisis          BOOLEAN DEFAULT TRUE,
  notify_daily_summary      BOOLEAN DEFAULT FALSE,
  manic_weights             JSONB DEFAULT '{"mood_ceiling":0.3,"sleep_low":0.2,"spending_high":0.3,"energy_high":0.2}'::JSONB,
  depressive_weights        JSONB DEFAULT '{"mood_low":0.3,"sleep_low":0.3,"task_completion_low":0.2,"isolation":0.2}'::JSONB,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT agentes_config_user_unique UNIQUE (user_id)
);
ALTER TABLE agentes_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agentes_config_usuario_proprio" ON agentes_config
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_agentes_relatorios_user_periodo ON agentes_relatorios(user_id, periodo DESC);
CREATE INDEX IF NOT EXISTS idx_agentes_relatorios_agent ON agentes_relatorios(agent, periodo DESC);
CREATE INDEX IF NOT EXISTS idx_agentes_relatorios_status ON agentes_relatorios(status) WHERE status IN ('warning', 'crisis');
CREATE INDEX IF NOT EXISTS idx_agentes_orquestracao_user_periodo ON agentes_orquestracao(user_id, periodo DESC);
CREATE INDEX IF NOT EXISTS idx_agentes_orquestracao_crisis ON agentes_orquestracao(user_id) WHERE manic_precursor = TRUE OR depressive_precursor = TRUE;

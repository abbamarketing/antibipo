
-- Weekly/monthly consolidated logs for AI memory
CREATE TABLE public.log_consolidado (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('semanal', 'mensal')),
  periodo_inicio date NOT NULL,
  periodo_fim date NOT NULL,
  resumo text,
  metricas jsonb DEFAULT '{}'::jsonb,
  detalhes jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.log_consolidado ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on log_consolidado" ON public.log_consolidado FOR ALL TO public USING (true) WITH CHECK (true);

-- Digital wallet / documents storage
CREATE TABLE public.carteira_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tipo text NOT NULL DEFAULT 'outro',
  titulo text NOT NULL,
  dados jsonb DEFAULT '{}'::jsonb,
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.carteira_docs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own docs" ON public.carteira_docs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

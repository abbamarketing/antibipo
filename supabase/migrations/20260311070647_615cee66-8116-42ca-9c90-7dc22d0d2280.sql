
-- Activity log for AI memory/context
CREATE TABLE public.activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  acao TEXT NOT NULL,
  detalhes JSONB,
  contexto TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on activity_log" ON public.activity_log FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_activity_log_criado ON public.activity_log(criado_em DESC);

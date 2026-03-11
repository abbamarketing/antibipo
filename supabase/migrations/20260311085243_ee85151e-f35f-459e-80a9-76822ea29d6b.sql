
CREATE TABLE public.diario_entradas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  texto text NOT NULL,
  humor_detectado integer NULL,
  sentimento text NULL,
  tags_extraidas text[] NULL,
  impacto_metas jsonb NULL DEFAULT '[]'::jsonb,
  fonte text NOT NULL DEFAULT 'texto',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  data date NOT NULL DEFAULT CURRENT_DATE
);

ALTER TABLE public.diario_entradas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own diary" ON public.diario_entradas
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_diario_entradas_user_data ON public.diario_entradas(user_id, data);

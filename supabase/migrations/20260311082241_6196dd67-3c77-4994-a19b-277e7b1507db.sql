
-- Goals table
CREATE TABLE public.metas_pessoais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  titulo text NOT NULL,
  descricao text,
  prazo text NOT NULL CHECK (prazo IN ('curto', 'medio', 'longo')),
  data_inicio date NOT NULL DEFAULT CURRENT_DATE,
  data_alvo date NOT NULL,
  progresso integer DEFAULT 0,
  status text DEFAULT 'ativa' CHECK (status IN ('ativa', 'concluida', 'pausada', 'abandonada')),
  notas_progresso jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.metas_pessoais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own goals"
  ON public.metas_pessoais FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Weekly reports table
CREATE TABLE public.reports_semanais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  semana_inicio date NOT NULL,
  semana_fim date NOT NULL,
  reflexao text,
  nota_semana integer CHECK (nota_semana BETWEEN 1 AND 5),
  destaques text[],
  dificuldades text[],
  metas_update jsonb DEFAULT '[]'::jsonb,
  metricas jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, semana_inicio)
);

ALTER TABLE public.reports_semanais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reports"
  ON public.reports_semanais FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 1. Refeições (alimentação)
CREATE TABLE public.bm_refeicoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL DEFAULT current_date,
  refeicao text NOT NULL, -- cafe_manha | almoco | jantar | lanche
  qualidade integer NOT NULL CHECK (qualidade BETWEEN 1 AND 3), -- 1=ruim 2=ok 3=saudavel
  descricao text,
  categorias text[],
  pulou boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(data, refeicao)
);

-- 2. Exercícios
CREATE TABLE public.bm_exercicios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL DEFAULT current_date,
  tipo text NOT NULL, -- academia | caminhada | corrida | yoga | natacao | bike | outro
  duracao_min integer NOT NULL,
  intensidade integer NOT NULL CHECK (intensidade BETWEEN 1 AND 3), -- 1=leve 2=moderado 3=intenso
  como_ficou integer CHECK (como_ficou BETWEEN 1 AND 3), -- 1=exausto 2=bem 3=energizado
  notas text,
  created_at timestamptz DEFAULT now()
);

-- 3. Metas semanais configuráveis
CREATE TABLE public.bm_metas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dias_exercicio_meta integer DEFAULT 3,
  duracao_meta_min integer DEFAULT 30,
  refeicoes_meta_pct integer DEFAULT 70,
  ativo boolean DEFAULT true
);

-- 4. Log de estado diário (base da IA)
CREATE TABLE public.bm_log_estado (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL UNIQUE,
  humor integer, -- -2 a +2
  sono_horas decimal(4,1),
  sono_qualidade integer, -- 1 a 3
  remedio_tomado boolean,
  estado_energia text, -- foco_total | modo_leve | basico
  refeicoes_total integer DEFAULT 0,
  refeicoes_saudaveis integer DEFAULT 0,
  refeicoes_puladas integer DEFAULT 0,
  exercicio_feito boolean DEFAULT false,
  exercicio_min integer DEFAULT 0,
  exercicio_intensidade integer,
  ia_score_bem_estar integer, -- 0 a 100
  ia_sinais text[],
  ia_alerta text,
  created_at timestamptz DEFAULT now()
);

-- 5. Análise semanal da IA
CREATE TABLE public.bm_analise_semanal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semana_inicio date NOT NULL,
  semana_fim date NOT NULL,
  classificacao text, -- equilibrado | tendencia_mania | tendencia_depressao | misto | dados_insuficientes
  score_medio decimal(4,1),
  humor_medio decimal(4,1),
  sono_medio decimal(4,1),
  exercicios_semana integer,
  adesao_alimentar_pct integer,
  ia_resumo text,
  ia_insights jsonb,
  ia_alerta_nivel text, -- nenhum | leve | moderado | critico
  created_at timestamptz DEFAULT now(),
  UNIQUE(semana_inicio)
);

-- RLS
ALTER TABLE public.bm_refeicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bm_exercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bm_metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bm_log_estado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bm_analise_semanal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on bm_refeicoes" ON public.bm_refeicoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on bm_exercicios" ON public.bm_exercicios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on bm_metas" ON public.bm_metas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on bm_log_estado" ON public.bm_log_estado FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on bm_analise_semanal" ON public.bm_analise_semanal FOR ALL USING (true) WITH CHECK (true);

-- Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.bm_refeicoes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bm_exercicios;

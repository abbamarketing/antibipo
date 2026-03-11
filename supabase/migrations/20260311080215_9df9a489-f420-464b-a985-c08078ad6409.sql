
-- Tarefas domésticas configuráveis por cômodo
CREATE TABLE public.tarefas_casa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comodo text NOT NULL,
  tarefa text NOT NULL,
  frequencia text NOT NULL DEFAULT 'semanal', -- diario | semanal | quinzenal | mensal
  tempo_min integer DEFAULT 10,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Registros de limpeza (histórico)
CREATE TABLE public.registros_limpeza (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tarefa_casa_id uuid REFERENCES public.tarefas_casa(id) ON DELETE CASCADE,
  comodo text NOT NULL,
  tarefa text NOT NULL,
  feito_em timestamptz NOT NULL DEFAULT now(),
  notas text
);

-- Lista de compras
CREATE TABLE public.lista_compras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item text NOT NULL,
  quantidade text,
  categoria text DEFAULT 'geral', -- mercado | farmacia | casa | outro
  comprado boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.tarefas_casa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_limpeza ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lista_compras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on tarefas_casa" ON public.tarefas_casa FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on registros_limpeza" ON public.registros_limpeza FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on lista_compras" ON public.lista_compras FOR ALL USING (true) WITH CHECK (true);

-- Seed default room tasks
INSERT INTO public.tarefas_casa (comodo, tarefa, frequencia, tempo_min) VALUES
  ('Cozinha', 'Louça', 'diario', 10),
  ('Cozinha', 'Limpar superfícies', 'diario', 5),
  ('Cozinha', 'Limpar fogão', 'semanal', 15),
  ('Cozinha', 'Organizar geladeira', 'semanal', 20),
  ('Banheiro', 'Vaso', 'semanal', 10),
  ('Banheiro', 'Pia e espelho', 'semanal', 5),
  ('Banheiro', 'Chão', 'semanal', 10),
  ('Sala', 'Varrer/aspirar', 'semanal', 15),
  ('Sala', 'Organizar superfícies', 'diario', 5),
  ('Sala', 'Passar pano', 'semanal', 10),
  ('Quarto', 'Arrumar cama', 'diario', 2),
  ('Quarto', 'Roupa no lugar', 'diario', 5),
  ('Quarto', 'Trocar lençóis', 'quinzenal', 15),
  ('Quarto', 'Organizar armário', 'mensal', 30);


-- Financial tables (no user_id since app has no auth)
CREATE TABLE public.fc_lancamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ano integer NOT NULL,
  mes integer NOT NULL CHECK (mes BETWEEN 1 AND 12),
  dia integer NOT NULL CHECK (dia BETWEEN 1 AND 31),
  entrada decimal(15,2) DEFAULT 0,
  saida decimal(15,2) DEFAULT 0,
  diario text,
  saldo decimal(15,2),
  created_at timestamptz DEFAULT now(),
  UNIQUE(ano, mes, dia)
);

CREATE TABLE public.fc_consolidacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ano integer NOT NULL,
  mes integer NOT NULL,
  total_entradas decimal(15,2) DEFAULT 0,
  total_saidas decimal(15,2) DEFAULT 0,
  performance decimal(15,2) DEFAULT 0,
  saldo_inicial decimal(15,2) DEFAULT 0,
  saldo_final decimal(15,2) DEFAULT 0,
  UNIQUE(ano, mes)
);

CREATE TABLE public.fc_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  emoji text,
  cor text DEFAULT '#e5e7eb'
);

CREATE TABLE public.fc_lancamento_tags (
  lancamento_id uuid REFERENCES public.fc_lancamentos ON DELETE CASCADE,
  tag_id uuid REFERENCES public.fc_tags ON DELETE CASCADE,
  valor decimal(15,2),
  PRIMARY KEY (lancamento_id, tag_id)
);

ALTER TABLE public.fc_lancamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fc_consolidacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fc_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fc_lancamento_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on fc_lancamentos" ON public.fc_lancamentos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on fc_consolidacao" ON public.fc_consolidacao FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on fc_tags" ON public.fc_tags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on fc_lancamento_tags" ON public.fc_lancamento_tags FOR ALL USING (true) WITH CHECK (true);

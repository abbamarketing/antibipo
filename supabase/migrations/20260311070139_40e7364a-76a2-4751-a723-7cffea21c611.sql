
-- FLOW v2 Database Schema — Single user, no auth needed

-- Create enums
CREATE TYPE public.task_modulo AS ENUM ('trabalho', 'casa', 'saude');
CREATE TYPE public.task_tipo AS ENUM ('estrategico', 'operacional', 'delegavel', 'administrativo', 'domestico');
CREATE TYPE public.task_status AS ENUM ('backlog', 'hoje', 'em_andamento', 'aguardando', 'feito', 'descartado');
CREATE TYPE public.task_owner AS ENUM ('eu', 'socio_medico', 'editor');
CREATE TYPE public.energy_state AS ENUM ('foco_total', 'modo_leve', 'basico');
CREATE TYPE public.estado_ideal_type AS ENUM ('foco_total', 'modo_leve', 'basico', 'qualquer');

-- 1. tasks
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  modulo task_modulo NOT NULL DEFAULT 'trabalho',
  tipo task_tipo NOT NULL DEFAULT 'operacional',
  estado_ideal estado_ideal_type NOT NULL DEFAULT 'qualquer',
  urgencia INTEGER NOT NULL DEFAULT 2 CHECK (urgencia BETWEEN 1 AND 3),
  impacto INTEGER NOT NULL DEFAULT 2 CHECK (impacto BETWEEN 1 AND 3),
  tempo_min INTEGER NOT NULL DEFAULT 30,
  dono task_owner NOT NULL DEFAULT 'eu',
  cliente_id UUID,
  status task_status NOT NULL DEFAULT 'backlog',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  feito_em TIMESTAMPTZ
);

-- 2. medicamentos
CREATE TABLE public.medicamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  dose TEXT NOT NULL DEFAULT '1 comprimido',
  horarios TEXT[] NOT NULL DEFAULT '{}',
  instrucoes TEXT,
  estoque INTEGER NOT NULL DEFAULT 30,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. registros_medicamento
CREATE TABLE public.registros_medicamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medicamento_id UUID NOT NULL REFERENCES public.medicamentos(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  horario_previsto TIME NOT NULL,
  horario_tomado TIMESTAMPTZ,
  tomado BOOLEAN NOT NULL DEFAULT false
);

-- 4. registros_sono
CREATE TABLE public.registros_sono (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  horario_dormir TIMESTAMPTZ,
  horario_acordar TIMESTAMPTZ,
  duracao_min INTEGER,
  qualidade INTEGER CHECK (qualidade BETWEEN 1 AND 3)
);

-- 5. registros_humor
CREATE TABLE public.registros_humor (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
  valor INTEGER NOT NULL CHECK (valor BETWEEN -2 AND 2),
  notas TEXT
);

-- 6. sessoes_energia
CREATE TABLE public.sessoes_energia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  estado energy_state NOT NULL,
  hora_inicio TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. clientes
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  contato TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'proposta', 'pausado', 'encerrado')),
  valor_mensal NUMERIC,
  data_renovacao DATE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add FK for tasks.cliente_id
ALTER TABLE public.tasks ADD CONSTRAINT tasks_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE SET NULL;

-- Enable RLS on all tables (single user, allow all — no auth)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_medicamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_sono ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_humor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessoes_energia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Single-user policies: allow all operations with anon key
CREATE POLICY "Allow all on tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on medicamentos" ON public.medicamentos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on registros_medicamento" ON public.registros_medicamento FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on registros_sono" ON public.registros_sono FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on registros_humor" ON public.registros_humor FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on sessoes_energia" ON public.sessoes_energia FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on clientes" ON public.clientes FOR ALL USING (true) WITH CHECK (true);

-- Useful indexes
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_modulo ON public.tasks(modulo);
CREATE INDEX idx_registros_med_data ON public.registros_medicamento(data);
CREATE INDEX idx_registros_humor_data ON public.registros_humor(data);
CREATE INDEX idx_registros_sono_data ON public.registros_sono(data);
CREATE INDEX idx_sessoes_energia_data ON public.sessoes_energia(data);

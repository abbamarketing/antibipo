-- Custom trackers table for pre-scripted modules
CREATE TABLE public.custom_trackers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  titulo text NOT NULL,
  tipo text NOT NULL DEFAULT 'recorrente',
  modulo text NOT NULL DEFAULT 'saude',
  secao text NOT NULL DEFAULT 'geral',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.tracker_registros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracker_id uuid NOT NULL REFERENCES public.custom_trackers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  data date NOT NULL DEFAULT CURRENT_DATE,
  dados jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.custom_trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_registros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own trackers" ON public.custom_trackers
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own tracker records" ON public.tracker_registros
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_trackers_user_active ON public.custom_trackers(user_id, ativo) WHERE ativo = true;
CREATE INDEX idx_tracker_registros_tracker_data ON public.tracker_registros(tracker_id, data)
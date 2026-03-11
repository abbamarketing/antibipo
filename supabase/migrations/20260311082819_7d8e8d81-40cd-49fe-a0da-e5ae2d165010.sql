
-- Meetings/events calendar table
CREATE TABLE public.reunioes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  titulo text NOT NULL,
  descricao text,
  data date NOT NULL,
  hora_inicio time NOT NULL,
  hora_fim time,
  local text,
  participantes text[],
  tipo text DEFAULT 'reuniao' CHECK (tipo IN ('reuniao', 'consulta', 'call', 'evento', 'outro')),
  lembrete_min integer DEFAULT 15,
  cor text DEFAULT '#6366f1',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.reunioes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own meetings"
  ON public.reunioes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

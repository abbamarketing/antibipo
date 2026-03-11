
-- Profiles table for onboarding data
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nome text,
  data_nascimento date,
  peso_kg numeric,
  altura_cm integer,
  objetivo_saude text,
  trabalho_tipo text,
  trabalho_horas_dia integer,
  trabalho_desafio text,
  trabalho_clientes_ativos integer,
  trabalho_equipe text,
  casa_moradores integer,
  casa_comodos integer,
  casa_pets boolean DEFAULT false,
  casa_frequencia_ideal text,
  casa_desafio text,
  financeiro_faixa_renda text,
  financeiro_objetivo text,
  financeiro_controla_gastos text,
  financeiro_principal_gasto text,
  financeiro_reserva text,
  onboarding_saude boolean DEFAULT false,
  onboarding_trabalho boolean DEFAULT false,
  onboarding_casa boolean DEFAULT false,
  onboarding_financeiro boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Weight tracking table
CREATE TABLE public.registros_peso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  peso_kg numeric NOT NULL,
  data date NOT NULL DEFAULT CURRENT_DATE,
  notas text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.registros_peso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own weight records"
  ON public.registros_peso FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Populate NULL user_ids with the first existing user
DO $$
DECLARE
  v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users LIMIT 1;
  IF v_uid IS NULL THEN
    RAISE NOTICE 'No users found, skipping population';
    RETURN;
  END IF;

  UPDATE public.tasks SET user_id = v_uid WHERE user_id IS NULL;
  UPDATE public.medicamentos SET user_id = v_uid WHERE user_id IS NULL;
  UPDATE public.registros_medicamento SET user_id = v_uid WHERE user_id IS NULL;
  UPDATE public.registros_sono SET user_id = v_uid WHERE user_id IS NULL;
  UPDATE public.registros_humor SET user_id = v_uid WHERE user_id IS NULL;
  UPDATE public.sessoes_energia SET user_id = v_uid WHERE user_id IS NULL;
  UPDATE public.clientes SET user_id = v_uid WHERE user_id IS NULL;
  UPDATE public.activity_log SET user_id = v_uid WHERE user_id IS NULL;
END $$;

-- Now make user_id NOT NULL on all 8 tables
ALTER TABLE public.tasks ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.tasks ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE public.medicamentos ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.medicamentos ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE public.registros_medicamento ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.registros_medicamento ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE public.registros_sono ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.registros_sono ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE public.registros_humor ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.registros_humor ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE public.sessoes_energia ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.sessoes_energia ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE public.clientes ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.clientes ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE public.activity_log ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.activity_log ALTER COLUMN user_id SET DEFAULT auth.uid();

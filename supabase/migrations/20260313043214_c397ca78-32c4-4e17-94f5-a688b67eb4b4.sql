
-- Update unique constraint on registros_humor for upsert to work with user_id
ALTER TABLE public.registros_humor DROP CONSTRAINT IF EXISTS registros_humor_data_key;
CREATE UNIQUE INDEX IF NOT EXISTS registros_humor_user_data_unique ON public.registros_humor(user_id, data);

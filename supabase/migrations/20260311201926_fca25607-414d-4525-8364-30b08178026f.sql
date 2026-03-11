
-- Add subtasks support (self-referencing), recurrence, and dependency tracking
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS parent_task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS recorrente boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS frequencia_recorrencia text,
  ADD COLUMN IF NOT EXISTS depende_de text,
  ADD COLUMN IF NOT EXISTS notas text,
  ADD COLUMN IF NOT EXISTS data_limite date;

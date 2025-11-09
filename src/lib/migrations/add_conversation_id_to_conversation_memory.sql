-- Migration: Add conversation_id to conversation_memory if missing
-- Safe-guarded to avoid errors if the column already exists

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversation_memory'
      AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE public.conversation_memory
      ADD COLUMN conversation_id uuid;

    CREATE INDEX IF NOT EXISTS conversation_memory_conversation_id_idx
      ON public.conversation_memory (conversation_id);
  END IF;
END $$;

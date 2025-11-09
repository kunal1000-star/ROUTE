-- Migration: Add feedback_collected and expires_at to conversation_memory if missing
-- Safe and idempotent

DO $$
BEGIN
  -- feedback_collected boolean
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversation_memory'
      AND column_name = 'feedback_collected'
  ) THEN
    ALTER TABLE public.conversation_memory
      ADD COLUMN feedback_collected boolean DEFAULT false;
  END IF;

  -- expires_at timestamp with time zone
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversation_memory'
      AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE public.conversation_memory
      ADD COLUMN expires_at timestamptz;

    CREATE INDEX IF NOT EXISTS conversation_memory_expires_at_idx
      ON public.conversation_memory (expires_at);
  END IF;
END $$;

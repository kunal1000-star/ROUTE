-- Migration: Ensure conversation_memory has all required columns used by the app
-- Idempotent and safe to run multiple times

DO $$
BEGIN
  -- interaction_data jsonb
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversation_memory'
      AND column_name = 'interaction_data'
  ) THEN
    ALTER TABLE public.conversation_memory
      ADD COLUMN interaction_data JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;

  -- quality_score numeric(3,2)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversation_memory'
      AND column_name = 'quality_score'
  ) THEN
    ALTER TABLE public.conversation_memory
      ADD COLUMN quality_score DECIMAL(3,2);
  END IF;

  -- user_satisfaction numeric(3,2)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversation_memory'
      AND column_name = 'user_satisfaction'
  ) THEN
    ALTER TABLE public.conversation_memory
      ADD COLUMN user_satisfaction DECIMAL(3,2);
  END IF;

  -- feedback_collected boolean
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversation_memory'
      AND column_name = 'feedback_collected'
  ) THEN
    ALTER TABLE public.conversation_memory
      ADD COLUMN feedback_collected BOOLEAN DEFAULT FALSE;
  END IF;

  -- memory_relevance_score numeric(3,2)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversation_memory'
      AND column_name = 'memory_relevance_score'
  ) THEN
    ALTER TABLE public.conversation_memory
      ADD COLUMN memory_relevance_score DECIMAL(3,2);
  END IF;

  -- created_at timestamptz default now()
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversation_memory'
      AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.conversation_memory
      ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- updated_at timestamptz default now()
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversation_memory'
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.conversation_memory
      ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- expires_at timestamptz (if still missing)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversation_memory'
      AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE public.conversation_memory
      ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
    CREATE INDEX IF NOT EXISTS conversation_memory_expires_at_idx
      ON public.conversation_memory (expires_at);
  END IF;

  -- conversation_id uuid (if still missing)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversation_memory'
      AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE public.conversation_memory
      ADD COLUMN conversation_id UUID;
    CREATE INDEX IF NOT EXISTS conversation_memory_conversation_id_idx
      ON public.conversation_memory (conversation_id);
  END IF;

  -- core indexes (idempotent)
  CREATE INDEX IF NOT EXISTS idx_conversation_memory_user ON public.conversation_memory(user_id);
  CREATE INDEX IF NOT EXISTS idx_conversation_memory_conversation ON public.conversation_memory(conversation_id);
END $$;
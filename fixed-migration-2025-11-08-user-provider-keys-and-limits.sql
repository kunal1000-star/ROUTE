-- Migration: User Provider API Keys and Per-User Rate Limits
-- Date: 2025-11-08
-- Description:
--   Adds tables for securely storing per-user provider API keys (encrypted at app-level)
--   and per-user, per-provider request limits configurable from the app UI.

BEGIN;

-- Table: user_provider_keys
-- Stores encrypted API keys per user and provider. Keys are encrypted at the app level
-- using AES-256-GCM. The database stores the ciphertext and IV only.
CREATE TABLE IF NOT EXISTS public.user_provider_keys (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  encrypted_key bytea NOT NULL,
  iv bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_provider_keys_pkey PRIMARY KEY (user_id, provider)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_user_provider_keys_user ON public.user_provider_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_provider_keys_provider ON public.user_provider_keys(provider);

-- Table: user_provider_limits
-- Stores per-user, per-provider rate limits (requests per minute).
CREATE TABLE IF NOT EXISTS public.user_provider_limits (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  max_requests_per_min integer NOT NULL DEFAULT 60,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_provider_limits_pkey PRIMARY KEY (user_id, provider)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_user_provider_limits_user ON public.user_provider_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_provider_limits_provider ON public.user_provider_limits(provider);

COMMIT;

# AI System Audit and Migration Plan

This document captures the static analysis of the AI system, the database schema mismatches, and a concrete migration plan with SQL scripts to stabilize the system. As requested, this is based on code inspection only and ignores .md/docs as sources of truth.

## Summary: What’s working vs. not working

- AI chat core: Implemented
  - Tables: `chat_conversations`, `chat_messages`, `study_chat_memory`, `memory_summaries`, `student_ai_profile`, `api_usage_logs`, `ai_system_prompts` (via `src/lib/migrations/create_ai_tables.sql`).
  - Functions: `create_chat_conversation`, `add_chat_message`, `add_study_memory`, `find_similar_memories`, `log_api_usage`, `run_maintenance_tasks` (via `src/lib/migrations/create_automation_functions.sql`).
  - RLS: fixed in `fixed-migration-2025-11-05-fix-chat-rls.sql`.

- AI suggestions and Analytics: Implemented
  - `ai_suggestions` (+ analytics views/policies) via `fixed-migration-2025-11-04-ai-suggestions.sql` and `create-ai-suggestions-table.sql` (but see issue below).
  - `analytics_events`, `user_goals`, `performance_metrics`, `learning_velocity`, `feature_usage_analytics`, `system_metrics`, `ab_test_results` via `fixed-migration-2025-11-04-analytics.sql`.
  - File analyses suite via `fixed-migration-2025-11-04-file-analyses.sql`.

## Critical errors/mismatches detected

1) Missing core app tables used by the AI system
   Referenced in code, but no migrations exist for:
   - `activity_logs` (src/lib/ai/activity-logger.ts, context-builder, daily-summary)
   - `daily_activity_summary` (context-builder, daily-summary)
   - `blocks` (context-builder, schedule-data-service)
   - `topics`, `revision_topics` (context-builder, student-context-builder)
   - `subjects` (student-context-builder)
   - `user_gamification` (chat-integration, student-context-builder)
   - `study_sessions`, `questions_attempted` (analytics-data-service, mistral-data-service)
   - `sessions` (prediction-data-service, schedule-data-service) — likely intended as `study_sessions`; if both are needed, both must exist.

2) Missing Mistral analyses storage
   - Table `mistral_analyses` is referenced extensively (src/lib/ai/mistral-data-service.ts, analytics-data-service.ts) but no migration exists.

3) Profiles mismatch
   - Code references `user_profiles` and `student_profiles` (mistral-data-service.ts, prediction-data-service.ts). Only `profiles` table is implemented (`src/lib/migrations/create_profiles_table.sql`).

4) Google Drive credentials missing
   - `supabaseBrowserClient.from('user_gdrive_credentials').upsert(...)` in `src/lib/supabase.ts`.
   - No migration for `user_gdrive_credentials`.

5) Cache events missing
   - `cache_events` is referenced (src/lib/ai/realtime-data-integration.ts) but not defined.

6) Bug in `generate_memory_summaries()`
   - In `create_automation_functions.sql`, the weekly summary SELECT includes `AND summary_text IS NOT NULL` inside the `FROM study_chat_memory` query where no `summary_text` column exists. That’s a SQL error.

7) `ai_suggestions.user_id` type inconsistency
   - `create-ai-suggestions-table.sql` defines `user_id TEXT`.
   - Other schema uses `UUID user_id` and policies use `auth.uid()` (UUID). This inconsistency can break joins and RLS.

## Which “plan” is not working and why

- Mistral analyses plan: Code is complete, but DB table `mistral_analyses` is missing — cannot persist or query analyses.
- AI centralized data context plan: AI context builders rely on telemetry tables (activity logs, daily summaries, topics, blocks) that are not created — those code paths will fail or return empty.
- Profiles integration for predictions: Code expects `user_profiles`/`student_profiles`, but only `profiles` exists — dependent features will break.
- Google Drive integration: `saveGoogleCredentials` relies on `user_gdrive_credentials` — missing table breaks OAuth persistence.
- Realtime analytics cache events: `cache_events` missing — realtime dashboard references will fail.

---

## Proposed New SQL (to add as migrations)

Below are migration scripts you can apply. They assume consistent `UUID` for `user_id` across the system. Adjust naming/columns as needed to align with your UI/API.

### 1) 0001_core_app_tables.sql

```sql
-- Activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  summary TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own activity logs" ON activity_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON activity_logs(user_id, created_at DESC);

-- Daily activity summary
CREATE TABLE IF NOT EXISTS daily_activity_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_time_minutes INTEGER DEFAULT 0,
  topics_completed INTEGER DEFAULT 0,
  sessions_count INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
ALTER TABLE daily_activity_summary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own daily summary" ON daily_activity_summary
  FOR SELECT USING (auth.uid() = user_id);
CREATE TRIGGER update_daily_activity_summary_updated
  BEFORE UPDATE ON daily_activity_summary
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subjects" ON subjects FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_subjects_user ON subjects(user_id);

-- Blocks
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  subject_id INT REFERENCES subjects(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own blocks" ON blocks FOR SELECT USING (auth.uid() = user_id);
CREATE TRIGGER update_blocks_updated BEFORE UPDATE ON blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Topics
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id INT REFERENCES subjects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  is_remaining BOOLEAN DEFAULT false,
  is_in_spare BOOLEAN DEFAULT false,
  revision_count INT DEFAULT 0,
  next_revision_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own topics" ON topics FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_topics_user_remaining ON topics(user_id, is_remaining);
CREATE INDEX IF NOT EXISTS idx_topics_user_spare ON topics(user_id, is_in_spare);
CREATE INDEX IF NOT EXISTS idx_topics_user_nextrev ON topics(user_id, next_revision_date);
CREATE TRIGGER update_topics_updated BEFORE UPDATE ON topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Revision topics
CREATE TABLE IF NOT EXISTS revision_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE revision_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own revision topics" ON revision_topics FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_revision_topics_user_topic ON revision_topics(user_id, topic_id);

-- Gamification
CREATE TABLE IF NOT EXISTS user_gamification (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INT DEFAULT 0,
  total_points_earned INT DEFAULT 0,
  last_awarded_at TIMESTAMPTZ
);
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own gamification" ON user_gamification FOR SELECT USING (auth.uid() = user_id);

-- Study sessions
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id INT REFERENCES subjects(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own study sessions" ON study_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_time ON study_sessions(user_id, start_time DESC);

-- Questions attempted
CREATE TABLE IF NOT EXISTS questions_attempted (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id INT REFERENCES subjects(id) ON DELETE SET NULL,
  question_id TEXT,
  correct BOOLEAN,
  difficulty TEXT,
  time_spent_seconds INT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE questions_attempted ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own questions" ON questions_attempted FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_questions_attempted_user_time ON questions_attempted(user_id, created_at DESC);
```

### 2) 0002_mistral_analyses.sql

```sql
CREATE TABLE IF NOT EXISTS mistral_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT,
  input_summary TEXT,
  analysis JSONB,
  score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE mistral_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own mistral analyses" ON mistral_analyses
  FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_mistral_analyses_user_time ON mistral_analyses(user_id, created_at DESC);
```

### 3) 0003_profiles_compat.sql

```sql
-- Compatibility view for user_profiles
CREATE OR REPLACE VIEW user_profiles AS
  SELECT id AS user_id, email, full_name, avatar_url, created_at, updated_at
  FROM profiles;

-- Minimal student_profiles (if needed)
CREATE TABLE IF NOT EXISTS student_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  grade TEXT,
  target_exam TEXT,
  preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own student profile" ON student_profiles
  FOR SELECT USING (auth.uid() = user_id);
```

### 4) 0004_cache_and_credentials.sql

```sql
-- Cache events used by realtime dashboards
CREATE TABLE IF NOT EXISTS cache_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  key TEXT,
  hit BOOLEAN,
  latency_ms INT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE cache_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own cache events" ON cache_events FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_cache_events_user_time ON cache_events(user_id, created_at DESC);

-- Google Drive OAuth credentials
CREATE TABLE IF NOT EXISTS user_gdrive_credentials (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE user_gdrive_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own gdrive creds" ON user_gdrive_credentials
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 5) 0005_fix_ai_functions.sql

```sql
-- Fix: remove invalid reference to study_chat_memory.summary_text in weekly summary
CREATE OR REPLACE FUNCTION generate_memory_summaries()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  week_start DATE;
  week_end DATE;
  month_start DATE;
  month_end DATE;
  summary_text TEXT;
  memory_count INTEGER;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT user_id FROM study_chat_memory WHERE is_active = true
  LOOP
    week_start := CURRENT_DATE - INTERVAL '7 days';
    week_end := CURRENT_DATE;

    SELECT 
      'Weekly Summary: ' || COUNT(*) || ' insights captured. ' ||
      'Top subjects: ' || COALESCE(string_agg(DISTINCT unnest(tags), ', '), '') ||
      '. Generated on ' || CURRENT_DATE::TEXT,
      COUNT(*)
    INTO summary_text, memory_count
    FROM study_chat_memory 
    WHERE user_id = user_record.user_id 
      AND created_at >= week_start 
      AND is_active = true;

    IF summary_text IS NOT NULL AND memory_count > 0 THEN
      INSERT INTO memory_summaries (user_id, summary_type, period_start, period_end, summary_text, expires_at)
      VALUES (user_record.user_id, 'weekly', week_start, week_end, summary_text, NOW() + INTERVAL '1 month');
    END IF;

    month_start := CURRENT_DATE - INTERVAL '30 days';
    month_end := CURRENT_DATE;

    SELECT 
      'Monthly Summary: ' || COUNT(*) || ' total insights captured. ' ||
      'Most important areas: ' ||
      COALESCE(
        array_to_string(
          (SELECT array_agg(content) 
           FROM (
             SELECT DISTINCT content 
             FROM study_chat_memory 
             WHERE user_id = user_record.user_id 
               AND importance_score >= 4 
               AND created_at >= month_start 
             LIMIT 3
           ) t
          ),
          ', '
        ), ''
      ) ||
      '. Generated on ' || CURRENT_DATE::TEXT,
      COUNT(*)
    INTO summary_text, memory_count
    FROM study_chat_memory 
    WHERE user_id = user_record.user_id 
      AND created_at >= month_start 
      AND is_active = true;

    IF summary_text IS NOT NULL AND memory_count > 0 THEN
      INSERT INTO memory_summaries (user_id, summary_type, period_start, period_end, summary_text, expires_at)
      VALUES (user_record.user_id, 'monthly', month_start, month_end, summary_text, NOW() + INTERVAL '3 months');
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### 6) 0006_ai_suggestions_normalize.sql

```sql
-- Normalize ai_suggestions.user_id to UUID for consistency
ALTER TABLE ai_suggestions
  ALTER COLUMN user_id TYPE UUID USING user_id::uuid;

-- Ensure policies use UUID directly
DROP POLICY IF EXISTS "Users can view their own AI suggestions" ON ai_suggestions;
DROP POLICY IF EXISTS "Users can insert their own AI suggestions" ON ai_suggestions;
DROP POLICY IF EXISTS "Users can update their own AI suggestions" ON ai_suggestions;
CREATE POLICY "Users can view own AI suggestions" ON ai_suggestions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI suggestions" ON ai_suggestions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own AI suggestions" ON ai_suggestions
  FOR UPDATE USING (auth.uid() = user_id);
```

---

## Implementation Plan (step-by-step)

1) Decide on profiles strategy:
   - Preferred: Update code to consistently use `profiles`.
   - If code churn is costly: apply `0003_profiles_compat.sql` to provide `user_profiles` view and a minimal `student_profiles` table.

2) Apply foundational helpers if not already present:
   - Ensure `update_updated_at_column()` exists (it does in `create_automation_functions.sql`).
   - Ensure `vector` and `pgcrypto` extensions (they are set up in `create_ai_tables.sql`).

3) Create missing core app tables:
   - Apply `0001_core_app_tables.sql`.

4) Create Mistral analyses storage:
   - Apply `0002_mistral_analyses.sql`.

5) Add cache and Google Drive credentials:
   - Apply `0004_cache_and_credentials.sql`.

6) Fix AI function bug:
   - Apply `0005_fix_ai_functions.sql`.

7) Normalize `ai_suggestions.user_id` type:
   - Apply `0006_ai_suggestions_normalize.sql`.
   - Drop or migrate the older `create-ai-suggestions-table.sql` if redundant to avoid conflicts with `fixed-migration-2025-11-04-ai-suggestions.sql`.

8) Verify and iterate:
   - Run DB validation and targeted tests: `src/lib/database/validation-tests.js`, `src/lib/ai/tests/database-integration.test.ts`.
   - Spot-check API routes that rely on these tables (analytics, chat, study-assistant, suggestions).

## Why this plan stabilizes the AI system

- Fills schema gaps directly referenced by AI service layer (context-building, analytics, Mistral, gamification, scheduling).
- Aligns `user_id` types to `UUID` across the board, avoiding subtle RLS/join issues.
- Fixes a SQL bug that would break maintenance routines.
- Restores profile compatibility with minimal disruption.

## Next Steps (options)

- Create Jira work items for each migration and bug fix.
- Create a Confluence page summarizing findings and linking migrations.
- Prepare a PR branch adding these migrations and optional code alignment for profiles.


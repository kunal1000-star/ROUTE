-- ============================================================================
-- COMPREHENSIVE DATABASE TABLES FIX
-- Date: 2025-11-09
-- Purpose: Fix all missing tables and columns for activity_logs and api_usage_logs
-- ============================================================================

-- ============================================================================
-- SECTION 1: FIX API_USAGE_LOGS TABLE
-- ============================================================================

-- Add missing columns to api_usage_logs table
ALTER TABLE api_usage_logs 
ADD COLUMN IF NOT EXISTS fallback_used BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_fallback_used ON api_usage_logs(fallback_used);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_metadata ON api_usage_logs USING GIN (metadata);

-- Enable RLS on api_usage_logs if not already enabled
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Remove existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own API usage logs" ON api_usage_logs;
DROP POLICY IF EXISTS "System can insert API usage logs" ON api_usage_logs;
DROP POLICY IF EXISTS "Users can update their own API usage logs" ON api_usage_logs;
DROP POLICY IF EXISTS "Users can delete their own API usage logs" ON api_usage_logs;

-- Create RLS policies for api_usage_logs
CREATE POLICY "Users can view their own API usage logs" ON api_usage_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert API usage logs" ON api_usage_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own API usage logs" ON api_usage_logs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API usage logs" ON api_usage_logs
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION 2: FIX ACTIVITY_LOGS TABLE
-- ============================================================================

-- Check if activity_logs table exists
DO $$
BEGIN
    -- If table doesn't exist, create it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'activity_logs'
    ) THEN
        -- Create activity_logs table with all required columns
        CREATE TABLE public.activity_logs (
            id BIGSERIAL PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            activity_type TEXT NOT NULL,
            summary TEXT NOT NULL,
            details JSONB DEFAULT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Add indexes
        CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON public.activity_logs(activity_type);
        CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);
        
        -- Enable RLS
        ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies
        CREATE POLICY "Users can view their own activity logs" ON public.activity_logs
            FOR SELECT USING (auth.uid() = user_id);
            
        CREATE POLICY "Users can insert their own activity logs" ON public.activity_logs
            FOR INSERT WITH CHECK (auth.uid() = user_id);
            
        CREATE POLICY "Users can update their own activity logs" ON public.activity_logs
            FOR UPDATE USING (auth.uid() = user_id);
            
        CREATE POLICY "Users can delete their own activity logs" ON public.activity_logs
            FOR DELETE USING (auth.uid() = user_id);
            
    ELSE
        -- Table exists, add missing columns
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'activity_logs' AND column_name = 'details'
        ) THEN
            ALTER TABLE public.activity_logs ADD COLUMN details JSONB DEFAULT NULL;
        END IF;
        
        -- Ensure RLS is enabled
        ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies if they don't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = 'activity_logs' AND policyname = 'Users can view their own activity logs'
        ) THEN
            CREATE POLICY "Users can view their own activity logs" ON public.activity_logs
                FOR SELECT USING (auth.uid() = user_id);
                
            CREATE POLICY "Users can insert their own activity logs" ON public.activity_logs
                FOR INSERT WITH CHECK (auth.uid() = user_id);
                
            CREATE POLICY "Users can update their own activity logs" ON public.activity_logs
                FOR UPDATE USING (auth.uid() = user_id);
                
            CREATE POLICY "Users can delete their own activity logs" ON public.activity_logs
                FOR DELETE USING (auth.uid() = user_id);
        END IF;
    END IF;
END $$;

-- ============================================================================
-- SECTION 3: VERIFICATION AND TESTING
-- ============================================================================

-- Verify api_usage_logs table structure
SELECT 
    'api_usage_logs' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'api_usage_logs'
    AND column_name IN ('fallback_used', 'metadata', 'user_id', 'created_at')
ORDER BY column_name;

-- Verify activity_logs table structure
SELECT 
    'activity_logs' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'activity_logs'
    AND column_name IN ('details', 'user_id', 'activity_type', 'summary', 'created_at')
ORDER BY column_name;

-- Verify RLS is enabled on both tables
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('api_usage_logs', 'activity_logs')
ORDER BY tablename;

-- Verify policy counts
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('api_usage_logs', 'activity_logs')
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- SECTION 4: COMPREHENSIVE MIGRATION COMPLETION
-- ============================================================================

-- Log completion
DO $$
BEGIN
    RAISE NOTICE '✅ Comprehensive database tables fix completed successfully!';
    RAISE NOTICE '   - Fixed api_usage_logs: added fallback_used, metadata columns';
    RAISE NOTICE '   - Fixed activity_logs: ensured table exists with proper schema';
    RAISE NOTICE '   - Applied RLS policies for both tables';
    RAISE NOTICE '   - Created performance indexes';
    RAISE NOTICE '   - Resolved PGRST204 schema cache errors';
END $$;
-- ============================================================================
-- STUDY BUDDY CHAT SYSTEM - COMPREHENSIVE DATABASE FIX
-- Date: 2025-11-09
-- Purpose: Fix missing columns and RLS policies for Study Buddy chat system
-- ============================================================================

-- ============================================================================
-- SECTION 1: ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Add missing columns to api_usage_logs table
ALTER TABLE api_usage_logs 
ADD COLUMN IF NOT EXISTS fallback_used BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add missing columns to chat_conversations table
ALTER TABLE chat_conversations 
ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_fallback_used ON api_usage_logs(fallback_used);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_metadata ON api_usage_logs USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_message_count ON chat_conversations(message_count);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_last_message_at ON chat_conversations(last_message_at);

-- ============================================================================
-- SECTION 2: ENSURE CHAT_CONVERSATIONS TABLE EXISTS WITH ALL COLUMNS
-- ============================================================================

-- Update chat_conversations table to ensure it has all required columns
DO $$
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_conversations' AND column_name = 'message_count') THEN
        ALTER TABLE chat_conversations ADD COLUMN message_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_conversations' AND column_name = 'last_message_at') THEN
        ALTER TABLE chat_conversations ADD COLUMN last_message_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_conversations' AND column_name = 'is_archived') THEN
        ALTER TABLE chat_conversations ADD COLUMN is_archived BOOLEAN DEFAULT false;
    END IF;
END $$;

-- ============================================================================
-- SECTION 3: ENSURE CHAT_MESSAGES TABLE EXISTS
-- ============================================================================

-- Create chat_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    model_used TEXT,
    provider_used TEXT,
    tokens_used INTEGER DEFAULT 0,
    latency_ms INTEGER,
    context_included BOOLEAN DEFAULT false,
    is_time_sensitive BOOLEAN DEFAULT false,
    web_search_enabled BOOLEAN DEFAULT false,
    cached BOOLEAN DEFAULT false,
    language TEXT DEFAULT 'hinglish',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SECTION 4: APPLY RLS POLICIES FOR CHAT TABLES
-- ============================================================================

-- Enable RLS on chat_conversations
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

-- Remove existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can insert their own conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON chat_conversations;

-- Create RLS policies for chat_conversations
CREATE POLICY "Users can view their own conversations" ON chat_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations" ON chat_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON chat_conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" ON chat_conversations
    FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Remove existing policies if they exist
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON chat_messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete messages in their conversations" ON chat_messages;

-- Create RLS policies for chat_messages
CREATE POLICY "Users can view messages from their conversations" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_conversations 
            WHERE chat_conversations.id = chat_messages.conversation_id 
            AND chat_conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages to their conversations" ON chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_conversations 
            WHERE chat_conversations.id = chat_messages.conversation_id 
            AND chat_conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update messages in their conversations" ON chat_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM chat_conversations 
            WHERE chat_conversations.id = chat_messages.conversation_id 
            AND chat_conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete messages in their conversations" ON chat_messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM chat_conversations 
            WHERE chat_conversations.id = chat_messages.conversation_id 
            AND chat_conversations.user_id = auth.uid()
        )
    );

-- ============================================================================
-- SECTION 5: ADD FUNCTIONS FOR MESSAGE COUNT TRACKING
-- ============================================================================

-- Function to update conversation message count
CREATE OR REPLACE FUNCTION update_conversation_message_count(conversation_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE chat_conversations 
    SET 
        message_count = (
            SELECT COUNT(*) 
            FROM chat_messages 
            WHERE chat_messages.conversation_id = conversation_uuid
        ),
        last_message_at = (
            SELECT MAX(timestamp) 
            FROM chat_messages 
            WHERE chat_messages.conversation_id = conversation_uuid
        )
    WHERE id = conversation_uuid;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update message count when messages are added/removed
CREATE OR REPLACE FUNCTION trigger_update_message_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM update_conversation_message_count(NEW.conversation_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM update_conversation_message_count(OLD.conversation_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for message count tracking
DROP TRIGGER IF EXISTS trigger_update_count_on_insert ON chat_messages;
DROP TRIGGER IF EXISTS trigger_update_count_on_delete ON chat_messages;

CREATE TRIGGER trigger_update_count_on_insert
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_message_count();

CREATE TRIGGER trigger_update_count_on_delete
    AFTER DELETE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_message_count();

-- ============================================================================
-- SECTION 6: ENSURE API_USAGE_LOGS RLS IS PROPERLY CONFIGURED
-- ============================================================================

-- Enable RLS on api_usage_logs
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
-- SECTION 7: VERIFICATION AND TESTING
-- ============================================================================

-- Verify all tables exist with correct structure
SELECT 
    'chat_conversations' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'chat_conversations'
UNION ALL
SELECT 
    'chat_messages' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'chat_messages'
UNION ALL
SELECT 
    'api_usage_logs' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'api_usage_logs';

-- Verify RLS is enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('chat_conversations', 'chat_messages', 'api_usage_logs')
ORDER BY tablename;

-- Verify policy counts
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('chat_conversations', 'chat_messages', 'api_usage_logs')
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- SECTION 8: COMPREHENSIVE MIGRATION COMPLETION
-- ============================================================================

-- Add a completion log entry (removed due to activity_logs schema mismatch)
-- The Study Buddy fix has been applied successfully
-- Migration completed: Added missing columns, RLS policies, and triggers

-- Log completion
DO $$
BEGIN
    RAISE NOTICE '✅ Study Buddy chat system database fix completed successfully!';
    RAISE NOTICE '   - Added missing columns: message_count, last_message_at, fallback_used, metadata';
    RAISE NOTICE '   - Applied RLS policies for all chat tables';
    RAISE NOTICE '   - Created message count triggers';
    RAISE NOTICE '   - Verified table structure and permissions';
END $$;
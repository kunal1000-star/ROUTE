-- Fix RLS policies for conversation_memory table to enable server-side memory storage
-- This fix allows the Study Buddy API to store memories server-side

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can only access their own memories" ON conversation_memory;
DROP POLICY IF EXISTS "Users can view their own memories" ON conversation_memory;
DROP POLICY IF EXISTS "Users can insert their own memories" ON conversation_memory;
DROP POLICY IF EXISTS "Users can update their own memories" ON conversation_memory;
DROP POLICY IF EXISTS "Users can delete their own memories" ON conversation_memory;
DROP POLICY IF EXISTS "Allow server-side conversation memory operations" ON conversation_memory;
DROP POLICY IF EXISTS "Users can read their own conversation memories" ON conversation_memory;
DROP POLICY IF EXISTS "Allow public read for memory context" ON conversation_memory;
DROP POLICY IF EXISTS "Authenticated users can manage their memories" ON conversation_memory;
DROP POLICY IF EXISTS "Users can read their own study chat memories" ON study_chat_memory;
DROP POLICY IF EXISTS "Users can manage their own study chat memories" ON study_chat_memory;

-- Create comprehensive RLS policies for conversation_memory table
-- Policy 1: Allow users to read their own memories
CREATE POLICY "Users can read their own conversation memories" 
ON conversation_memory FOR SELECT 
USING (user_id = auth.uid() OR user_id IS NULL);

-- Policy 2: Allow server-side operations (Study Buddy API)
CREATE POLICY "Allow server-side conversation memory operations" 
ON conversation_memory FOR ALL 
USING (true)
WITH CHECK (true);

-- Policy 3: Allow public read access for memory context retrieval
CREATE POLICY "Allow public read for memory context" 
ON conversation_memory FOR SELECT 
USING (true);

-- Policy 4: Allow authenticated users to manage their memories
CREATE POLICY "Authenticated users can manage their memories" 
ON conversation_memory FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON conversation_memory TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Also fix the related table study_chat_memory if it exists
-- Create policies for study_chat_memory table
CREATE POLICY "Users can read their own study chat memories" 
ON study_chat_memory FOR SELECT 
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can manage their own study chat memories" 
ON study_chat_memory FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enable RLS and grant permissions
ALTER TABLE study_chat_memory ENABLE ROW LEVEL SECURITY;
GRANT ALL ON study_chat_memory TO anon, authenticated, service_role;

-- Grant schema permissions if not already granted
GRANT USAGE ON SCHEMA public TO service_role;
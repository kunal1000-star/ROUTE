-- Complete Database Schema Fix for Study Buddy System
-- =====================================================
-- This script fixes the missing educational_knowledge_base table
-- and related tables for the hallucination prevention system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Educational Sources Table
CREATE TABLE IF NOT EXISTS educational_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('textbook', 'website', 'academic_paper', 'official_doc', 'verified_content')),
    title TEXT NOT NULL,
    content TEXT,
    url TEXT,
    author VARCHAR(255),
    publication_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('verified', 'pending', 'disputed')),
    reliability DECIMAL(3,2) DEFAULT 0.5 CHECK (reliability >= 0 AND reliability <= 1),
    topics TEXT[] DEFAULT '{}',
    citations INTEGER DEFAULT 0,
    educational_relevance DECIMAL(3,2) DEFAULT 0.5 CHECK (educational_relevance >= 0 AND educational_relevance <= 1),
    metadata JSONB DEFAULT '{}',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Educational Knowledge Base Table (Main Table)
CREATE TABLE IF NOT EXISTS educational_knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT,
    content TEXT NOT NULL,
    source TEXT,
    source_id UUID REFERENCES educational_sources(id) ON DELETE SET NULL,
    reliability DECIMAL(3,2) DEFAULT 0.5 CHECK (reliability >= 0 AND reliability <= 1),
    topics TEXT[] DEFAULT '{}',
    subject VARCHAR(100),
    type VARCHAR(20) DEFAULT 'fact' CHECK (type IN ('fact', 'concept', 'procedure', 'example', 'reference')),
    difficulty_level INTEGER DEFAULT 3 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    related_concepts TEXT[] DEFAULT '{}',
    educational_value DECIMAL(3,2) DEFAULT 0.5 CHECK (educational_value >= 0 AND educational_value <= 1),
    prerequisites TEXT[] DEFAULT '{}',
    learning_objectives TEXT[] DEFAULT '{}',
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('verified', 'pending', 'disputed')),
    explanation TEXT,
    examples TEXT[] DEFAULT '{}',
    common_misconceptions TEXT[] DEFAULT '{}',
    related_questions TEXT[] DEFAULT '{}',
    difficulty_progression DECIMAL(3,2) DEFAULT 0,
    retention_score DECIMAL(3,2) DEFAULT 0.5,
    engagement_score DECIMAL(3,2) DEFAULT 0.5,
    accuracy_score DECIMAL(3,2) DEFAULT 0.5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fact Relationships Table for knowledge linking
CREATE TABLE IF NOT EXISTS fact_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fact_id UUID REFERENCES educational_knowledge_base(id) ON DELETE CASCADE,
    related_fact_id UUID REFERENCES educational_knowledge_base(id) ON DELETE CASCADE,
    relationship_type VARCHAR(20) CHECK (relationship_type IN ('supports', 'contradicts', 'elaborates', 'prerequisite', 'consequence')),
    relationship_strength DECIMAL(3,2) DEFAULT 0.5 CHECK (relationship_strength >= 0 AND relationship_strength <= 1),
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(fact_id, related_fact_id)
);

-- Conversation Memory Table
CREATE TABLE IF NOT EXISTS conversation_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    conversation_id UUID,
    interaction_data JSONB NOT NULL DEFAULT '{}',
    quality_score DECIMAL(3,2) DEFAULT 0.5 CHECK (quality_score >= 0 AND quality_score <= 1),
    user_satisfaction DECIMAL(3,2),
    feedback_collected BOOLEAN DEFAULT FALSE,
    memory_relevance_score DECIMAL(3,2) DEFAULT 0.5 CHECK (memory_relevance_score >= 0 AND memory_relevance_score <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Context Optimization Logs Table
CREATE TABLE IF NOT EXISTS context_optimization_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    query_hash VARCHAR(64) NOT NULL,
    original_context JSONB NOT NULL DEFAULT '{}',
    optimized_context JSONB NOT NULL DEFAULT '{}',
    size_reduction INTEGER DEFAULT 0,
    relevance_score DECIMAL(3,2) DEFAULT 0,
    optimization_strategy VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_educational_knowledge_base_subject ON educational_knowledge_base(subject);
CREATE INDEX IF NOT EXISTS idx_educational_knowledge_base_type ON educational_knowledge_base(type);
CREATE INDEX IF NOT EXISTS idx_educational_knowledge_base_topics ON educational_knowledge_base USING GIN(topics);
CREATE INDEX IF NOT EXISTS idx_educational_knowledge_base_search ON educational_knowledge_base USING GIN(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_educational_knowledge_base_verification ON educational_knowledge_base(verification_status);
CREATE INDEX IF NOT EXISTS idx_educational_knowledge_base_educational_value ON educational_knowledge_base(educational_value);

CREATE INDEX IF NOT EXISTS idx_educational_sources_type ON educational_sources(type);
CREATE INDEX IF NOT EXISTS idx_educational_sources_verification ON educational_sources(verification_status);
CREATE INDEX IF NOT EXISTS idx_educational_sources_reliability ON educational_sources(reliability);
CREATE INDEX IF NOT EXISTS idx_educational_sources_search ON educational_sources USING GIN(to_tsvector('english', title || ' ' || COALESCE(content, '')));

CREATE INDEX IF NOT EXISTS idx_fact_relationships_fact_id ON fact_relationships(fact_id);
CREATE INDEX IF NOT EXISTS idx_fact_relationships_related_fact_id ON fact_relationships(related_fact_id);
CREATE INDEX IF NOT EXISTS idx_fact_relationships_type ON fact_relationships(relationship_type);

CREATE INDEX IF NOT EXISTS idx_conversation_memory_user_id ON conversation_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_conversation_id ON conversation_memory(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_created_at ON conversation_memory(created_at);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_expires_at ON conversation_memory(expires_at);

CREATE INDEX IF NOT EXISTS idx_context_optimization_logs_user_id ON context_optimization_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_context_optimization_logs_created_at ON context_optimization_logs(created_at);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_educational_sources_updated_at BEFORE UPDATE ON educational_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_educational_knowledge_base_updated_at BEFORE UPDATE ON educational_knowledge_base
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fact_relationships_updated_at BEFORE UPDATE ON fact_relationships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversation_memory_updated_at BEFORE UPDATE ON conversation_memory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE educational_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE educational_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_optimization_logs ENABLE ROW LEVEL SECURITY;

-- Policies for educational_sources (public read access)
CREATE POLICY "Educational sources are viewable by everyone" ON educational_sources
    FOR SELECT USING (true);

CREATE POLICY "Educational sources are insertable by authenticated users" ON educational_sources
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Educational sources are updatable by authenticated users" ON educational_sources
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policies for educational_knowledge_base (public read access)
CREATE POLICY "Educational knowledge base is viewable by everyone" ON educational_knowledge_base
    FOR SELECT USING (true);

CREATE POLICY "Educational knowledge base is insertable by authenticated users" ON educational_knowledge_base
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Educational knowledge base is updatable by authenticated users" ON educational_knowledge_base
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policies for conversation_memory (user-specific access)
CREATE POLICY "Users can view their own conversation memory" ON conversation_memory
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversation memory" ON conversation_memory
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversation memory" ON conversation_memory
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversation memory" ON conversation_memory
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for fact_relationships (public read access)
CREATE POLICY "Fact relationships are viewable by everyone" ON fact_relationships
    FOR SELECT USING (true);

CREATE POLICY "Fact relationships are insertable by authenticated users" ON fact_relationships
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Fact relationships are updatable by authenticated users" ON fact_relationships
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policies for context_optimization_logs (user-specific access)
CREATE POLICY "Users can view their own optimization logs" ON context_optimization_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own optimization logs" ON context_optimization_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert some sample educational content
INSERT INTO educational_sources (type, title, content, author, reliability, verification_status, educational_relevance) VALUES
('textbook', 'Introduction to Computer Science', 'Computer science is the study of algorithms, data structures, and computational systems.', 'Dr. Smith', 0.9, 'verified', 0.95),
('website', 'Khan Academy - Algebra', 'Algebra is a branch of mathematics that uses symbols and letters to represent numbers and quantities in formulas and equations.', 'Khan Academy', 0.85, 'verified', 0.9),
('academic_paper', 'Machine Learning Fundamentals', 'Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed.', 'Johnson et al.', 0.95, 'verified', 0.98)
ON CONFLICT DO NOTHING;

-- Insert sample knowledge base entries
INSERT INTO educational_knowledge_base (title, content, source, reliability, topics, subject, type, educational_value, verification_status) VALUES
('What is an Algorithm?', 'An algorithm is a step-by-step procedure for solving a problem or accomplishing a task.', 'Introduction to Computer Science', 0.9, ARRAY['algorithms', 'computer science'], 'Computer Science', 'concept', 0.9, 'verified'),
('Quadratic Formula Explained', 'The quadratic formula is used to solve quadratic equations of the form ax² + bx + c = 0.', 'Khan Academy - Algebra', 0.85, ARRAY['algebra', 'equations', 'mathematics'], 'Mathematics', 'procedure', 0.85, 'verified'),
('Types of Machine Learning', 'Machine learning algorithms can be categorized into supervised, unsupervised, and reinforcement learning.', 'Machine Learning Fundamentals', 0.95, ARRAY['machine learning', 'algorithms', 'artificial intelligence'], 'Computer Science', 'concept', 0.95, 'verified')
ON CONFLICT DO NOTHING;

-- Update the educational_knowledge_base entries to reference sources
UPDATE educational_knowledge_base SET source_id = (
    SELECT id FROM educational_sources WHERE title = 'Introduction to Computer Science'
) WHERE content = 'An algorithm is a step-by-step procedure for solving a problem or accomplishing a task.';

UPDATE educational_knowledge_base SET source_id = (
    SELECT id FROM educational_sources WHERE title = 'Khan Academy - Algebra'
) WHERE content = 'The quadratic formula is used to solve quadratic equations of the form ax² + bx + c = 0.';

UPDATE educational_knowledge_base SET source_id = (
    SELECT id FROM educational_sources WHERE title = 'Machine Learning Fundamentals'
) WHERE content = 'Machine learning algorithms can be categorized into supervised, unsupervised, and reinforcement learning.';

-- Create some fact relationships
INSERT INTO fact_relationships (fact_id, related_fact_id, relationship_type, relationship_strength, explanation)
SELECT 
    k1.id,
    k2.id,
    'supports',
    0.8,
    'Both concepts relate to computational problem-solving'
FROM educational_knowledge_base k1, educational_knowledge_base k2
WHERE k1.content = 'An algorithm is a step-by-step procedure for solving a problem or accomplishing a task.'
  AND k2.content = 'Machine learning algorithms can be categorized into supervised, unsupervised, and reinforcement learning.'
ON CONFLICT DO NOTHING;

COMMIT;
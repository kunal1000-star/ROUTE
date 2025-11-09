-- Quick Fix: Add Missing Title Column
-- ===================================
-- This script adds the missing 'title' column to the existing educational_knowledge_base table
-- Run this first if the main schema didn't apply properly

-- Add the missing title column to the existing table
ALTER TABLE educational_knowledge_base 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Create index for the title column for search performance
CREATE INDEX IF NOT EXISTS idx_educational_knowledge_base_title 
ON educational_knowledge_base USING GIN(to_tsvector('english', title));

-- Update existing records to have meaningful titles (based on content)
UPDATE educational_knowledge_base 
SET title = CASE 
    WHEN content LIKE '%algorithm%' THEN 'Algorithm Explanation'
    WHEN content LIKE '%quadratic%' THEN 'Quadratic Formula Guide'
    WHEN content LIKE '%machine learning%' THEN 'Machine Learning Overview'
    WHEN content LIKE '%equation%' THEN 'Mathematical Equation'
    WHEN content LIKE '%formula%' THEN 'Mathematical Formula'
    WHEN content LIKE '%learning%' THEN 'Learning Concept'
    WHEN content LIKE '%computer%' THEN 'Computer Science Topic'
    WHEN content LIKE '%math%' THEN 'Mathematics Topic'
    ELSE 'Educational Content'
END
WHERE title IS NULL OR title = '';

-- Verify the column was added
SELECT 'Title column added successfully' as status, 
       COUNT(*) as total_records,
       COUNT(CASE WHEN title IS NOT NULL AND title != '' THEN 1 END) as records_with_titles
FROM educational_knowledge_base;
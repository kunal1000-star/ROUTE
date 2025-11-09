# IMMEDIATE FIX: Title Column Error
# ===================================
# Quick solution for: "column educational_knowledge_base.title does not exist"

## Problem
The `title` column is missing from the `educational_knowledge_base` table, causing knowledge base search to fail.

## IMMEDIATE SOLUTION (Choose One):

### Option 1: Quick Column Addition (RECOMMENDED)
Run this in your Supabase SQL Editor first:

```sql
-- Add the missing title column
ALTER TABLE educational_knowledge_base 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Create search index
CREATE INDEX IF NOT EXISTS idx_educational_knowledge_base_title 
ON educational_knowledge_base USING GIN(to_tsvector('english', title));

-- Update existing records with meaningful titles
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
```

### Option 2: Full Schema Application
Apply the complete database schema:

```sql
-- Copy and paste the entire contents of database-schema-fix-complete.sql
-- This includes the title column in the table definition
```

## After Running the Fix:
1. **Test immediately**: Try the study buddy chat
2. **Clear cache**: Refresh your browser/Supabase connection
3. **Verify**: Check that knowledge base search works

## Why This Happens:
- The table was created without the `title` column
- The application code expects the `title` column for search
- Need to add the column or apply the updated schema

## Expected Result:
✅ Knowledge base search will work without errors
✅ Study buddy chat will function properly
✅ No more "title column does not exist" errors

## If Still Not Working:
1. Check that the column was added: `SELECT column_name FROM information_schema.columns WHERE table_name = 'educational_knowledge_base';`
2. Clear browser cache
3. Restart the development server
4. Check Supabase dashboard for table structure
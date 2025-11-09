# Study Buddy Database Error Fix Guide

## Issues Fixed

1. **Missing Table Error**: `Could not find the table 'public.educational_knowledge_base' in the schema cache`
2. **UUID Format Error**: `invalid input syntax for type uuid: "conv-1762693472371-sgc51je54"`
3. **SQL Syntax Error**: `column "updated_at" specified more than once` (duplicate column in table definition)
4. **Missing Title Column Error**: `column educational_knowledge_base.title does not exist`

## URGENT: If You're Getting "Title Column Does Not Exist" Error

### IMMEDIATE FIX (Run This First):
1. Go to your Supabase Dashboard → SQL Editor
2. Copy and paste this command:

```sql
ALTER TABLE educational_knowledge_base
ADD COLUMN IF NOT EXISTS title TEXT;
```

3. Run the command
4. Test your study buddy system immediately

## Complete Solution Files

1. **`database-schema-fix-complete.sql`** - Complete database schema with all required tables
2. **`add-title-column.sql`** - Quick fix for missing title column
3. **`verify-database-fixes.js`** - Verification script to test the fixes
4. **`IMMEDIATE_TITLE_COLUMN_FIX.md`** - Emergency fix guide
5. **Updated `src/hooks/use-study-buddy.ts`** - Fixed UUID generation

## How to Apply the Complete Fixes

### Step 1: Quick Title Column Fix (If Needed)
If you're getting the title column error, run this first:

```sql
ALTER TABLE educational_knowledge_base
ADD COLUMN IF NOT EXISTS title TEXT;
```

### Step 2: Apply Full Database Schema
Execute the complete SQL file in your Supabase dashboard:

```sql
-- Copy and paste the contents of database-schema-fix-complete.sql
-- Run it in the SQL Editor of your Supabase project
```

Or use the Supabase CLI:
```bash
supabase db reset
# Then run the migration file
```

### Step 3: Deploy the Code Changes
The UUID generation fix is already applied to `src/hooks/use-study-buddy.ts`

### Step 4: Verify the Fixes
Run the verification script:

```bash
node verify-database-fixes.js
```

Make sure you have the following environment variables set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## What the Fix Does

### Database Schema
- Creates `educational_knowledge_base` table with proper structure
- Creates `educational_sources` table for source management
- Creates `conversation_memory` table with UUID support
- Adds indexes for performance
- Implements Row Level Security (RLS) policies
- Adds sample educational content

### UUID Fix
- Generates proper UUID v4 format instead of custom string format
- Ensures compatibility with PostgreSQL UUID type
- Maintains backward compatibility with existing conversation IDs

## Expected Results

After applying these fixes:
1. ✅ Knowledge base search will work without table errors
2. ✅ Memory storage will work without UUID format errors
3. ✅ Study buddy chat will function properly
4. ✅ All database operations will use proper UUID formats

## Troubleshooting

If you still encounter issues:

1. **Check environment variables**: Ensure Supabase URLs and keys are correct
2. **Verify table creation**: Check Supabase dashboard for created tables
3. **Check RLS policies**: Ensure authenticated users can access tables
4. **Review logs**: Check browser console and Supabase logs for specific errors

## Next Steps

1. Test the study buddy functionality
2. Monitor for any remaining errors
3. Consider adding more educational content to the knowledge base
4. Optimize database queries as needed
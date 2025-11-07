#!/bin/bash

# Duplicate Files Cleanup Script
# This script removes duplicate files that are causing conflicts

echo "Starting duplicate file cleanup..."

# Create backup directory for safety
mkdir -p /tmp/cleanup-backup

echo "Backing up duplicates before removal..."

# Backup migration duplicates
if [ -f "/workspaces/ProjectFinal/migration-2025-11-04-ai-suggestions.sql" ]; then
    cp "/workspaces/ProjectFinal/migration-2025-11-04-ai-suggestions.sql" "/tmp/cleanup-backup/" 2>/dev/null || true
fi

if [ -f "/workspaces/ProjectFinal/migration-2025-11-04-analytics.sql" ]; then
    cp "/workspaces/ProjectFinal/migration-2025-11-04-analytics.sql" "/tmp/cleanup-backup/" 2>/dev/null || true
fi

if [ [ -f "/workspaces/ProjectFinal/migration-2025-11-04-file-analyses.sql" ]; then
    cp "/workspaces/ProjectFinal/migration-2025-11-04-file-analyses.sql" "/tmp/cleanup-backup/" 2>/dev/null || true
fi

if [ -f "/workspaces/ProjectFinal/migration-2025-11-05-fix-chat-rls.sql" ]; then
    cp "/workspaces/ProjectFinal/migration-2025-11-05-fix-chat-rls.sql" "/tmp/cleanup-backup/" 2>/dev/null || true
fi

echo "Removing duplicate migration files (keeping fixed-migration-*.sql versions)..."

# Remove root-level migration-2025 duplicates
rm -f /workspaces/ProjectFinal/migration-2025-11-04-ai-suggestions.sql 2>/dev/null || true
rm -f /workspaces/ProjectFinal/migration-2025-11-04-analytics.sql 2>/dev/null || true  
rm -f /workspaces/ProjectFinal/migration-2025-11-04-file-analyses.sql 2>/dev/null || true
rm -f /workspaces/ProjectFinal/migration-2025-11-05-fix-chat-rls.sql 2>/dev/null || true

# Remove migration-2025 directory (backup first)
if [ -d "/workspaces/ProjectFinal/migration-2025" ]; then
    cp -r /workspaces/ProjectFinal/migration-2025 /tmp/cleanup-backup/ 2>/dev/null || true
    rm -rf /workspaces/ProjectFinal/migration-2025 2>/dev/null || true
fi

echo "Removing duplicate test scripts..."

# Remove duplicate test files
rm -f /workspaces/ProjectFinal/test-ambiguous-column-fix.sql 2>/dev/null || true

echo "Removing duplicate AI system documentation (keeping latest versions)..."

# Keep only the most recent AI system documentation
KEEP_AI_FILES=("AI_SYSTEM_REPAIR_PROGRESS.md" "JSON_PARSE_ERROR_FINAL_COMPLETION_REPORT.md" "AI_FEATURES_FINAL_COMPLETION_STATUS.md")

for file in "${KEEP_AI_FILES[@]}"; do
    if [ -f "/workspaces/ProjectFinal/$file" ]; then
        echo "Keeping: $file"
    fi
done

# Remove older AI system documentation files
rm -f /workspaces/ProjectFinal/AI_CHAT_SERVICE_REPAIR_PLAN.md 2>/dev/null || true
rm -f /workspaces/ProjectFinal/AI_CHAT_SERVICE_REPAIR_STATUS.md 2>/dev/null || true
rm -f /workspaces/ProjectFinal/AI_SYSTEM_DEEP_ANALYSIS_REPAIR_PLAN.md 2>/dev/null || true
rm -f /workspaces/ProjectFinal/AI_SYSTEM_FIX_COMPLETE.md 2>/dev/null || true
rm -f /workspaces/ProjectFinal/AI_SYSTEM_REPAIR_COMPLETE.md 2>/dev/null || true

rm -f /workspaces/ProjectFinal/COMPREHENSIVE_JSON_PARSE_ERROR_ANALYSIS.md 2>/dev/null || true
rm -f /workspaces/ProjectFinal/JSON_PARSE_ERROR_COMPREHENSIVE_FIX.md 2>/dev/null || true
rm -f /workspaces/ProjectFinal/JSON_PARSE_ERROR_COMPREHENSIVE_FIX_EXECUTION.md 2>/dev/null || true

rm -f /workspaces/ProjectFinal/AI_FEATURES_COMPLETE_IMPLEMENTATION_EXECUTION_PLAN.md 2>/dev/null || true
rm -f /workspaces/ProjectFinal/AI_FEATURES_COMPLETE_IMPLEMENTATION_PLAN.md 2>/dev/null || true
rm -f /workspaces/ProjectFinal/AI_FEATURES_COMPLETION_PLAN.md 2>/dev/null || true

echo "Removing duplicate implementation plans..."

# Keep only current implementation plan
rm -f /workspaces/ProjectFinal/PHASE_9_ENHANCEMENT_2B_COMPLETED.md 2>/dev/null || true
rm -f /workspaces/ProjectFinal/PHASE_9_ENHANCEMENT_2D_COMPLETED.md 2>/dev/null || true
rm -f /workspaces/ProjectFinal/PHASE_9_ENHANCEMENT_3_COMPLETED.md 2>/dev/null || true
rm -f /workspaces/ProjectFinal/PHASE_9_ENHANCEMENT_4_COMPLETED.md 2>/dev/null || true
rm -f /workspaces/ProjectFinal/PHASE_9_CRITICAL_FIX_COMPLETE 2>/dev/null || true
rm -f /workspaces/ProjectFinal/PHASE_6_TESTING_VALIDATION_COMPLETE.md 2>/dev/null || true

rm -f /workspaces/ProjectFinal/AI_FEATURES_IMPLEMENTATION_PLAN.md 2>/dev/null || true
rm -f /workspaces/ProjectFinal/AI_FEATURES_MODIFIED_IMPLEMENTATION_PLAN.md 2>/dev/null || true

echo "Removing redundant debug scripts..."

# Keep only essential debug files
rm -f /workspaces/ProjectFinal/debug-chat-service-initialization.js 2>/dev/null || true
rm -f /workspaces/ProjectFinal/debug-report-ambiguous-column-fix.md 2>/dev/null || true
rm -f /workspaces/ProjectFinal/debug-todo.md 2>/dev/null || true

echo "Cleanup completed!"
echo "Duplicate files removed. The following files should remain:"
echo "Migration files: fixed-migration-*.sql (5 files)"
echo "Test files: test-standalone.js, test-admin-panel.js, test-api-keys.js"
echo "Debug files: debug-database-permissions.js"
echo "AI Documentation: AI_SYSTEM_REPAIR_PROGRESS.md, JSON_PARSE_ERROR_FINAL_COMPLETION_REPORT.md, AI_FEATURES_FINAL_COMPLETION_STATUS.md"
echo ""
echo "Backup of removed files available in: /tmp/cleanup-backup/"

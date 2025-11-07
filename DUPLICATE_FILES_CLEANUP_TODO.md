# Duplicate Files Cleanup - Task List

## Overview
Remove duplicate files that are causing errors and conflicts in the project.

## Task List

### Phase 1: High-Priority Cleanup (Immediate Impact)
- [x] **Migration Files**: Target `migration-2025/` directory and root-level migration-2025 files
- [x] **Test Scripts**: Remove `test-json-parse-fix.js` and `test-json-parsing-fix.js` duplicates ✅
- [ ] AI system documentation (keep latest versions only)  
- [ ] Remove duplicate implementation plans

### Phase 2: Systematic Cleanup (Medium Priority)
- [ ] Archive old implementation plans to `docs/archive/`
- [ ] Consolidate debug scripts (keep primary diagnostic tools)
- [ ] Remove redundant configuration files
- [ ] Clean up temporary backup files

### Phase 3: Final Optimization (Low Priority)  
- [ ] Organize remaining files with proper directory structure
- [ ] Update documentation references for consistency
- [ ] Create cleanup summary documentation
- [ ] Verify no critical files were accidentally removed

## Progress Update (Phase 1)
- ✅ **Test Script Duplicates**: Successfully identified and removed `test-json-parse-fix.js` (already removed)
- 🔄 **Migration File Duplicates**: Working on removing root-level `migration-2025-*.sql` files
- ❌ **Migration Directory**: `migration-2025/` directory needs removal
- ❌ **AI Documentation**: Multiple versions of same reports need consolidation
- ❌ **Implementation Plans**: Conflicting phase documentation needs cleanup

## Current Duplicate Categories Identified

### Migration Files (Most Critical)
- **KEEP**: `fixed-migration-*.sql` (5 files) - these are the correct versions
- **REMOVE**: Root-level `migration-2025-*.sql` (5 files) - duplicates
- **REMOVE**: `migration-2025/` directory (5 files) - outdated copies

### AI System Documentation  
- `AI_SYSTEM_REPAIR_*.md` (5 files) - keep only `AI_SYSTEM_REPAIR_PROGRESS.md`
- `JSON_PARSE_ERROR_*.md` (4 files) - keep only `JSON_PARSE_ERROR_FINAL_COMPLETION_REPORT.md`
- `AI_FEATURES_COMPLETION_*.md` (3 files) - keep only `AI_FEATURES_FINAL_COMPLETION_STATUS.md`

### Test/Debug Scripts
- `test-*.js` (8+ files) - keep: `test-standalone.js`, `test-admin-panel.js`, `test-api-keys.js`
- `debug-*.js` (3 files) - keep: `debug-database-permissions.js`

### Implementation Plans
- `PHASE_9_*.md` (4 files) - keep only `PHASE_9_REMAINING_TODO.md`
- `IMPLEMENTATION_PLAN_*.md` (3 files) - keep only `AI_FEATURES_MODIFIED_IMPLEMENTATION_PLAN.md`

## Expected Outcomes
- Eliminated file conflicts causing build/compilation errors
- Clearer project structure for development
- Reduced import resolution conflicts
- Cleaner git history and version control

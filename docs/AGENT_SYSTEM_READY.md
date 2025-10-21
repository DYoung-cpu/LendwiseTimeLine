# Vision-Guided Agent System - Ready for Testing

**Date:** 2025-10-05
**Status:** ✅ Implementation Complete

---

## What Was Implemented

### 1. **CSS Injection System (No More Cache Issues)**
- Changes applied via `page.addStyleTag()` in Playwright
- Instant application without file writes
- Test first, write to files only after verification passes

### 2. **Automatic Visual Verification**
- Before/after screenshot capture
- Pixel-perfect baseline comparison
- Layout shift detection
- Automatic correction calculation

### 3. **Auto-Correction Loop (Max 3 Attempts)**
```
User Request → CSS Injection Test → Screenshot Analysis
                    ↓ FAIL
              Calculate Correction → Apply Fix → Re-test
                    ↓ FAIL (attempt 2)
              Calculate Correction → Apply Fix → Re-test
                    ↓ FAIL (attempt 3)
              Calculate Correction → Apply Fix → Re-test
                    ↓ FAIL (3 attempts exhausted)
              Escalate to User with All Screenshots
                    ↓ PASS (any attempt)
              Write to CSS Files → Update Memory → Done ✅
```

### 4. **Baseline Screenshot System**
- User provides ground truth: `test-results/baselines/filter-correct.png`
- All changes automatically compared to baseline
- Pixel-perfect visual regression testing

---

## Files Updated

✅ `.claude/agents/playwright-audit.md`
- Added CSS injection template
- Added before/after screenshot workflow
- Added automatic correction calculation
- Removed user approval requirement

✅ `.claude/agents/orchestrator.md`
- Added auto-correction loop (max 3 attempts)
- Added CSS injection workflow
- Added baseline screenshot system
- Only escalates to user after 3 failed attempts

✅ `.claude/project-memory.md`
- Documented vision-guided verification protocol
- Added baseline screenshot instructions
- Added auto-correction workflow documentation

✅ Created `test-results/baselines/` directory

---

## How to Use (First Time)

### Step 1: Provide Baseline Screenshot (One-Time Setup)

1. Navigate to `http://localhost:3005/timeline-dev.html`
2. Take a screenshot when filter button is in CORRECT visual state
3. Save as: `/mnt/c/Users/dyoun/Active Projects/LendWiseLanding/test-results/baselines/filter-correct.png`
4. All future changes will be compared to this baseline

### Step 2: Request a Change

Example: "Fix filter button alignment with SVG gradient"

### Step 3: Watch Automatic Workflow

1. Orchestrator reads project-memory.md
2. Identifies CSS change needed (e.g., `.new-filter-container { top: 12px }`)
3. Creates Playwright test with CSS injection
4. Playwright-audit runs test:
   - Captures BEFORE screenshot
   - Injects CSS change
   - Captures AFTER screenshot
   - Measures alignment
   - Compares to baseline (if exists)
5. If misaligned:
   - Calculates correction needed (e.g., "+5px")
   - Returns correction data to orchestrator
6. Orchestrator applies correction and re-runs (up to 3 times)
7. Once PASSED:
   - Writes CSS to actual files
   - Updates cache-busting version
   - Updates project-memory.md
8. If 3 attempts fail:
   - Shows you all screenshots
   - Asks for guidance

---

## Key Benefits

✅ **No browser cache issues** - CSS injected directly via Playwright
✅ **Automatic iteration** - Up to 3 correction attempts
✅ **Visual ground truth** - Baseline comparison
✅ **Layout shift detection** - Catches unintended element movement
✅ **Structured corrections** - JSON data with exact adjustments needed
✅ **User only involved if needed** - Auto-fix handles most cases

---

## Example: Filter Button Alignment Fix

**Current Issue:** Filter button HTML at `top: 7px`, SVG gradient at `top: 12px` (5px gap)

**How New System Will Handle It:**

1. **Attempt 1:**
   - Test injects: `.new-filter-container { top: 10px !important; }`
   - Result: Gap = 2px
   - Status: FAIL (gap should be < 2px)
   - Correction: `{ adjustment: '+2px', reason: 'Still 2px off' }`

2. **Attempt 2:**
   - Test injects: `.new-filter-container { top: 12px !important; }`
   - Result: Gap = 0px, Timeline shift = 0px
   - Status: PASS ✅
   - Orchestrator writes `top: 12px` to timeline-clean-test.css
   - Updates cache to v=20251005260000
   - Updates project-memory.md with success

**Total time:** ~10 seconds
**User involvement:** None (unless 3 attempts fail)
**Screenshots saved:**
- `test-results/before-[timestamp].png`
- `test-results/after-[timestamp].png`

---

## Testing Checklist

Before using in production:

- [ ] User provides baseline screenshot: `test-results/baselines/filter-correct.png`
- [ ] Test with simple CSS change (e.g., filter button top position)
- [ ] Verify screenshots are generated in test-results/
- [ ] Verify auto-correction loop triggers on misalignment
- [ ] Verify CSS only written to files after PASS
- [ ] Verify project-memory.md updated after success

---

## Agent Files Summary

| Agent | Purpose | Auto-Invoked By |
|-------|---------|-----------------|
| **orchestrator** | Coordinates workflow, runs auto-correction loop | User requests changes to timeline-dev |
| **playwright-audit** | Runs visual tests with CSS injection | Orchestrator (Step 4) |
| **css-cleanup** | Scans for CSS conflicts | Orchestrator (Step 3) |
| **project-state** | Updates project-memory.md | Orchestrator (Step 5) |

---

## Ready to Test

The system is ready. Next time you request a visual change to timeline-dev.html, the orchestrator will automatically:
1. Use CSS injection for testing
2. Capture before/after screenshots
3. Auto-correct up to 3 times
4. Only write to files after verification passes
5. Only ask you if auto-fix fails

**No more "I made the change but you don't see it because of cache"**
**No more "agents claiming success without actual verification"**
**No more manual approval for every single change**

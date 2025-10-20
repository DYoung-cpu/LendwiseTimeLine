# LendWise Landing Page - Project Context

## Current Status
- **Date**: October 5, 2025
- **Working Version**: `timeline-clean-test.*` (DO NOT MODIFY DIRECTLY)
- **Development Version**: `timeline-dev.*` (USE FOR ALL CHANGES)
- **Last Known Good Commit**: `WORKS-2025-10-02-before-changes`
- **Latest Update**: Border alignment to timeline fixed (Oct 5, 2025)

## Server Configuration
- **Port 8000**: Python server - Stable working version
- **Port 3005**: Node server - For testing changes
- **View Dev Version**: http://localhost:8000/timeline-dev.html

## File Structure
```
timeline-clean-test.*    ← Golden copy (never touch)
timeline-dev.*          ← Active development
timeline-backup-[date].* ← Daily backups
timeline-aider-practice.* ← Aider experiments
```

## Current Design Decisions

### Timeline Border Container
- **Padding**: 1px 100px (minimal height achieved)
- **Style**: Glass morphism with rgba(255, 255, 255, 0.15)
- **Glow**: Subtle outer glow (0 0 20px)
- **Extends**: -80px margins to encompass navigation arrows
- **Border Alignment (Oct 5, 2025)**: Fixed `.border-svg` to align with timeline
  - Changed `top: -35px` → `top: 0`
  - Changed `height: calc(100% + 35px)` → `height: 100%`
  - Border now perfectly aligns with timeline line (no gap above)

### Filter Design (Oct 5, 2025 - FIXED)
- **Architecture**: Two-layer system
  - **SVG Layer**: Provides ALL visual gradients (matching timeline milestones)
  - **HTML Layer**: Transparent buttons for click handling
- **Categories**: Completed, Tech, Operations, In Progress, Future
- **Key Change**: HTML buttons now use `background: transparent` - NO duplicate gradients
- **Style**: SVG sections create the beautiful radial gradients
- **Behavior**: Fixed to timeline, scrolls with page

### Navigation Arrows
- **Position**: Aligned with main timeline
- **Desktop**: top: 240px
- **Mobile**: top: 190px

## What NOT to Change
- ❌ Don't modify timeline event positioning system
- ❌ Don't change the base timeline structure
- ❌ Don't alter the connector lines logic
- ❌ Don't modify timeline-clean-test files directly

## Recovery Commands
```bash
# If something breaks, instant recovery:
git checkout WORKS-2025-10-02-before-changes -- timeline-dev.css
git checkout WORKS-2025-10-02-before-changes -- timeline-dev.html

# Or full reset:
git reset --hard WORKS-2025-10-02-before-changes
```

## Next Tasks
- [ ] Integrate filter button into border container
- [ ] Connect filter to timeline events
- [ ] Add dropdown functionality
- [ ] Test on all screen sizes

## Testing Protocol
1. Make change in timeline-dev files
2. View at http://localhost:8000/timeline-dev.html
3. Test in browser DevTools first
4. If works → commit with descriptive message
5. If breaks → use recovery commands above

## Important Notes
- Always work in `timeline-dev.*` files
- Test EVERY change before making another
- Commit working changes immediately
- Update this file with major decisions

## CRITICAL: Existing Components (DO NOT RECREATE)
- **Filter System**: Already exists at line 1667 in HTML
  - Container: `.new-filter-container`
  - Button: `.new-filter-btn` (transparent, no background gradients)
  - Categories: `.filter-option-btn` (transparent, subtle overlay)
  - SVG Sections: `.filter-visual-section` (provides all visual design)
  - Fully styled and animated
  - DO NOT create duplicate filters

### Filter Button Implementation (Oct 5, 2025)
- **Root Cause of Duplication**: Two visual layers were both rendering gradients
- **Solution**: Made HTML buttons transparent
  - `.new-filter-btn`: `background: transparent`
  - `.filter-option-btn`: `background: rgba(0, 0, 0, 0.1)` (subtle text legibility)
  - Hover states simplified to opacity/brightness only
- **Old CSS Removed**: Deleted deprecated .filter-btn system (290 lines)
- **CSS Version**: Updated to v=20251005234000

## Lessons Learned (Oct 2, 2025)
- **ALWAYS** search for existing code before implementing
- **NEVER** recreate components that already exist
- **PRESERVE** existing styling unless explicitly asked to change
- Check LESSONS_LEARNED.md for detailed analysis

## Pre-Implementation Checklist:
- [ ] Searched for existing code: `grep -n "feature" *.html *.css`
- [ ] Documented current state
- [ ] Confirmed specific requirements
- [ ] Identified what to modify (not recreate)
- [ ] Preserved all working code
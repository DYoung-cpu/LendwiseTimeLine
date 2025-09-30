# LendWise Timeline Assets

Interactive timeline visualization for LendWise Mortgage with animated milestones and filtering capabilities.

## Live Demo
Open `timeline-clean-test.html` in a web browser to view the timeline.

## Features
- **Animated Timeline**: Horizontal scrolling timeline with milestone markers
- **Visual Hierarchy**: Three-tier importance system (High: 67px, Medium: 34px, Low: 17px branches)
- **Filter System**: Rectangular filter buttons that expand horizontally to show category filters
- **Smooth Scrolling**: Edge fading for seamless content transitions
- **Gradient Animations**: Dynamic gradient effects on hover matching React component styling
- **Progress Indicators**: Orange pulse glow for in-progress milestones
- **Draggable Filter**: Filter button can be repositioned on screen
- **Categories**: Technology (Blue), Operations (Purple), Future (Gold), Completed (Green)

## Quick Start

### Option 1: Python Server (Recommended)
```bash
# Navigate to the timeline-assets folder
cd timeline-assets

# Start Python HTTP server
python3 -m http.server 8000

# Open in browser
# Visit: http://localhost:8000/timeline-clean-test.html
```

### Option 2: Node.js Server
```bash
# If you have Node.js installed
npx http-server -p 8000

# Visit: http://localhost:8000/timeline-clean-test.html
```

### Option 3: Direct File Opening
Simply open `timeline-clean-test.html` directly in your browser (some features may be limited).

## File Structure
```
timeline-assets/
├── timeline-clean-test.html    # Main HTML file
├── timeline-clean-test.css     # Primary styles with milestone positioning
├── timeline-styles.css         # Additional timeline styles
├── intro-animation.js          # Intro animation with WISR owl
├── modern-timeline.js          # Timeline functionality and interactions
├── wisr-owl.mp4               # Video asset for intro animation
└── README.md                   # This file
```

## Timeline Milestones

### Completed
- **Inception** (Mar 2025) - High importance
- **Google Sponsorship** (Apr 2025) - Low importance
- **Headquarters** (Jun 2025) - High importance
- **The Team** (Jul 2025) - High importance
- **LOS** (Aug 2025) - Medium importance
- **Website** (Sep 2025) - Medium importance
- **Analytics** (Nov 2025) - Low importance

### Operations (Purple)
- **NMLS** (May 2025) - Low importance
- **CA DRE** (May 2025) - Low importance

### In Progress
- **Optimal Blue** (Oct 2025) - Medium importance

### Technology (Blue)
- **Integrations** (Sep 28 2025) - Low importance

### Future Projects (Gold)
- **WISR AI** (Dec 2025) - High importance

## Filter Controls
- Click the **Filter** button to expand filter options
- Filter categories slide out horizontally:
  - Left: All, Technology
  - Right: Operations, Complete, Active, Future
- Drag the filter button to reposition it on screen

## Customization

### Adjusting Milestone Positions
Edit the `style="left: X%;"` values in `timeline-clean-test.html`:
```html
<div class="timeline-milestone completed" style="left: 8%;">
```

### Changing Branch Heights
Modify the height values in `timeline-clean-test.css`:
```css
/* HIGH IMPORTANCE (67px) */
.timeline-milestone:nth-child(1) .milestone-connector {
    height: 67px !important;
}
```

### Adding New Milestones
1. Add HTML structure in `timeline-clean-test.html`
2. Apply appropriate class (completed, in-progress, future, technology, operations)
3. Set position and importance level in CSS

## Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile: Responsive with horizontal scroll

## Notes
- Timeline width is set to 2000px for proper spacing
- Horizontal scroll is hidden but functional
- Edge masks use CSS mask-image for smooth fading
- Filter buttons use same gradient animation system as timeline markers

## Support
For issues or questions about the timeline implementation, please refer to the inline comments in the source files or contact the development team.
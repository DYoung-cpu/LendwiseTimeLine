# CSS Element Map - Visual to Code Translation

## Visual Terms → CSS Properties

### "Make it thinner/thicker"
- Check: `padding`
- Check: `border-width`
- Check: `height`
- Check: `margin`

### "Move it down/up"
- Check: `top` (if positioned)
- Check: `margin-top`
- Check: `transform: translateY()`
- Check: `padding-top`

### "Make it wider/narrower"
- Check: `width`
- Check: `padding-left/right`
- Check: `margin-left/right`

### "Change the glow"
- Check: `box-shadow`
- Check: `filter: drop-shadow()`
- Check: `border` (with rgba)

## Element Control Map

### `.timeline-border-container`
**Controls**: The outer border frame around timeline
- `padding`: Controls internal spacing (makes border appear thicker/thinner)
- `margin`: Controls how far it extends beyond content
- `border`: The actual border line
- `box-shadow`: The glow effect

### `.timeline-viewport`
**Controls**: The content area inside the border
- `padding`: Space between border and timeline events
- `overflow`: Whether content scrolls
- `height`: Viewport height

### `.timeline-container`
**Controls**: The timeline grid itself
- `padding`: Space around all events
- `gap`: Space between events
- `grid-template`: Event layout

### `.nav-arrow-left, .nav-arrow-right`
**Controls**: Navigation arrows
- `top`: Vertical position
- `left/right`: Horizontal position
- `transform`: Fine positioning

### `.new-filter-btn`
**Controls**: Filter button
- `position`: How it's positioned (fixed/absolute)
- `top/right`: Location
- `background`: Button appearance

## Common Issues & Solutions

### "Border too thick"
- Usually: `.timeline-viewport` `padding` too large
- NOT: `.timeline-border-container` `border-width`

### "Arrows not aligned"
- Check: `.nav-arrow` `top` value
- May need: Different values for mobile/desktop

### "Filter button won't stay"
- Need: `position: absolute` relative to parent
- Parent needs: `position: relative`

### "Glow not showing"
- Check: `z-index` conflicts
- Check: Parent `overflow: hidden`
- Try: Larger blur radius in `box-shadow`
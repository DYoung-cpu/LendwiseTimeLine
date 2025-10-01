# LendWise Timeline - Our Journey to Excellence

An interactive timeline showcasing LendWise Mortgage Corporation's milestones, team, and technological innovations.

## Features

- **Interactive Timeline**: Navigate through LendWise's journey from inception to future goals
- **3D Gallery**: Explore company milestones with a rotating 3D card gallery
- **Team Showcase**: Meet the LendWise team with detailed profiles
- **Filtering System**: Filter timeline events by category (Operations, Tech, Completed, In Progress, Future)
- **Responsive Design**: Optimized for desktop and mobile viewing
- **Glassmorphic UI**: Modern glass-effect design with dynamic gradients

## Project Structure

```
├── index.html                 # Main HTML file
├── timeline-styles.css        # Base timeline styles
├── timeline-clean-test.css    # Enhanced styles and animations
├── intro-animation.js         # Intro animation and page initialization
├── modern-timeline.js         # Timeline functionality and interactions
├── wisr-owl.mp4              # WISR AI showcase video
├── RI-HQ_21800Oxnard.webp    # Headquarters image
├── licensing-map.png         # Licensed states map
└── [team member photos]      # Various team member headshots
```

## Getting Started

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd LendWise-Clean-Timeline
   ```

2. **Serve the files**
   - Use a local web server (required for video playback)
   - Python: `python -m http.server 8000`
   - Node.js: `npx http-server`
   - VS Code: Use Live Server extension

3. **Open in browser**
   Navigate to `http://localhost:8000`

## Key Components

### Timeline Navigation
- Click milestone buttons to view detailed information
- Use arrow buttons to navigate through timeline periods
- Filter by category using the filter dropdown

### 3D Gallery
- Automatically rotates to showcase different milestones
- Hover over cards for additional details
- Synchronized with timeline navigation

### Filter System
- **Operations**: Business operations and licensing
- **Tech**: Technology implementations and integrations
- **Completed**: Finished milestones
- **In Progress**: Current active projects (with orange glow effect)
- **Future**: Planned upcoming milestones

## Technical Details

- **CSS**: Modern glassmorphic design with backdrop filters
- **JavaScript**: Vanilla JS for all interactions
- **3D Effects**: CSS transforms for gallery rotation
- **Video**: HTML5 video with autoplay for WISR showcase
- **Responsive**: Mobile-first design approach

## Browser Compatibility

- Chrome 88+ (recommended)
- Firefox 84+
- Safari 14+
- Edge 88+

*Note: Backdrop filter support required for optimal visual experience*

## Development

This project was developed as a comprehensive company timeline and showcase. The filter button positioning is locked and the interface is optimized for presentation and sharing.

## License

© 2024 LendWise Mortgage Corporation. All rights reserved.
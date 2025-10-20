// Fix Timeline Spacing with Pixel Values Instead of Percentages
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'timeline-dev.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Configuration
const containerWidth = 2000;  // .timeline-milestones width
const padding = 100;          // padding on timeline-line-container
const usableWidth = containerWidth - (padding * 2);  // 1800px
const totalMilestones = 15;
const gaps = totalMilestones - 1;  // 14 gaps
const spacingPx = usableWidth / gaps;  // 128.57px per gap
const startPx = padding;  // Start at 100px (after padding)

console.log('=== PIXEL-BASED SPACING FIX ===');
console.log(`Container width: ${containerWidth}px`);
console.log(`Padding: ${padding}px each side`);
console.log(`Usable width: ${usableWidth}px`);
console.log(`Spacing: ${spacingPx.toFixed(2)}px per gap`);
console.log(`Start position: ${startPx}px\n`);

// Milestone mapping (index to sequence position)
const milestones = [
    { index: 0, label: 'INCEPTION' },
    { index: 1, label: 'GOOGLE' },
    { index: 3, label: 'NMLS' },
    { index: 4, label: 'CA DRE' },
    { index: 5, label: 'HEADQUARTERS' },
    { index: 6, label: 'THE TEAM' },
    { index: 7, label: 'WEBSITE' },
    { index: 8, label: 'INTEGRATIONS' },
    { index: 9, label: 'DFPI AI' },
    { index: 10, label: 'LOS' },
    { index: 11, label: 'POS' },
    { index: 12, label: 'OPTIMAL BLUE' },
    { index: 13, label: 'MISSION CRM' },
    { index: 14, label: 'ANALYTICS' },
    { index: 15, label: 'WISR AI' }
];

// Calculate pixel positions
const updates = milestones.map((item, sequenceIndex) => {
    const oldPercent = parseFloat((5 + sequenceIndex * 6.43).toFixed(2));
    const newPx = startPx + (sequenceIndex * spacingPx);
    return {
        ...item,
        oldPercent,
        newPx: Math.round(newPx)
    };
});

console.log('=== POSITION CHANGES (% → px) ===');
updates.forEach(item => {
    console.log(`${item.label.padEnd(20)} data-index="${item.index}": ${item.oldPercent}% → ${item.newPx}px`);
});

// Apply replacements
updates.forEach(item => {
    // Match: data-index="X" ... style="left: Y%;"
    // Replace with: data-index="X" ... style="left: Zpx;"
    const regex = new RegExp(
        `(data-index="${item.index}"[^>]*style="left: )[\\d.]+%(;")`,
        'g'
    );
    html = html.replace(regex, `$1${item.newPx}px$2`);
});

// Write the updated HTML
fs.writeFileSync(htmlPath, html, 'utf8');

console.log(`\n✅ Timeline spacing fixed with pixel values!`);
console.log(`All milestones now have ${spacingPx.toFixed(2)}px spacing`);
console.log(`Updated ${htmlPath}`);

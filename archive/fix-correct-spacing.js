// Fix Timeline Milestone Spacing - Correct for 2000px container
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'timeline-dev.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Configuration
const containerWidth = 2000;  // .timeline-line-container width
const padding = 100;          // padding on each side
const usableWidth = containerWidth - (padding * 2);  // 1800px
const totalMilestones = 15;
const gaps = totalMilestones - 1;  // 14 gaps
const spacingPx = usableWidth / gaps;  // 128.57px
const spacingPercent = (spacingPx / containerWidth * 100).toFixed(2);  // 6.43%

const startPercent = (padding / containerWidth * 100).toFixed(0);  // 5%

console.log('=== CORRECT TIMELINE SPACING FIX ===');
console.log(`Container width: ${containerWidth}px`);
console.log(`Usable width: ${usableWidth}px`);
console.log(`Start position: ${startPercent}%`);
console.log(`Spacing: ${spacingPercent}% (${spacingPx}px per gap)\n`);

// Current HTML positions (from previous incorrect fix)
const currentPositions = [
    { index: 0, old: 8, label: 'INCEPTION' },
    { index: 1, old: 12.53, label: 'GOOGLE' },
    { index: 3, old: 17.07, label: 'NMLS' },
    { index: 4, old: 21.6, label: 'CA DRE' },
    { index: 5, old: 26.13, label: 'HEADQUARTERS' },
    { index: 6, old: 30.67, label: 'THE TEAM' },
    { index: 7, old: 35.2, label: 'WEBSITE' },
    { index: 8, old: 39.73, label: 'INTEGRATIONS' },
    { index: 9, old: 44.27, label: 'DFPI AI' },
    { index: 10, old: 48.8, label: 'LOS' },
    { index: 11, old: 53.33, label: 'POS' },
    { index: 12, old: 57.87, label: 'OPTIMAL BLUE' },
    { index: 13, old: 62.4, label: 'MISSION CRM' },
    { index: 14, old: 66.93, label: 'ANALYTICS' },
    { index: 15, old: 71.47, label: 'WISR AI' }
];

// Calculate NEW correct positions
const newPositions = currentPositions.map((item, sequenceIndex) => {
    const newPercent = parseFloat(startPercent) + (sequenceIndex * parseFloat(spacingPercent));
    return {
        ...item,
        new: Number(newPercent.toFixed(2))
    };
});

console.log('=== POSITION CHANGES ===');
newPositions.forEach(item => {
    console.log(`${item.label.padEnd(20)} data-index="${item.index}": ${item.old}% → ${item.new}%`);
});

// Apply replacements
newPositions.forEach(item => {
    // Match pattern: data-index="X" ... style="left: Y%;"
    // Need to handle decimal values in old positions
    const regex = new RegExp(
        `(data-index="${item.index}"[^>]*style="left: )${item.old}(%;")`
    );
    html = html.replace(regex, `$1${item.new}$2`);
});

// Write the updated HTML
fs.writeFileSync(htmlPath, html, 'utf8');

console.log('\n✅ Timeline spacing fixed with correct values!');
console.log(`All milestones now have ${spacingPercent}% (${spacingPx.toFixed(2)}px) spacing`);
console.log(`Updated ${htmlPath}`);

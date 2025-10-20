// Fix Timeline Milestone Spacing
// This script calculates and applies even spacing to all timeline milestones

const fs = require('fs');
const path = require('path');

// Read the HTML file
const htmlPath = path.join(__dirname, 'timeline-dev.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Configuration
const startPercent = 8;
const endPercent = 76;
const totalMilestones = 16;
const spacing = (endPercent - startPercent) / (totalMilestones - 1);

console.log('=== TIMELINE SPACING FIX ===');
console.log(`Total milestones: ${totalMilestones}`);
console.log(`Start: ${startPercent}%`);
console.log(`End: ${endPercent}%`);
console.log(`Even spacing: ${spacing.toFixed(3)}%\n`);

// Current positions
const currentPositions = [
    { index: 0, old: 8 },
    { index: 1, old: 14 },
    { index: 3, old: 20 },
    { index: 4, old: 26 },
    { index: 5, old: 32 },
    { index: 6, old: 38 },
    { index: 7, old: 44 },
    { index: 8, old: 48 },
    { index: 9, old: 52 },
    { index: 10, old: 56 },
    { index: 11, old: 60 },
    { index: 12, old: 64 },
    { index: 13, old: 68 },
    { index: 14, old: 72 },
    { index: 15, old: 76 }
];

// Calculate new positions
const newPositions = currentPositions.map((item, sequenceIndex) => {
    const newPos = startPercent + (sequenceIndex * spacing);
    return {
        ...item,
        new: Number(newPos.toFixed(2))
    };
});

console.log('=== POSITION CHANGES ===');
newPositions.forEach(item => {
    console.log(`data-index="${item.index}": ${item.old}% → ${item.new}%`);
});

// Apply replacements
newPositions.forEach(item => {
    // Match pattern: data-index="X" ... style="left: Y%;"
    const regex = new RegExp(
        `(data-index="${item.index}"[^>]*style="left: )${item.old}(%;")`
    );
    html = html.replace(regex, `$1${item.new}$2`);
});

// Write the updated HTML
fs.writeFileSync(htmlPath, html, 'utf8');

console.log('\n✅ Timeline spacing fixed!');
console.log(`Updated ${htmlPath}`);

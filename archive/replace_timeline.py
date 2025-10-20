#!/usr/bin/env python3

# Read the original file
with open('timeline-test-dev.html', 'r') as f:
    lines = f.readlines()

# Find the start and end of timeline-milestones
start_line = None
end_line = None

for i, line in enumerate(lines):
    if '<div class="timeline-milestones">' in line and start_line is None:
        start_line = i
    if start_line is not None and '</div>' in line and 'timeline-milestones' not in line:
        # Check if this is the closing div for timeline-milestones
        # It should be around line 212
        if i >= 210 and i <= 215:
            end_line = i
            break

print(f"Found timeline section from line {start_line+1} to {end_line+1}")

# Read the new timeline content
with open('timeline-reorganized.html', 'r') as f:
    new_content = f.read()

# Remove the wrapping div tags from new content since they're already in place
new_content = new_content.replace('<!-- New organized timeline structure -->\n<div class="timeline-milestones">\n', '')
new_content = new_content.replace('\n</div>', '')

# Build the new file content
new_lines = (
    lines[:start_line+1] +  # Everything before and including the opening div
    [new_content + '\n'] +  # The new timeline content
    lines[end_line:]  # Everything from the closing div onward
)

# Write to a new file
with open('timeline-test-dev-new.html', 'w') as f:
    f.writelines(new_lines)

print("Created timeline-test-dev-new.html with reorganized timeline")
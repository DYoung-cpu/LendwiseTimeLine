#!/usr/bin/env python3
"""
Auto-Fix: Translates natural language to CSS changes
Usage: python3 auto-fix.py "make the border thinner"
"""

import json
import re
import sys
from pathlib import Path

class CSSAutoFixer:
    def __init__(self):
        self.css_file = "timeline-dev.css"
        self.mappings = {
            # Visual descriptions to CSS properties
            "thinner": ["padding", "border-width", "height"],
            "thicker": ["padding", "border-width", "height"],
            "wider": ["width", "padding-left", "padding-right"],
            "narrower": ["width", "padding-left", "padding-right"],
            "down": ["top", "margin-top", "transform"],
            "up": ["top", "margin-top", "transform"],
            "bigger": ["font-size", "width", "height", "scale"],
            "smaller": ["font-size", "width", "height", "scale"],
            "darker": ["opacity", "background-color", "filter"],
            "lighter": ["opacity", "background-color", "filter"],
            "glow": ["box-shadow", "filter", "text-shadow"],
        }

        self.element_map = {
            "border": ".timeline-border-container",
            "timeline": ".timeline-container",
            "filter": ".new-filter-btn",
            "arrow": ".nav-arrow",
            "event": ".timeline-event",
            "viewport": ".timeline-viewport"
        }

    def parse_request(self, request):
        """Parse natural language into CSS changes"""
        request = request.lower()

        # Find what element we're changing
        target_element = None
        for key, selector in self.element_map.items():
            if key in request:
                target_element = selector
                break

        if not target_element:
            return None, None, None

        # Find what change to make
        for action, properties in self.mappings.items():
            if action in request:
                return target_element, action, properties

        return target_element, None, None

    def get_current_value(self, selector, property_name):
        """Extract current CSS value from file"""
        with open(self.css_file, 'r') as f:
            content = f.read()

        # Find the selector block
        pattern = rf"{re.escape(selector)}\s*{{([^}}]*)}}"
        match = re.search(pattern, content, re.DOTALL)

        if match:
            block = match.group(1)
            # Find the specific property
            prop_pattern = rf"{property_name}\s*:\s*([^;]+)"
            prop_match = re.search(prop_pattern, block)
            if prop_match:
                return prop_match.group(1).strip()

        return None

    def calculate_new_value(self, current_value, action):
        """Calculate new value based on action"""
        if not current_value:
            return None

        # Handle multiple values (like padding: 1px 100px)
        values = current_value.split()
        new_values = []

        for val in values:
            # Extract numeric value
            numeric_match = re.search(r'(\d+(?:\.\d+)?)', val)
            if not numeric_match:
                new_values.append(val)
                continue

            value = float(numeric_match.group(1))
            unit = val.replace(numeric_match.group(1), '').strip()

            # Apply change based on action
            if action in ["thinner", "smaller", "narrower", "up"]:
                new_value = max(1, value * 0.5)  # Reduce by 50%, minimum 1
            elif action in ["thicker", "bigger", "wider", "down"]:
                new_value = value * 1.5  # Increase by 50%
            else:
                new_values.append(val)
                continue

            formatted = f"{new_value:.0f}{unit}" if new_value.is_integer() else f"{new_value}{unit}"
            new_values.append(formatted)

        return ' '.join(new_values)

    def apply_change(self, selector, property_name, new_value):
        """Apply the CSS change to the file"""
        with open(self.css_file, 'r') as f:
            content = f.read()

        # Find and replace the property
        pattern = rf"({re.escape(selector)}\s*{{[^}}]*{property_name}\s*:\s*)([^;]+)"
        replacement = rf"\g<1>{new_value}"

        new_content = re.sub(pattern, replacement, content)

        # Write back
        with open(self.css_file, 'w') as f:
            f.write(new_content)

        return True

    def process_request(self, request):
        """Main processing function"""
        print(f"🔍 Processing: {request}")

        selector, action, properties = self.parse_request(request)

        if not selector:
            print("❌ Could not identify element. Try: 'border', 'timeline', 'filter'")
            return False

        if not action:
            print("❌ Could not identify action. Try: 'thinner', 'wider', 'down'")
            return False

        print(f"📌 Target: {selector}")
        print(f"🎯 Action: {action}")
        print(f"🔧 Checking properties: {properties}")

        # Try each property until we find one that exists
        for prop in properties:
            current = self.get_current_value(selector, prop)
            if current:
                print(f"✅ Found {prop}: {current}")
                new_value = self.calculate_new_value(current, action)

                if new_value:
                    self.apply_change(selector, prop, new_value)
                    print(f"✨ Changed to: {new_value}")
                    print(f"🎉 Success! Check http://localhost:8000/timeline-dev.html")
                    return True

        print("❌ Could not find matching CSS property to change")
        return False

def main():
    if len(sys.argv) < 2:
        print("""
🤖 CSS Auto-Fixer
Usage: python3 auto-fix.py "your request"

Examples:
  python3 auto-fix.py "make the border thinner"
  python3 auto-fix.py "move the filter down"
  python3 auto-fix.py "make timeline wider"
        """)
        sys.exit(1)

    fixer = CSSAutoFixer()
    request = ' '.join(sys.argv[1:])
    fixer.process_request(request)

if __name__ == "__main__":
    main()
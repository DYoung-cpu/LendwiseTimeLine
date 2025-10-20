#!/usr/bin/env python3
"""
Aider Helper - Makes Aider more conversational
Usage: python3 aider-helper.py "your natural language request"
"""

import sys
import subprocess
import os

def translate_to_aider(request):
    """Translate natural language to specific Aider commands"""

    # Map common requests to specific Aider prompts
    translations = {
        "change border padding": "In timeline-aider-practice.css, find the .timeline-border-container class and change ONLY the padding value. Do not modify any other properties.",
        "make filter button blue": "In timeline-aider-practice.css, find .new-filter-btn and change ONLY the background color to blue. Do not modify other properties.",
        "add test button": "In timeline-aider-practice.html, add a button with class 'test-btn' containing text 'Test' after .timeline-container. Do not modify existing elements.",
    }

    # Find matching translation
    for key, value in translations.items():
        if key.lower() in request.lower():
            return value

    # Default to safe, specific format
    return f"Make this specific change only: {request}. Do not modify any other code."

def run_aider_command(prompt, files):
    """Run Aider with specific prompt and files"""
    cmd = f"cd /mnt/c/Users/dyoun/Active\\ Projects/LendWiseLanding && echo '{prompt}' | aider --no-auto-commits --yes --map-tokens 2048 {' '.join(files)}"

    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.stdout
    except Exception as e:
        return f"Error: {e}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 aider-helper.py 'your request'")
        print("Example: python3 aider-helper.py 'change border padding to 5px'")
        sys.exit(1)

    request = " ".join(sys.argv[1:])
    print(f"\n🤖 Processing: {request}")

    # Determine which files to work with
    files = []
    if "css" in request.lower() or "style" in request.lower():
        files.append("timeline-aider-practice.css")
    if "html" in request.lower() or "button" in request.lower():
        files.append("timeline-aider-practice.html")
    if not files:
        files = ["timeline-aider-practice.css", "timeline-aider-practice.html"]

    # Translate and run
    aider_prompt = translate_to_aider(request)
    print(f"📝 Aider prompt: {aider_prompt}")
    print(f"📁 Working with: {', '.join(files)}")

    result = run_aider_command(aider_prompt, files)
    print(f"\n✅ Result: {result}")
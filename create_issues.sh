#!/bin/bash

# Check if gh is authenticated
if ! gh auth status &>/dev/null; then
    echo "Error: GitHub CLI is not authenticated. Run 'gh auth login' first."
    exit 1
fi

# Read the YAML file and parse it using Python
python3 << 'EOF'
import yaml
import subprocess
import sys

try:
    with open('issues.yaml', 'r') as f:
        issues = yaml.safe_load(f)
    
    if not isinstance(issues, list):
        print("Error: YAML file should contain a list of issues")
        sys.exit(1)
    
    total = len(issues)
    print(f"Found {total} issues to create\n")
    
    for idx, issue in enumerate(issues, 1):
        title = issue.get('title', '')
        body = issue.get('body', '')
        
        if not title:
            print(f"Skipping issue {idx}: No title found")
            continue
        
        print(f"[{idx}/{total}] Creating: {title}")
        
        # Create the issue using gh CLI
        result = subprocess.run(
            ['gh', 'issue', 'create', '--title', title, '--body', body],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print(f"✓ Created: {result.stdout.strip()}")
        else:
            print(f"✗ Failed: {result.stderr.strip()}")
        
        print()
    
    print(f"Finished processing {total} issues")
    
except FileNotFoundError:
    print("Error: issues.yaml not found")
    sys.exit(1)
except yaml.YAMLError as e:
    print(f"Error parsing YAML: {e}")
    sys.exit(1)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
EOF

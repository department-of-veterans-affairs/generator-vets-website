#!/bin/bash
# Link generator to vets-website for local development
# Usage: npm run link:vets-website

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GENERATOR_DIR="$(dirname "$SCRIPT_DIR")"
VETS_WEBSITE_DIR="$GENERATOR_DIR/../vets-website"

echo "========================================"
echo "Linking generator to vets-website"
echo "========================================"
echo "Generator: $GENERATOR_DIR"
echo "Vets Website: $VETS_WEBSITE_DIR"
echo ""

# Ensure we're using the correct Node version
cd "$GENERATOR_DIR"
source ~/.nvm/nvm.sh 2>/dev/null || true
nvm use 2>/dev/null || true

NODE_MAJOR=$(node -v 2>&1 | cut -d'v' -f2 | cut -d'.' -f1) || NODE_MAJOR=""
if [ -z "$NODE_MAJOR" ] || [ "$NODE_MAJOR" -lt 22 ] 2>/dev/null; then
    echo "ERROR: This script requires Node.js 22 or later."
    if [ -n "$NODE_MAJOR" ]; then
        echo "Current version: $(node -v 2>&1 || echo 'unknown')"
    else
        echo "Node.js was not found or could not be run."
    fi
    exit 1
fi

echo "Step 1: Create global npm link from generator"
npm link
echo "OK: Created global symlink"

echo ""
echo "Step 2: Link generator into vets-website"
if [ ! -d "$VETS_WEBSITE_DIR" ]; then
    echo "ERROR: vets-website not found at $VETS_WEBSITE_DIR"
    echo "Please ensure vets-website is cloned as a sibling directory."
    exit 1
fi

cd "$VETS_WEBSITE_DIR"
npm link @department-of-veterans-affairs/generator-vets-website --legacy-peer-deps
echo "OK: Linked generator in vets-website"

echo ""
echo "========================================"
echo "Link complete!"
echo "========================================"
echo ""
echo "You can now run the generator from vets-website if it is using a compatible version of yo:"
echo "  cd $VETS_WEBSITE_DIR"
echo "  yarn new:app"
echo ""
echo "To run with a compatible version of yo, run the following command from the generator-vets-website root:"
echo "  npm run generate"
echo ""
echo "To unlink when done:"
echo "  npm run unlink:vets-website"

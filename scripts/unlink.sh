#!/bin/bash
# Unlink generator from vets-website
# Usage: npm run unlink:vets-website

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GENERATOR_DIR="$(dirname "$SCRIPT_DIR")"
VETS_WEBSITE_DIR="$GENERATOR_DIR/../vets-website"

echo "========================================"
echo "Unlinking generator from vets-website"
echo "========================================"

# Ensure we're using the correct Node version
cd "$GENERATOR_DIR"
source ~/.nvm/nvm.sh 2>/dev/null || true
nvm use 2>/dev/null || true

echo "Step 1: Unlink from vets-website"
if [ -d "$VETS_WEBSITE_DIR" ]; then
    cd "$VETS_WEBSITE_DIR"
    npm unlink --no-save @department-of-veterans-affairs/generator-vets-website 2>/dev/null || true
    echo "OK: Unlinked from vets-website"
else
    echo "SKIP: vets-website directory not found"
fi

echo ""
echo "Step 2: Remove global symlink"
cd "$GENERATOR_DIR"
npm unlink 2>/dev/null || true
echo "OK: Removed global symlink"

echo ""
echo "========================================"
echo "Unlink complete!"
echo "========================================"
echo ""
echo "vets-website will now use the published npm version."

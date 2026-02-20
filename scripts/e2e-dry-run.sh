#!/bin/bash
# E2E Test: Dry Run Modes
# Tests the generator's dry-run functionality without creating files

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GENERATOR_DIR="$(dirname "$SCRIPT_DIR")"
VETS_WEBSITE_DIR="$GENERATOR_DIR/../vets-website"

echo "========================================"
echo "E2E Test: Dry Run Modes"
echo "========================================"
echo "Generator: $GENERATOR_DIR"
echo "Vets Website: $VETS_WEBSITE_DIR"
echo ""

# Ensure we're using the correct Node version
cd "$GENERATOR_DIR"
source ~/.nvm/nvm.sh
nvm use

echo ""
echo "----------------------------------------"
echo "Step 1: Verify Node version"
echo "----------------------------------------"
NODE_VERSION=$(node --version)
echo "Node version: $NODE_VERSION"
if [[ ! "$NODE_VERSION" =~ ^v22 ]]; then
    echo "ERROR: Expected Node 22.x, got $NODE_VERSION"
    exit 1
fi
echo "OK: Node 22.x detected"

echo ""
echo "----------------------------------------"
echo "Step 2: Run unit tests"
echo "----------------------------------------"
npm test
echo "OK: All unit tests passed"

echo ""
echo "----------------------------------------"
echo "Step 3: Create npm link"
echo "----------------------------------------"
npm link
echo "OK: Created global npm link for generator"

echo ""
echo "----------------------------------------"
echo "Step 4: Test dry-run non-interactive (basic app)"
echo "----------------------------------------"
# This tests the generator's validation and file listing without creating files
"$GENERATOR_DIR/node_modules/.bin/yo" \
    @department-of-veterans-affairs/vets-website \
    --dry-run-non-interactive \
    --appName="E2E Test App" \
    --folderName="e2e-test-app" \
    --entryName="e2e-test-app" \
    --rootUrl="/e2e-test-app" \
    --isForm=false \
    --slackGroup="none" \
    --contentRepoLocation="../vagov-content"

echo ""
echo "OK: Dry run non-interactive (basic app) completed"

echo ""
echo "----------------------------------------"
echo "Step 5: Test dry-run non-interactive (form app)"
echo "----------------------------------------"
"$GENERATOR_DIR/node_modules/.bin/yo" \
    @department-of-veterans-affairs/vets-website \
    --dry-run-non-interactive \
    --appName="E2E Form Test" \
    --folderName="e2e-form-test" \
    --entryName="e2e-form-test" \
    --rootUrl="/e2e-form-test" \
    --isForm=true \
    --slackGroup="@test-team" \
    --contentRepoLocation="../vagov-content" \
    --formNumber="21-E2E" \
    --trackingPrefix="e2e-form-" \
    --respondentBurden="15" \
    --ombNumber="2900-0001" \
    --expirationDate="12/31/2030" \
    --benefitDescription="e2e testing" \
    --usesVetsJsonSchema=false \
    --usesMinimalHeader=true \
    --addToMyVaSip=false \
    --templateType="WITH_1_PAGE"

echo ""
echo "OK: Dry run non-interactive (form app) completed"

echo ""
echo "----------------------------------------"
echo "Step 6: Test dry-run interactive (form app)"
echo "----------------------------------------"
"$GENERATOR_DIR/node_modules/.bin/yo" \
    @department-of-veterans-affairs/vets-website \
    --dry-run-interactive \
    --appName="E2E Interactive Test" \
    --isForm=true \
    --formNumber="21-INT"

echo ""
echo "OK: Dry run interactive (form app) completed"

echo ""
echo "----------------------------------------"
echo "Step 7: Unlink generator"
echo "----------------------------------------"
npm unlink 2>/dev/null || true
echo "OK: Unlinked generator"

echo ""
echo "========================================"
echo "E2E Dry Run Tests: ALL PASSED"
echo "========================================"

#!/bin/bash
# E2E Test: Real File Generation
# Tests the generator's ability to create files in a temporary directory

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GENERATOR_DIR="$(dirname "$SCRIPT_DIR")"
VETS_WEBSITE_DIR="$GENERATOR_DIR/../vets-website"
TEMP_DIR="$VETS_WEBSITE_DIR/src/applications/_e2e-test-temp"

echo "========================================"
echo "E2E Test: Real File Generation"
echo "========================================"
echo "Generator: $GENERATOR_DIR"
echo "Vets Website: $VETS_WEBSITE_DIR"
echo "Temp Output: $TEMP_DIR"
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
echo "Step 2: Check vets-website directory"
echo "----------------------------------------"
if [ ! -d "$VETS_WEBSITE_DIR" ]; then
    echo "ERROR: vets-website not found at $VETS_WEBSITE_DIR"
    exit 1
fi
echo "OK: vets-website directory exists"

echo ""
echo "----------------------------------------"
echo "Step 3: Create npm link"
echo "----------------------------------------"
cd "$GENERATOR_DIR"
npm link
echo "OK: Created global npm link"

echo ""
echo "----------------------------------------"
echo "Step 4: Link generator in vets-website"
echo "----------------------------------------"
cd "$VETS_WEBSITE_DIR"
npm link @department-of-veterans-affairs/generator-vets-website --legacy-peer-deps
echo "OK: Linked generator in vets-website"

echo ""
echo "----------------------------------------"
echo "Step 5: Clean up previous test files"
echo "----------------------------------------"
if [ -d "$TEMP_DIR" ]; then
    rm -rf "$TEMP_DIR"
    echo "Removed existing test directory"
fi
mkdir -p "$TEMP_DIR"

# Clean up registry entries from previous test runs
REGISTRY_FILE="$VETS_WEBSITE_DIR/../content-build/src/applications/registry.json"
if [ -f "$REGISTRY_FILE" ]; then
    # Use a temp file to avoid issues with piping to same file
    node -e "
        const fs = require('fs');
        const data = JSON.parse(fs.readFileSync('$REGISTRY_FILE', 'utf8'));
        const filtered = data.filter(app => 
            !app.appName?.startsWith('E2E Test') && 
            !app.entryName?.startsWith('e2e-')
        );
        fs.writeFileSync('$REGISTRY_FILE', JSON.stringify(filtered, null, 2));
        console.log('Cleaned ' + (data.length - filtered.length) + ' E2E test entries from registry');
    " 2>/dev/null || echo "Could not clean registry (may not exist yet)"
fi
echo "OK: Created clean test directory"

echo ""
echo "----------------------------------------"
echo "Step 6: Generate basic app (non-form)"
echo "----------------------------------------"
cd "$VETS_WEBSITE_DIR"
"$GENERATOR_DIR/node_modules/.bin/yo" \
    @department-of-veterans-affairs/vets-website \
    --force \
    --appName="E2E Test Basic App" \
    --folderName="_e2e-test-temp/basic-app" \
    --entryName="e2e-basic-app" \
    --rootUrl="/e2e-basic-app" \
    --isForm=false \
    --slackGroup="none" \
    --contentRepoLocation="../vagov-content"

echo ""
echo "OK: Basic app generated"

echo ""
echo "----------------------------------------"
echo "Step 7: Verify basic app files"
echo "----------------------------------------"
EXPECTED_FILES=(
    "$TEMP_DIR/basic-app/manifest.json"
    "$TEMP_DIR/basic-app/app-entry.jsx"
    "$TEMP_DIR/basic-app/containers/App.jsx"
    "$TEMP_DIR/basic-app/routes.jsx"
    "$TEMP_DIR/basic-app/reducers/index.js"
    "$TEMP_DIR/basic-app/sass/e2e-basic-app.scss"
)
ALL_FOUND=true
for file in "${EXPECTED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  OK: $(basename "$file")"
    else
        echo "  MISSING: $file"
        ALL_FOUND=false
    fi
done
if [ "$ALL_FOUND" = false ]; then
    echo "ERROR: Some expected files are missing"
    exit 1
fi
echo "OK: All basic app files verified"

echo ""
echo "----------------------------------------"
echo "Step 8: Generate form app (1-page)"
echo "----------------------------------------"
cd "$VETS_WEBSITE_DIR"
"$GENERATOR_DIR/node_modules/.bin/yo" \
    @department-of-veterans-affairs/vets-website \
    --force \
    --appName="E2E Test Form App" \
    --folderName="_e2e-test-temp/form-app" \
    --entryName="e2e-form-app" \
    --rootUrl="/e2e-form-app" \
    --isForm=true \
    --slackGroup="@test-team" \
    --contentRepoLocation="../vagov-content" \
    --formNumber="21-E2E" \
    --trackingPrefix="e2e-form-" \
    --respondentBurden="15" \
    --ombNumber="2900-0001" \
    --expirationDate="12/31/2030" \
    --benefitDescription="e2e testing benefits" \
    --usesVetsJsonSchema=false \
    --usesMinimalHeader=true \
    --addToMyVaSip=false \
    --templateType="WITH_1_PAGE"

echo ""
echo "OK: Form app generated"

echo ""
echo "----------------------------------------"
echo "Step 9: Verify form app files"
echo "----------------------------------------"
EXPECTED_FORM_FILES=(
    "$TEMP_DIR/form-app/manifest.json"
    "$TEMP_DIR/form-app/app-entry.jsx"
    "$TEMP_DIR/form-app/containers/App.jsx"
    "$TEMP_DIR/form-app/routes.jsx"
    "$TEMP_DIR/form-app/reducers/index.js"
    "$TEMP_DIR/form-app/containers/IntroductionPage.jsx"
    "$TEMP_DIR/form-app/containers/ConfirmationPage.jsx"
    "$TEMP_DIR/form-app/config/form.js"
)
ALL_FOUND=true
for file in "${EXPECTED_FORM_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  OK: $(basename "$file")"
    else
        echo "  MISSING: $file"
        ALL_FOUND=false
    fi
done
if [ "$ALL_FOUND" = false ]; then
    echo "ERROR: Some expected form files are missing"
    exit 1
fi
echo "OK: All form app files verified"

echo ""
echo "----------------------------------------"
echo "Step 10: Clean up test files"
echo "----------------------------------------"
rm -rf "$TEMP_DIR"
echo "OK: Removed test directory"

echo ""
echo "----------------------------------------"
echo "Step 11: Unlink generator"
echo "----------------------------------------"
cd "$VETS_WEBSITE_DIR"
npm unlink --no-save @department-of-veterans-affairs/generator-vets-website 2>/dev/null || true
cd "$GENERATOR_DIR"
npm unlink 2>/dev/null || true
echo "OK: Unlinked generator"

echo ""
echo "========================================"
echo "E2E Real Generation Tests: ALL PASSED"
echo "========================================"

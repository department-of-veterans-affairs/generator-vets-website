#!/bin/bash
# E2E Test Suite: All Tests
# Runs all E2E tests for the generator

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================"
echo "E2E Test Suite: Running All Tests"
echo "========================================"
echo ""

# Track overall results
PASSED=0
FAILED=0

run_test() {
    local test_name="$1"
    local test_script="$2"
    
    echo ""
    echo "========================================"
    echo "Running: $test_name"
    echo "========================================"
    
    if "$SCRIPT_DIR/$test_script"; then
        echo "PASSED: $test_name"
        ((PASSED++))
    else
        echo "FAILED: $test_name"
        ((FAILED++))
    fi
}

# Run dry-run tests (no file creation)
run_test "Dry Run Tests" "e2e-dry-run.sh"

# Run real generation tests (creates files in temp directory)
run_test "Real Generation Tests" "e2e-real-generation.sh"

echo ""
echo "========================================"
echo "E2E Test Suite: Summary"
echo "========================================"
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo ""

if [ $FAILED -gt 0 ]; then
    echo "RESULT: SOME TESTS FAILED"
    exit 1
else
    echo "RESULT: ALL TESTS PASSED"
    exit 0
fi

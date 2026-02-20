#!/bin/bash
# Run generator in vets-website using compatible yo version
#
# WHY THIS EXISTS:
# The generator v4.0.0 requires yeoman-generator 7.x which needs a compatible
# version of the `yo` CLI. vets-website may have an older `yo` version installed
# that causes "Cannot add property resolved, object is not extensible" errors.
#
# This script runs the generator using the `yo` binary from generator-vets-website's
# node_modules, which is guaranteed to be compatible with yeoman-generator 7.x.
#
# Once vets-website updates its dependencies to be compatible with this generator,
# you can use `yarn new:app` directly from vets-website instead.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GENERATOR_DIR="$(dirname "$SCRIPT_DIR")"
VETS_WEBSITE_DIR="$GENERATOR_DIR/../vets-website"

# Ensure correct Node version
cd "$GENERATOR_DIR"
source ~/.nvm/nvm.sh 2>/dev/null || true
nvm use 2>/dev/null || true

# Verify vets-website exists
if [ ! -d "$VETS_WEBSITE_DIR" ]; then
    echo "ERROR: vets-website not found at $VETS_WEBSITE_DIR"
    echo "Please ensure vets-website is cloned as a sibling directory."
    exit 1
fi

# Verify generator is linked
if [ ! -L "$VETS_WEBSITE_DIR/node_modules/@department-of-veterans-affairs/generator-vets-website" ]; then
    echo "ERROR: Generator is not linked to vets-website"
    echo "Run 'npm run link:vets-website' first."
    exit 1
fi

# Run generator from vets-website directory using our compatible yo
cd "$VETS_WEBSITE_DIR"
"$GENERATOR_DIR/node_modules/.bin/yo" @department-of-veterans-affairs/vets-website "$@"

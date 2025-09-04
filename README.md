> Yeoman generator for applications on VA.gov

## Requirements

- Node.js 14.15.0

## Node.js Version Migration Notes

### Current State (Node 14.15.0)

This generator currently requires Node.js 14.15.0 to maintain compatibility with consumer environments that may not have upgraded to newer Node.js versions yet. The generator uses:

- `yeoman-generator@^5.6.1` (CommonJS, Node 12+ compatible)
- All dependencies are compatible with Node 14.15.0

### Migration to Node 22+ - Blockers and Considerations

**Why we can't migrate to Node 22 immediately:**

1. **Consumer Compatibility**: When users run `yo @department-of-veterans-affairs/vets-website`, they execute our generator directly in their Node.js environment. If we upgrade to Node 22, all consumers must also upgrade.

2. **Yeoman Generator Dependencies**:
   - `yeoman-generator@7.x+` requires Node 18.17+ and is ESM-only
   - `yeoman-environment@4.x+` also requires Node 18+ and is ESM-only
   - These versions are incompatible with our current CommonJS structure

3. **Breaking Changes**: The migration would require:
   - Converting all generator code from CommonJS to ESM (`require()` → `import`)
   - Updating all consumers to Node 18.17+ minimum
   - Potentially breaking existing CI/CD pipelines that rely on Node 14

### Migration Path (Future)

When ready to migrate to Node 22, the steps would be:

1. **Phase 1: Preparation**
   - Survey consumer environments for Node.js version adoption
   - Update documentation to recommend Node 18+ for new setups
   - Create migration timeline and communicate to stakeholders

2. **Phase 2: Technical Migration**
   - Convert generator from CommonJS to ESM
   - Upgrade to `yeoman-generator@^7.5.1` and `yeoman-environment@^4.4.1`
   - Update all import/export statements
   - Update package.json to `"type": "module"`

3. **Phase 3: Validation**
   - Test generator in Node 18, 20, and 22 environments
   - Update CI/CD pipelines
   - Publish breaking version (v4.0.0) with clear migration notes

4. **Phase 4: Deprecation**
   - Deprecate Node 14 support
   - Provide 6-month support window for legacy version
   - Monitor adoption and provide migration assistance

**Current Recommendation**: Stay on Node 14.15.0 until consumer environment survey shows majority adoption of Node 18+.

## Installation

The generator is already installed as a `devDependency` of [`vets-website`](https://github.com/department-of-veterans-affairs/vets-website).

## Local Development Setup

If you're working on this generator itself, you'll need to link it locally to test your changes.

### 1. Install dependencies and create global symlink

From the root of this repo (`generator-vets-website`):

```sh
nvm use # from .nvmrc
npm install
npm link  # Creates a global symlink to this local package
```

### 2. Link the global symlink into vets-website

From the root of `vets-website`:

```sh
npm link @department-of-veterans-affairs/generator-vets-website
```

This tells vets-website to use your local development version instead of the published npm version.

### 3. Test your changes

```sh
# From vets-website root:
yarn new:app
```

Any changes to the generator will be automatically included due to the npm link.

### 4. Clean up when done

```sh
# From vets-website root:
npm unlink --no-save @department-of-veterans-affairs/generator-vets-website

# From generator-vets-website root:
npm unlink
```

## Usage

The generator supports two modes of operation:

### Interactive Mode

```bash
# From vets-website directory
yarn run new:app
```

The generator will guide you through all required information with helpful prompts and validation.
The generator supports two modes of operation:

### Interactive Mode

```bash
# From vets-website directory
yarn run new:app
```

The generator will guide you through all required information with helpful prompts and validation.

### Non-Interactive Mode

Provide all arguments upfront to skip prompts entirely:
### Non-Interactive Mode

Provide all arguments upfront to skip prompts entirely:

```bash
# From vets-website directory
# From vets-website directory
yo @department-of-veterans-affairs/vets-website \
  --force \
  --appName="My App" \
  --folderName="my-app" \
  --entryName="my-app" \
  --rootUrl="/my-app" \
  --isForm=true \
  --slackGroup="@my-group" \
  --contentLoc="../vagov-content" \
  --formNumber="21P-530" \
  --trackingPrefix="burials-530-" \
  --respondentBurden="30" \
  --ombNumber="2900-0797" \
  --expirationDate="12/31/2026" \
  --benefitDescription="burial benefits" \
  --usesVetsJsonSchema=false \
  --usesMinimalHeader=false \
  --templateType="WITH_1_PAGE"
```

Use `--force` option to automatically overwrite existing files without prompting.
Use `--force` option to automatically overwrite existing files without prompting.

### Resources
### Resources

- [Guide on using this Yeoman generator with example answers for each prompt](https://department-of-veterans-affairs.github.io/veteran-facing-services-tools/platform/tools/generator/)
- [Basic tutorial for creating and modifying a form application](https://department-of-veterans-affairs.github.io/veteran-facing-services-tools/forms/form-tutorial-basic)

These resources are also provided by the generator at startup.

### Generator Architecture

The generator uses a unified architecture with a strategy pattern to handle both general (non-form) apps and form apps.
- A single entry point (`generators/app/index.js`) determines the app type based on the `isForm` flag
- Strategy classes (AppStrategy, FormStrategy) handle the specific generation logic for each type
- Templates are organized under `generators/app/templates/` with shared, app-specific, and form-specific folders
- This provides a clean separation of concerns while maintaining a single, consistent interface

For specifics on writing a generator, [refer to the official Yeoman documentation](https://yeoman.github.io/generator/).

## Publishing to npm
## Publishing to npm

When you're ready to publish a new version of the generator to npm:

1. **Ensure you're logged in to npm:**

    ```sh
    npm login
    ```

    You'll need to be added as a maintainer of the `@department-of-veterans-affairs/generator-vets-website` package.

2. **Update the version number:**

    ```sh
    npm version patch   # for bug fixes (3.14.1 → 3.14.2)
    npm version minor   # for new features (3.14.1 → 3.15.0)
    npm version major   # for breaking changes (3.14.1 → 4.0.0)
    ```

    This will update `package.json` and create a git tag.

3. **Run pre-publish checks:**

    ```sh
    npm run prepublishOnly
    ```

    This runs `npm run prepublishOnly` to check for security vulnerabilities.

4. **Publish to npm:**

    ```sh
    npm publish
    ```

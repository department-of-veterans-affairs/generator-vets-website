> Yeoman generator for applications on VA.gov

## Requirements

- Node.js 22.0.0+

## Installation

The generator is already installed as a `devDependency` of [`vets-website`](https://github.com/department-of-veterans-affairs/vets-website).

## Local Development Setup

If you're working on this generator itself, you'll need to link it locally to test your changes.

### Quick Start (Recommended)

```sh
# From generator-vets-website root:
nvm use                      # Use Node version from .nvmrc
npm install                  # Install dependencies
npm run link:vets-website    # Link to vets-website for testing
```

This creates a symlink so vets-website uses your local development version.

### Test Your Changes

```sh
# From generator-vets-website root:
npm run generate
```

This runs the generator in vets-website using a compatible `yo` CLI version. Any changes to the generator will be automatically reflected due to the npm link.

> **Why `npm run generate` instead of `yarn new:app`?**
>
> Generator v4.0.0 uses `yeoman-generator@7.x` which requires a compatible version of the `yo` CLI. If vets-website has not yet been updated, its older `yo` version will cause errors like "Cannot add property resolved, object is not extensible". The `npm run generate` command uses the compatible `yo` from this repo's node_modules.
>
> Once vets-website updates its dependencies, you can use `yarn new:app` directly from vets-website.

### Clean Up

```sh
# From generator-vets-website root:
npm run unlink:vets-website
```

### Manual Setup (Alternative)

If you prefer to set up the links manually:

1. **Create global symlink** (from generator-vets-website):
   ```sh
   npm link
   ```

2. **Link into vets-website** (from vets-website):
   ```sh
   npm link @department-of-veterans-affairs/generator-vets-website
   ```

3. **Clean up when done**:
   ```sh
   # From vets-website:
   npm unlink --no-save @department-of-veterans-affairs/generator-vets-website
   # From generator-vets-website:
   npm unlink
   ```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm test` | Run unit tests (89 tests) |
| `npm run lint` | Run ESLint |
| `npm run e2e` | Run all E2E tests |
| `npm run e2e:dry-run` | Run E2E tests for dry-run modes only |
| `npm run e2e:real` | Run E2E tests with real file generation |
| `npm run link:vets-website` | Link generator to vets-website for local development |
| `npm run unlink:vets-website` | Remove link from vets-website |
| `npm run generate` | Run generator in vets-website (uses compatible yo version) |

### E2E Testing

The E2E test suite validates the generator works correctly end-to-end:

```sh
# Run all E2E tests (unit tests + dry-run + real generation)
npm run e2e

# Run only dry-run E2E tests (no files created)
npm run e2e:dry-run

# Run real file generation tests (creates files in temp directory)
npm run e2e:real
```

**Note:** E2E tests require `vets-website` to be cloned as a sibling directory (`../vets-website`).

## Usage

The generator supports two modes of operation:

### Interactive Mode

```bash
# From vets-website directory
yarn run new:app
```

The generator will guide you through all required information with helpful prompts and validation.

#### Dry Run Interactive Mode

To preview what files would be generated without actually creating them:

```bash
yo @department-of-veterans-affairs/vets-website \
  --dry-run-interactive \
  --appName="My App" \
  --folderName="my-app" \
  --entryName="my-app" \
  --rootUrl="/my-app" \
  --isForm=true
```

This mode:
- Shows what prompts would have been asked if this were a standard interactive run, what defaults would be used, and what would be missing
- Displays a list of files that would be generated
- Does not create any actual files or modify the filesystem

### Non-Interactive Mode

Provide all arguments upfront to skip prompts entirely. **Note:** CLI mode requires explicit values for most fields since it cannot rely on interactive prompts or defaults:

```bash
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
  --usesMinimalHeader=true \
  --addToMyVaSip=true \
  --templateType="WITH_1_PAGE"
```

Use `--force` option to automatically overwrite existing files without prompting.

#### Dry Run Non-Interactive Mode

To preview what files would be generated without creating them, using predefined arguments. **This mode requires all necessary CLI arguments** since it cannot prompt for missing values:

```bash
yo @department-of-veterans-affairs/vets-website \
  --dry-run-non-interactive \
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
  --usesMinimalHeader=true \
  --addToMyVaSip=true \
  --templateType="WITH_1_PAGE"
```

This mode:
- Requires explicit values for all necessary fields (stricter than interactive mode)
- Shows a detailed list of files that would be generated
- Does not create any actual files or modify the filesystem
Use `--force` option to automatically overwrite existing files without prompting.

### Resources

- [Guide on using this Yeoman generator with example answers for each prompt](https://department-of-veterans-affairs.github.io/veteran-facing-services-tools/platform/tools/generator/)
- [Basic tutorial for creating and modifying a form application](https://department-of-veterans-affairs.github.io/veteran-facing-services-tools/forms/form-tutorial-basic)

These resources are also provided by the generator at startup.

### Generator Architecture

For specifics on writing a generator, [refer to the official Yeoman documentation](https://yeoman.github.io/generator/).

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

## Adding New Prompts

If you need to add a new prompt to the generator, follow these steps:

### 1. Define the Field

Add your new field to the field definitions in `lib/prompts.js`:

```javascript
const fieldDefinitions = {
  // ... existing fields
  myNewField: {
    type: 'input',
    message: 'What is your new field value?',
    validate: (input) => {
      if (!input || input.trim() === '') {
        return 'This field is required.';
      }
      return true;
    },
    filter: (input) => input.trim(),
  },
};
```

### 2. Add to Field Groups

Include your field in the appropriate field group(s):

```javascript
const fieldGroups = {
  core: ['appName', 'folderName', 'entryName', 'rootUrl', 'isForm', 'myNewField'],
  form: ['formNumber', 'ombNumber', 'expirationDate', 'myNewField'],
  // ... other groups
};
```

### 3. Add CLI Validation (Optional)

If the field should be available as a CLI argument, add validation in `lib/cli-validation.js`:

```javascript
function validateMyNewField(value) {
  if (!value) {
    return 'myNewField is required';
  }
  // Add specific validation logic
  return null; // Return null if valid, error string if invalid
}
```

### 4. Update Templates

Use the new field in your templates with EJS syntax:

```html
<!-- In any .ejs template file -->
<div>My new field value: <%= myNewField %></div>
```

### 5. Add to CLI Arguments (Optional)

If you want the field to be available as a command-line argument, add it to the options in `generators/app/index.js`:

```javascript
// This is typically handled automatically by the field definitions,
// but you may need to add custom logic for complex fields
```

### 6. Test Your Changes

1. Link the generator locally: `npm run link:vets-website`
2. Run unit tests: `npm test`
3. Run E2E tests: `npm run e2e`
4. Test manually in vets-website: `yarn new:app`
5. Verify the field appears in prompts and generates correctly in templates

## Node.js Version Migration Notes

### Current State (Node 22+)

This generator requires Node.js 22.0.0+ and uses:

- `yeoman-generator@^7.5.0` (ESM-only, Node 18.17+ required)
- ES Modules throughout the codebase
- All dependencies are compatible with Node 22+

### Migration from v3.x (Node 14)

Version 4.0.0 is a major breaking change that requires Node.js 22+ due to:

1. **ESM Conversion**: All code has been converted from CommonJS to ES Modules
2. **Dependency Upgrades**: yeoman-generator, chalk, and other packages now require Node 18.17+
3. **Consumer Requirements**: Users must upgrade to Node 22+ to use this generator

If you need to use the generator with Node 14, please use version 3.x


> Yeoman generator for applications on VA.gov

## Requirements

- Node.js 14.15.0

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

### 4. Run tests

```sh
# From generator-vets-website root:
npm test
```

This runs the automated test suite to verify your changes don't break existing functionality. Note that these tests only cover non-interactive mode - you should also manually test interactive mode by running the generator in vets-website.

### 5. Clean up when done

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

    ```shg
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

1. Link the generator locally (see Local Development Setup)
2. Test both interactive and non-interactive modes
3. Verify the field appears in prompts and generates correctly in templates

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
   - These versions are incompatible with our current CommonJS
   - Migrate current test structure to yeoman-environment

3. **Breaking Changes**: The migration would require:
   - Converting all generator code from CommonJS to ESM (`require()` → `import`)
   - Updating all consumers to Node 18.17+ minimum
   - Potentially breaking existing CI/CD pipelines that rely on Node 14


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

### 4. Clean up when done

```sh
# From vets-website root:
npm unlink --no-save @department-of-veterans-affairs/generator-vets-website

# From generator-vets-website root:
npm unlink
```

### Running tests

To run the automated test suite:

```sh
npm test
```

This will run the test suite. To run linting separately:

```sh
npm run lint
```

Or run both linting and tests together:

```sh
npm run test:full
```

## Usage

The generator supports two modes of operation:

### Interactive Mode

```bash
# From vets-website directory
yarn run new:app
```

The generator will guide you through all required information with helpful prompts and validation.

### Non-Interactive Mode

Provide all arguments upfront to skip prompts entirely:

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
  --usesMinimalHeader=false \
  --templateType="WITH_1_PAGE"
```

Use `--force` option to automatically overwrite existing files without prompting.

### Resources

- [Guide on using this Yeoman generator with example answers for each prompt](https://department-of-veterans-affairs.github.io/veteran-facing-services-tools/platform/tools/generator/)
- [Basic tutorial for creating and modifying a form application](https://department-of-veterans-affairs.github.io/veteran-facing-services-tools/forms/form-tutorial-basic)

These resources are also provided by the generator at startup.

### Generator Architecture

There are two generators: one for general (non-form) apps and one for form apps.
- The latter runs on top of the former if certain prompts are answered to generate a form app.
- Each generator has its own set of templates from which it generates files in the app structure.

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

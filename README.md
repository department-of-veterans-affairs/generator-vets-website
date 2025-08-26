> Yeoman generator for applications on VA.gov

## Installation

The generator is already installed as a `devDependency` of [`vets-website`](https://github.com/department-of-veterans-affairs/vets-website).

## Usage

From `vets-website`, run `npm run new:app`.

Follow the instructions on screen.

### Command Line Usage

You can skip the interactive prompts by passing all options via command line:

```bash
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

The `--force` option will automatically overwrite existing files without prompting.

For more details on answering the prompts, the following documentation might be helpful.

- [Guide on using this Yeoman generator with example answers for each prompt](https://department-of-veterans-affairs.github.io/veteran-facing-services-tools/platform/tools/generator/)
- [Basic tutorial for creating and modifying a form application](https://department-of-veterans-affairs.github.io/veteran-facing-services-tools/forms/form-tutorial-basic)

These resources are also provided by the generator at startup.

## Contributing

### Making changes

There are two generators: one for general (non-form) apps and one for form apps.
- The latter runs on top of the former if certain prompts are answered to generate a form app.
- Each generator has its own set of templates from which it generates files in the app structure.

For specifics on writing a generator, [refer to the official Yeoman documentation](https://yeoman.github.io/generator/).

### Testing changes

1. **Make your modified generator available as a global module.**

    From the root of this repo (`generator-vets-website`):

    ```sh
    # Create a symlink in your global node_modules to this module.
    npm link
    ```

2. **Run your modified generator in your local `vets-website`.**

    From the root of `vets-website`:

    ```sh
    # Point vets-website's local generator to your newly linked global module.
    npm link @department-of-veterans-affairs/generator-vets-website

    # Start up Yeoman.
    npx yo

    # Choose to run generator-vets-website in the Yeoman prompt.
    ```

    Due to the link, any further changes to the generator will automatically be included when you run it within your local `vets-website` repo.

3. **When you're done testing your changes, clean up the links:**

    ```sh
    # From the root of vets-website:
    npm unlink --no-save @department-of-veterans-affairs/generator-vets-website

    # From the root of generator-vets-website:
    npm unlink
    ```

### Publishing to npm

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

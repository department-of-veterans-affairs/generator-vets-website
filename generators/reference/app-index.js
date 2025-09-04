'use strict';
const fs = require('fs');
const path = require('path');
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const { validateAllCliArguments } = require('../../lib/cli-validation');
const { initializeFileTracking } = require('../../lib/fs-tracker');
const { getContextualFieldDefinitions } = require('../../lib/prompts');
const {
  generateOptions,
  initializePropsFromOptions,
} = require('../../lib/generator-config');
const { generatePrompts } = require('../../lib/prompts');
const {
  isInvalidFolderName,
  isInvalidEntryName,
  isInvalidSlackGroup,
  checkForDuplicates,
} = require('../../utils/validation');
const {
  uuidv4,
  checkNodeCompatibility,
  makeBool,
} = require('../../utils/generator-helpers');
const {
  isDryRunMode,
  initializeDryRunMode,
  normalizeDryRunOptions,
  shouldSkipValidation,
  handleDryRunPrompting,
  showTrackedFiles,
} = require('../../lib/dry-run-helpers');

module.exports = class extends Generator {
  constructor(args, options) {
    // REMOVE: this call when upgrading to yeoman-generator 5.10.0+ for Node.js 22+ support
    checkNodeCompatibility();

    super(args, options);

    const isForm =
      this.options.isForm === undefined ? true : makeBool(this.options.isForm);
    this.allFields = getContextualFieldDefinitions(isForm);
    this.appFields = this.allFields; // Maintain backward compatibility

    initializeFileTracking(this);
    initializeDryRunMode(this.options);
    generateOptions(this, this.allFields);
  }

  initializing() {
    const { store } = require('../../lib/store');

    const tempThis = {
      props: {},
      options: this.options,
    };
    initializePropsFromOptions(tempThis, this.allFields);

    store.setOptions(this.options);
    store.setProps(tempThis.props);

    if (!store.getValue('productId')) {
      store.setProp('productId', uuidv4());
    }

    store.setProp('contentRepoLocation', store.getValue('contentLoc'));
    this.sharedProps = {};

    normalizeDryRunOptions(this.options);

    if (shouldSkipValidation(this.options)) {
      return;
    }

    const cliValidationErrors = validateAllCliArguments(this.options);
    if (cliValidationErrors.length > 0) {
      const errorMessage = `CLI validation failed:\n${cliValidationErrors
        .map((err) => `  - ${err}`)
        .join('\n')}`;
      this.emit('error', new Error(errorMessage));
      return;
    }

    // Note: validateRequiredFields is not called for non-interactive mode here
    // since validateAllCliArguments already handles required field validation
    // in the correct CLI argument format (--field-name vs fieldName)

    store.setProp(
      'isForm',
      this.options.isForm === undefined ? null : makeBool(this.options.isForm),
    );

    if (store.getValue('folderName')) {
      const badFolder = isInvalidFolderName(store.getValue('folderName'));
      if (badFolder !== true) {
        this.emit('error', new Error(badFolder));
      }
    }

    if (store.getValue('entryName')) {
      const badEntryName = isInvalidEntryName(store.getValue('entryName'));
      if (badEntryName !== true) {
        this.emit('error', new Error(badEntryName));
      }
    }

    if (store.getValue('slackGroup')) {
      const badSlackGroup = isInvalidSlackGroup(store.getValue('slackGroup'));
      if (badSlackGroup !== true) {
        this.emit('error', new Error(badSlackGroup));
      }
    }
  }

  prompting() {
    const dryRunResult = handleDryRunPrompting(this, this.allFields);
    if (dryRunResult !== null) {
      return dryRunResult;
    }

    this.log(yosay(`Welcome to the ${chalk.red('vets-website app')} generator!`));

    this.log(
      `For a guide on using this Yeoman generator, including example answers for each prompt:\n${chalk.cyan(
        'https://depo-platform-documentation.scrollhelp.site/developer-docs/va-gov-application-generator',
      )}\n`,
    );

    const prompts = generatePrompts(this, this.allFields, [
      'appName',
      'folderName',
      'entryName',
      'rootUrl',
      'isForm',
      'contentRepoLocation',
      'slackGroup',
    ]);

    return this.prompt(prompts).then((props) => {
      const { store } = require('../../lib/store');

      const updatedProps = { ...store.getAllProps(), ...props };
      store.setProps(updatedProps);

      if (!store.getValue('productId')) {
        store.setProp('productId', uuidv4());
      }
    });
  }

  _updateAllowlist() {
    const { store } = require('../../lib/store');
    const configPath = path.join('config', 'changed-apps-build.json');
    const config = this.fs.readJSON(configPath);
    const isNewApp = !fs.existsSync(
      path.join('src', 'applications', store.getValue('folderName')),
    );

    if (store.getValue('slackGroup') !== 'none' && isNewApp) {
      const appPaths = store.getValue('folderName').split(path.sep);
      const isSingleApp = appPaths.length === 1;

      try {
        if (isSingleApp) {
          config.apps.push({
            rootFolder: store.getValue('folderName'),
            slackGroup: store.getValue('slackGroup'),
          });
        } else {
          const rootFolder = appPaths[0];
          const existingApp = config.apps.find((app) => app.rootFolder === rootFolder);

          if (!existingApp) {
            config.apps.push({
              rootFolder: appPaths[0],
              slackGroup: store.getValue('slackGroup'),
            });
          }
        }

        this.fs.writeJSON(configPath, config);
      } catch (error) {
        this.log(chalk.red(`Could not write to ${configPath}. ${error}`));
      }
    }
  }

  configuring() {
    if (isDryRunMode(this.options)) {
      return;
    }

    // This needs to run before writing to the app folder, so we can know if the root folder is new
    this._updateAllowlist();
  }

  default() {
    const { store } = require('../../lib/store');

    const subfolders = Array.from(store.getValue('folderName') || '').filter(
      (c) => c === '/',
    ).length;
    if (subfolders) {
      store.setProp('subFolder', `${new Array(subfolders).fill('..').join('/')}/`);
    } else {
      store.setProp('subFolder', '');
    }

    if (store.getValue('isForm')) {
      const formOptions = {
        dryRunInteractive: this.options.dryRunInteractive,
        dryRunNonInteractive: this.options.dryRunNonInteractive,
      };

      this.composeWith(require.resolve('../form'), formOptions);
    }
  }

  writingNewFiles() {
    const { store } = require('../../lib/store');

    const rootPath = `src/applications/`;
    const appPath = `${rootPath}${store.getValue('folderName')}`;
    const contentRepoMarkdownCopied = false;

    this.fs.copyTpl(
      this.templatePath('manifest.json.ejs'),
      this.destinationPath(`${appPath}/manifest.json`),
      store.getAllProps(),
    );

    this.fs.copyTpl(
      this.templatePath('app-entry.jsx.ejs'),
      this.destinationPath(`${appPath}/app-entry.jsx`),
      store.getAllProps(),
    );

    if (!store.getValue('isForm')) {
      this.fs.copy(
        this.templatePath('entry.scss'),
        this.destinationPath(`${appPath}/sass/${store.getValue('entryName')}.scss`),
      );

      this.fs.copy(
        this.templatePath('reducer.js'),
        this.destinationPath(`${appPath}/reducers/index.js`),
      );

      this.fs.copy(
        this.templatePath('App.jsx'),
        this.destinationPath(`${appPath}/containers/App.jsx`),
      );

      this.fs.copy(
        this.templatePath('routes.jsx'),
        this.destinationPath(`${appPath}/routes.jsx`),
      );

      this.fs.copyTpl(
        this.templatePath('cypress.spec.js.ejs'),
        this.destinationPath(
          `${appPath}/tests/${store.getValue('entryName')}.cypress.spec.js`,
        ),
        store.getAllProps(),
      );
    }

    if (!isDryRunMode(this.options)) {
      if (contentRepoMarkdownCopied)
        this.log(yosay("Don't forget to make a pull request for vagov-content!"));
      else
        this.log(
          yosay(
            `Don't forget to make a markdown file in the vagov-content repo at pages${store.getValue(
              'rootUrl',
            )}.md!`,
          ),
        );
    }
  }

  updateRegistry() {
    const { store } = require('../../lib/store');
    const contentBuildPath = path.resolve(this.destinationRoot(), '../content-build');
    const registryFile = path.join(contentBuildPath, 'src/applications/registry.json');

    if (!isDryRunMode(this.options)) {
      this.log(chalk.blue(`Updating registry file at: ${registryFile}`));
    }

    try {
      let registry;

      try {
        // Use Node's fs directly to avoid Yeoman's logging of JSON content
        const registryContent = require('fs').readFileSync(registryFile, 'utf8');
        registry = JSON.parse(registryContent);
      } catch (_) {
        if (!isDryRunMode(this.options)) {
          this.log(
            chalk.yellow(
              `Warning: Could not read ${registryFile}. Creating new registry.`,
            ),
          );
        }

        registry = [];
      }

      if (!Array.isArray(registry)) {
        if (!isDryRunMode(this.options)) {
          this.log(
            chalk.yellow(
              `Warning: Registry file exists but is not an array. Initializing as empty array.`,
            ),
          );
        }

        registry = [];
      }

      const newApp = {
        appName: store.getValue('appName'),
        entryName: store.getValue('entryName'),
        rootUrl: store.getValue('rootUrl'),
        productId: store.getValue('productId'),
      };
      const duplicates = checkForDuplicates(registry, newApp);

      if (duplicates.length > 0) {
        const errorMessage = `Cannot create application due to duplicate entries in content-build registry:
${duplicates.join('\n')}`;
        this.log(chalk.red(errorMessage));
        throw new Error(errorMessage);
      }

      registry.push({
        appName: store.getValue('appName'),
        entryName: store.getValue('entryName'),
        rootUrl: store.getValue('rootUrl'),
        productId: store.getValue('productId'),
        template: {
          vagovprod: false,
          layout: 'page-react.html',
          ...(this.sharedProps?.usesMinimalHeader
            ? {
                includeBreadcrumbs: false,
                minimalExcludePaths: ['/introduction', '/confirmation'],
                minimalFooter: true,
                minimalHeader: {
                  title: store.getValue('appName'),
                  subtitle: `${this.sharedProps?.benefitDescription} (VA Form ${this.sharedProps.formNumber})`,
                },
              }
            : {}),
        },
      });

      this.fs.writeJSON(registryFile, registry);
    } catch (error) {
      this.log(chalk.red(`Could not write to ${registryFile}. ${error.message}`));
      throw error;
    }
  }

  end() {
    if (isDryRunMode(this.options)) {
      showTrackedFiles(this, this.allFields);
    }
  }
};

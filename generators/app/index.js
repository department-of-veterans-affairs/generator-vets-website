'use strict';

const fs = require('fs');
const path = require('path');
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const {
  validateAllCliArguments,
  isNonInteractiveMode,
} = require('../../lib/cli-validation');
const { initializeFileTracking } = require('../../lib/fs-tracker');
const { getFieldDefinitions } = require('../../lib/prompts');
const {
  generateOptions,
  initializePropsFromOptions,
} = require('../../lib/generator-config');
const { generatePrompts } = require('../../lib/prompts');
const { calculateSubFolder } = require('../../utils/generator-helpers');
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
const { store } = require('../../lib/store');

// Import strategies
const AppStrategy = require('./strategies/app-strategy');
const FormStrategy = require('./strategies/form-strategy');

/**
 * Unified generator that handles both app and form generation using strategies
 */
module.exports = class extends Generator {
  constructor(args, options) {
    checkNodeCompatibility();
    super(args, options);

    this.allFields = getFieldDefinitions('all');
    this.strategy = null;

    initializeDryRunMode(this.options);
    initializeFileTracking(this);
    generateOptions(this, this.allFields);
  }

  /**
   * Display validation errors and exit
   * @private
   */
  _handleValidationErrors(errors) {
    console.log(chalk.red('\n❌ Validation errors:'));
    errors.forEach((error) => {
      console.log(chalk.red(`  • ${error}`));
    });
    console.log(chalk.red('\nSUMMARY:'));
    console.log(chalk.red('❌ Generator failed due to validation errors'));
    process.exit(1);
  }

  initializing() {
    const tempThis = {
      props: {},
      options: this.options,
    };
    initializePropsFromOptions(tempThis, this.allFields);

    store.setOptions(this.options);
    store.setProps(tempThis.props);

    // Auto-calculate subFolder based on folderName to ensure it's always available in templates
    const folderName = store.getValue('folderName');
    store.setProp('subFolder', folderName ? calculateSubFolder(folderName) : '');

    if (!store.getValue('productId')) {
      store.setProp('productId', uuidv4());
    }

    // Handle backward compatibility: contentLoc -> contentRepoLocation
    // Priority: contentRepoLocation (new) > contentLoc (legacy)
    const contentRepoLocation =
      store.getValue('contentRepoLocation') || store.getValue('contentLoc');
    if (contentRepoLocation) {
      store.setProp('contentRepoLocation', contentRepoLocation);
    }

    normalizeDryRunOptions(this.options);

    if (shouldSkipValidation(this.options)) {
      // If we have isForm in options, we can initialize strategy early
      if (this.options.isForm !== undefined) {
        this.strategy = this._createStrategy(makeBool(this.options.isForm));
      }

      return;
    }

    const cliValidationErrors = validateAllCliArguments(this.options);
    if (cliValidationErrors.length > 0) {
      this._handleValidationErrors(cliValidationErrors);
    }

    store.setProp(
      'isForm',
      this.options.isForm === undefined ? null : makeBool(this.options.isForm),
    );

    if (store.getValue('isForm') !== null) {
      this.strategy = this._createStrategy(store.getValue('isForm'));
    }

    this._validateFields(store);
  }

  prompting() {
    const dryRunResult = handleDryRunPrompting(this, this.allFields);
    if (dryRunResult !== null) {
      return dryRunResult;
    }

    // If non-interactive mode, skip all prompts and validate required fields
    if (isNonInteractiveMode(this.options)) {
      // Validate that all required fields are provided
      const { validateRequiredCliArguments } = require('../../lib/cli-validation');
      const missingFieldErrors = validateRequiredCliArguments(this.options);
      const formatValidationErrors = validateAllCliArguments(this.options);
      const allErrors = [...missingFieldErrors, ...formatValidationErrors];

      if (allErrors.length > 0) {
        this._handleValidationErrors(allErrors);
      }

      // All required fields provided, continue without prompting
      if (!store.getValue('productId')) {
        store.setProp('productId', uuidv4());
      }

      this.strategy = this._createStrategy(store.getValue('isForm'));

      // Process the CLI options to compute derived properties (like formIdConst)
      if (this.strategy && this.strategy.processPromptResults) {
        this.strategy.processPromptResults(this, store);
      }

      return Promise.resolve();
    }

    this.log(yosay(`Welcome to the ${chalk.red('vets-website app')} generator!`));

    this.log(
      `For a guide on using this Yeoman generator, including example answers for each prompt:\n${chalk.cyan(
        'https://depo-platform-documentation.scrollhelp.site/developer-docs/va-gov-application-generator',
      )}\n`,
    );

    const corePrompts = generatePrompts(this, this.allFields, [
      'appName',
      'folderName',
      'entryName',
      'rootUrl',
      'isForm',
      'contentRepoLocation',
      'slackGroup',
    ]);

    return this.prompt(corePrompts).then((coreProps) => {
      const updatedProps = { ...store.getAllProps(), ...coreProps };
      store.setProps(updatedProps);

      this.strategy = this._createStrategy(store.getValue('isForm'));

      const additionalPrompts = this.strategy.getAdditionalPrompts(this, store);

      if (additionalPrompts.length > 0) {
        return this.prompt(additionalPrompts).then((additionalProps) => {
          const finalProps = { ...store.getAllProps(), ...additionalProps };
          store.setProps(finalProps);

          if (!store.getValue('productId')) {
            store.setProp('productId', uuidv4());
          }

          // Let strategy process the results
          this.strategy.processPromptResults(this, store);
        });
      }

      if (!store.getValue('productId')) {
        store.setProp('productId', uuidv4());
      }

      this.strategy.processPromptResults(this, store);
    });
  }

  configuring() {
    if (!isDryRunMode(this.options)) {
      this._updateAllowlist();
    }

    if (this.strategy) {
      this.strategy.configure(this, store);
    }
  }

  writingNewFiles() {
    this._generateSharedFiles(store);

    if (this.strategy) {
      this.strategy.generateFiles(this, store);
    }
  }

  updateRegistry() {
    const contentBuildPath = path.resolve(this.destinationRoot(), '../content-build');
    const registryFile = path.join(contentBuildPath, 'src/applications/registry.json');

    if (isDryRunMode(this.options)) {
      store.trackFile(registryFile);

      if (this.strategy) {
        this.strategy.updateExternalFiles(this, store);
      }

      return;
    }

    if (!isDryRunMode(this.options)) {
      this.log(chalk.blue(`Updating registry file at: ${registryFile}`));
    }

    try {
      let registry;

      try {
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

      const templateType = store.getValue('templateType');
      const registryEntry = {
        appName: store.getValue('appName'),
        entryName: store.getValue('entryName'),
        rootUrl: store.getValue('rootUrl'),
        productId: store.getValue('productId'),
        template:
          templateType === 'FORM_ENGINE'
            ? {
                vagovprod: false,
                title: store.getValue('appName'),
                layout: 'page-react.html',
              }
            : {
                vagovprod: false,
                layout: 'page-react.html',
                ...(store.getValue('usesMinimalHeader')
                  ? {
                      includeBreadcrumbs: false,
                      minimalExcludePaths: ['/introduction', '/confirmation'],
                      minimalFooter: true,
                      minimalHeader: {
                        title: store.getValue('appName'),
                        subtitle: `${store.getValue(
                          'benefitDescription',
                        )} (VA Form ${store.getValue('formNumber')})`,
                      },
                    }
                  : {}),
              },
      };

      registry.push(registryEntry);

      this.fs.writeJSON(registryFile, registry);

      // Let strategy update external files
      if (this.strategy) {
        this.strategy.updateExternalFiles(this, store);
      }
    } catch (error) {
      this.log(chalk.red(`Could not write to ${registryFile}. ${error.message}`));
      throw error;
    }
  }

  end() {
    if (isDryRunMode(this.options)) {
      showTrackedFiles(this, this.allFields);
    } else if (this.strategy) {
      process.nextTick(() => {
        this.log(this.strategy.getCompletionMessage(store));
      });
    }
  }

  /**
   * Create the appropriate strategy based on isForm flag
   * @private
   */
  _createStrategy(isForm) {
    return isForm ? new FormStrategy() : new AppStrategy();
  }

  /**
   * Generate files that are shared between all strategies
   * @private
   */
  _generateSharedFiles(store) {
    // For Form Engine, use special path structure
    const templateType = store.getValue('templateType');
    const appPath =
      templateType === 'FORM_ENGINE'
        ? `src/applications/simple-forms-form-engine/${store.getValue('folderName')}`
        : `src/applications/${store.getValue('folderName')}`;

    const allProps = store.getAllProps();

    this.props = { ...this.props, ...allProps };

    this.fs.copyTpl(
      this.templatePath('shared/manifest.json.ejs'),
      this.destinationPath(`${appPath}/manifest.json`),
      allProps,
    );

    this.fs.copyTpl(
      this.templatePath('shared/app-entry.jsx.ejs'),
      this.destinationPath(`${appPath}/app-entry.jsx`),
      allProps,
    );

    // Use different README template for Form Engine
    const readmeTemplate =
      templateType === 'FORM_ENGINE'
        ? 'shared/README-form-engine.md.ejs'
        : 'shared/README.md.ejs';
    this.fs.copyTpl(
      this.templatePath(readmeTemplate),
      this.destinationPath(`${appPath}/README.md`),
      allProps,
    );
  }

  /**
   * Update allowlist configuration
   * @private
   */
  _updateAllowlist() {
    const configPath = path.join('config', 'changed-apps-build.json');

    try {
      const config = this.fs.readJSON(configPath);
      const isNewApp = !fs.existsSync(
        path.join('src', 'applications', store.getValue('folderName')),
      );

      if (store.getValue('slackGroup') !== 'none' && isNewApp) {
        const appPaths = store.getValue('folderName').split(path.sep);
        const isSingleApp = appPaths.length === 1;

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
      }
    } catch (error) {
      this.log(chalk.red(`Could not write to ${configPath}. ${error}`));
    }
  }

  /**
   * Validate required fields
   * @private
   */
  _validateFields(store) {
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
};

/* eslint-disable no-unused-vars */

/* eslint-disable eqeqeq */

/* eslint-disable no-bitwise */
'use strict';
const fs = require('fs');
const path = require('path');
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const { checkForDuplicates } = require('../../utils/duplicate-detection');
const {
  validateAllCliArguments,
  isNonInteractiveMode,
  validateRequiredCliArguments,
} = require('../../utils/cli-validation');

const defaultContentRepoPath = '../vagov-content';

function hasAccessTo(location) {
  try {
    fs.accessSync(location, fs.constants.F_OK | fs.constants.W_OK);
    return true;
  } catch (e) {
    return false;
  }
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * TODO:
 * - Remove this after upgrading to node 16+
 * - For now Node 14.15 is required, so give a helpful error message if we are not using that.
 */
function checkNodeCompatibilityTemporary() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);

  if (majorVersion !== 14) {
    console.error(
      `${chalk.red('Error:')} Node.js ${nodeVersion} is not supported by this generator.`,
    );
    console.error(
      `${chalk.yellow('Required version:')} Node.js 14.15.0 (use 'nvm use' to switch)`,
    );
    console.error(`${chalk.cyan('Please switch to Node.js 14.15.0 and try again.')}`);
    console.error(
      `${chalk.gray(
        'Note: This restriction will be removed when we upgrade to yeoman-generator 5.10.0+',
      )}`,
    );
    process.exit(1);
  }
}

module.exports = class extends Generator {
  constructor(args, options) {
    // REMOVE: this call when upgrading to yeoman-generator 5.10.0+ for Node.js 22+ support
    checkNodeCompatibilityTemporary();

    super(args, options);

    this.option('appName', {
      type: String,
      required: false,
    });
    this.option('folderName', {
      type: String,
      required: false,
    });
    this.option('entryName', {
      type: String,
      required: false,
    });
    this.option('rootUrl', {
      type: String,
      required: false,
    });
    this.option('slackGroup', {
      type: String,
      required: false,
    });
    // Accepts boolean-like strings, i.e. "N" and "FALSE" => false, "Y" and "TRUE" => true
    this.option('isForm', {
      type: String,
      required: false,
    });
    this.option('contentLoc', {
      type: String,
      required: false,
    });

    // Form-specific options
    this.option('formNumber', {
      type: String,
      required: false,
      description: 'Form number (e.g. "22-0993" or "21P-530")',
    });
    this.option('trackingPrefix', {
      type: String,
      required: false,
      description: 'Google Analytics event prefix',
    });
    this.option('respondentBurden', {
      type: String,
      required: false,
      description: 'Respondent burden in minutes',
    });
    this.option('ombNumber', {
      type: String,
      required: false,
      description: 'OMB control number',
    });
    this.option('expirationDate', {
      type: String,
      required: false,
      description: 'OMB expiration date (M/D/YYYY format)',
    });
    this.option('benefitDescription', {
      type: String,
      required: false,
      description: 'Benefit description',
    });
    this.option('usesVetsJsonSchema', {
      type: Boolean,
      required: false,
      description: 'Whether this form uses vets-json-schema',
    });
    this.option('usesMinimalHeader', {
      type: Boolean,
      required: false,
      description: 'Whether to use minimal header pattern',
    });
    this.option('templateType', {
      type: String,
      required: false,
      description: 'Form template type (WITH_1_PAGE or WITH_4_PAGES)',
    });
  }

  // Validators
  _getDefaultContentRepoLocation() {
    const location = path.join(this.destinationRoot(), defaultContentRepoPath);
    return hasAccessTo(location) ? path.resolve(location) : null;
  }

  _getDefaultSlackGroup() {
    return 'none';
  }

  _getDefaultIsForm() {
    return true;
  }

  _isInvalidFolderName = (folder) =>
    !folder.includes(' ') || 'Folder names should not include spaces';

  _isInvalidEntryName = (entryName) =>
    !entryName.includes(' ') || 'Bundle names should not include spaces';

  _isInvalidSlackGroup = (userGroup) => {
    return userGroup !== 'none' && !userGroup.startsWith('@')
      ? `Slack user groups should begin with an at sign, '@'. Received: ${userGroup}`
      : true;
  };

  // Remove leading and trailing forward slashes
  _folderNameFilter = (folder) => {
    if (folder.startsWith('/')) {
      folder = folder.substring(1);
    }

    if (folder.endsWith('/')) {
      folder = folder.substring(0, -1);
    }

    return folder;
  };

  _rootUrlFilter = (url) => {
    // Add leading slash if needed
    if (!url.startsWith('/')) {
      url = `/${url}`;
    }

    // Add `index` if a page name was not included
    if (url.endsWith('/')) {
      url = `${url}index`;
    }

    return url;
  };

  initializing() {
    this.props = {
      appName: this.options.appName,
      rootUrl: this.options.rootUrl,
      contentRepoLocation: this.options.contentLoc,
      folderName: this.options.folderName,
      entryName: this.options.entryName,
      slackGroup: this.options.slackGroup,
      ...this.options,
    };
    this.sharedProps = {};

    // Validate CLI arguments early to fail fast
    const cliValidationErrors = validateAllCliArguments(this.options);
    if (cliValidationErrors.length > 0) {
      const errorMessage = `CLI validation failed:\n${cliValidationErrors
        .map((err) => `  - ${err}`)
        .join('\n')}`;
      this.emit('error', new Error(errorMessage));
      return;
    }

    // If non-interactive mode is detected, validate that all required arguments are provided
    if (isNonInteractiveMode(this.options)) {
      const missingFieldErrors = validateRequiredCliArguments(this.options);
      if (missingFieldErrors.length > 0) {
        const errorMessage = `Non-interactive mode detected, but required arguments are missing:\n${missingFieldErrors
          .map((err) => `  - ${err}`)
          .join(
            '\n',
          )}\n\nWhen running in non-interactive mode, all required fields must be provided.\nFor interactive mode with prompts, run the generator without providing all arguments upfront.`;
        this.emit('error', new Error(errorMessage));
        return;
      }

      // Set defaults for optional fields in non-interactive mode
      if (typeof this.props.isForm !== 'boolean') {
        this.props.isForm = this._getDefaultIsForm();
      }

      if (!this.props.contentRepoLocation) {
        this.props.contentRepoLocation = this._getDefaultContentRepoLocation();
      }

      if (!this.props.slackGroup) {
        this.props.slackGroup = this._getDefaultSlackGroup();
      }
    }

    const makeBool = (boolLike) => {
      if (typeof boolLike === 'boolean') {
        return boolLike;
      }

      if (typeof boolLike === 'string') {
        switch (boolLike.toUpperCase()) {
          case 'N':
          case 'FALSE':
            return false;
          default:
            return true;
        }
      }

      return true;
    };

    this.props.isForm =
      this.options.isForm === undefined ? null : makeBool(this.options.isForm);

    // Perform validations
    if (this.props.folderName) {
      const badFolder = this._isInvalidFolderName(this.props.folderName);
      if (badFolder !== true) {
        this.emit('error', new Error(badFolder));
      }
    }

    if (this.props.entryName) {
      const badEntryName = this._isInvalidEntryName(this.props.entryName);
      if (badEntryName !== true) {
        this.emit('error', new Error(badEntryName));
      }
    }

    if (this.props.slackGroup) {
      const badSlackGroup = this._isInvalidSlackGroup(this.props.slackGroup);
      if (badSlackGroup !== true) {
        this.emit('error', new Error(badSlackGroup));
      }
    }
  }

  prompting() {
    // Have Yeoman greet the user.
    this.log(yosay(`Welcome to the ${chalk.red('vets-website app')} generator!`));

    this.log(
      `For a guide on using this Yeoman generator, including example answers for each prompt:\n${chalk.cyan(
        'https://depo-platform-documentation.scrollhelp.site/developer-docs/va-gov-application-generator',
      )}\n`,
    );

    const prompts = [
      {
        type: 'input',
        name: 'appName',
        message:
          "What's the name of your application? This will be the default page title. Examples: '21P-530 Burials benefits form' or 'GI Bill School Feedback Tool'",
        default: 'A New Form',
        when: !this.props.appName,
      },
      {
        type: 'input',
        name: 'folderName',
        message:
          "What folder in `src/applications/` should your app live in? This can be a subfolder. Examples: 'burials' or 'edu-benefits/0993'",
        validate: this._isInvalidFolderName,
        filter: this._folderNameFilter,
        default(answers) {
          return answers.appName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        },
        when: !this.props.folderName,
      },
      {
        type: 'input',
        name: 'entryName',
        message:
          "What should be the name of your app's entry bundle? Examples: '0993-edu-benefits' or 'feedback-tool'",
        validate: this._isInvalidEntryName,
        default: (answers) => {
          const folder = this.props.folderName ?? answers.folderName;
          return folder.split('/').pop();
        },
        when: !this.props.entryName,
      },
      {
        type: 'input',
        name: 'rootUrl',
        message:
          "What's the root url for this app? Examples: '/gi-bill-comparison-tool' or '/education/opt-out-information-sharing/opt-out-form-0993'",
        filter: this._rootUrlFilter,
        default: (answers) => {
          const folder = this.props.folderName ?? answers.folderName;
          return `/${folder}`;
        },
        when: !this.props.rootUrl,
      },
      {
        type: 'confirm',
        name: 'isForm',
        message: 'Is this a form app?',
        default: () => this._getDefaultIsForm(),
        // If this prop was set from a command line argument, it will be a boolean at this point, otherwise ask.
        when: typeof this.props.isForm !== 'boolean',
      },
      {
        type: 'input',
        name: 'contentRepoLocation',
        message:
          'Where can I find the vagov-content repo? This path can be absolute or relative to vets-website.',
        default: () => this._getDefaultContentRepoLocation(),
        validate: (repoPath) =>
          hasAccessTo(repoPath) ||
          `Could not find the directory ${path.normalize(repoPath)}`,
        when: !this.props.contentRepoLocation,
      },
      {
        type: 'input',
        name: 'slackGroup',
        message:
          "What Slack user group should be notified for CI failures on the `main` branch? Example: '@vaos-fe-dev'",
        default: () => this._getDefaultSlackGroup(),
        validate: this._isInvalidSlackGroup,
        when: !this.props.slackGroup,
      },
    ];

    return this.prompt(prompts).then((props) => {
      this.props = { ...this.props, ...props };
      this.props.productId = uuidv4();
    });
  }

  _updateAllowlist() {
    const configPath = path.join('config', 'changed-apps-build.json');
    const config = this.fs.readJSON(configPath);
    const isNewApp = !fs.existsSync(
      path.join('src', 'applications', this.props.folderName),
    );

    if (this.props.slackGroup !== 'none' && isNewApp) {
      const appPaths = this.props.folderName.split(path.sep);
      const isSingleApp = appPaths.length === 1;

      try {
        if (isSingleApp) {
          config.apps.push({
            rootFolder: this.props.folderName,
            slackGroup: this.props.slackGroup,
          });
        } else {
          const rootFolder = appPaths[0];
          const existingApp = config.apps.find((app) => app.rootFolder === rootFolder);

          if (!existingApp) {
            config.apps.push({
              rootFolder: appPaths[0],
              slackGroup: this.props.slackGroup,
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
    // This needs to run before writing to the app folder, so we can know if the root folder is new.
    this._updateAllowlist();
  }

  default() {
    const subfolders = Array.from(this.props.folderName).filter((c) => c === '/').length;
    if (subfolders) {
      this.props.subFolder = `${new Array(subfolders).fill('..').join('/')}/`;
    } else {
      this.props.subFolder = '';
    }

    if (this.props.isForm) {
      const formOptions = {
        folderName: this.props.folderName,
        appName: this.props.appName,
        rootUrl: this.props.rootUrl,
        entryName: this.props.entryName,
        sharedProps: this.sharedProps,
        subFolder: this.props.subFolder,
      };

      if (this.props.formNumber) formOptions.formNumber = this.props.formNumber;
      if (this.props.trackingPrefix)
        formOptions.trackingPrefix = this.props.trackingPrefix;
      if (this.props.respondentBurden)
        formOptions.respondentBurden = this.props.respondentBurden;
      if (this.props.ombNumber) formOptions.ombNumber = this.props.ombNumber;
      if (this.props.expirationDate)
        formOptions.expirationDate = this.props.expirationDate;
      if (this.props.benefitDescription)
        formOptions.benefitDescription = this.props.benefitDescription;
      if (this.props.usesVetsJsonSchema !== undefined)
        formOptions.usesVetsJsonSchema = this.props.usesVetsJsonSchema;
      if (this.props.usesMinimalHeader !== undefined)
        formOptions.usesMinimalHeader = this.props.usesMinimalHeader;
      if (this.props.templateType) formOptions.templateType = this.props.templateType;

      this.composeWith(require.resolve('../form'), formOptions);
    }
  }

  writingNewFiles() {
    const rootPath = `src/applications/`;
    const appPath = `${rootPath}${this.props.folderName}`;
    const contentRepoMarkdownCopied = false;

    // Normal vets-website files
    this.fs.copyTpl(
      this.templatePath('manifest.json.ejs'),
      this.destinationPath(`${appPath}/manifest.json`),
      this.props,
    );

    this.fs.copyTpl(
      this.templatePath('app-entry.jsx.ejs'),
      this.destinationPath(`${appPath}/app-entry.jsx`),
      this.props,
    );

    // Non-form files
    if (!this.props.isForm) {
      this.fs.copy(
        this.templatePath('entry.scss'),
        this.destinationPath(`${appPath}/sass/${this.props.entryName}.scss`),
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
        this.destinationPath(`${appPath}/tests/${this.props.entryName}.cypress.spec.js`),
        this.props,
      );
    }

    if (contentRepoMarkdownCopied)
      this.log(yosay("Don't forget to make a pull request for vagov-content!"));
    else
      this.log(
        yosay(
          `Don't forget to make a markdown file in the vagov-content repo at pages${this.props.rootUrl}.md!`,
        ),
      );
  }

  updateRegistry() {
    const contentBuildPath = path.resolve(this.destinationRoot(), '../content-build');
    const registryFile = path.join(contentBuildPath, 'src/applications/registry.json');

    this.log(chalk.blue(`Updating registry file at: ${registryFile}`));

    try {
      let registry;

      try {
        registry = this.fs.readJSON(registryFile);
      } catch (readError) {
        this.log(
          chalk.yellow(`Warning: Could not read ${registryFile}. Creating new registry.`),
        );
        registry = [];
      }

      if (!Array.isArray(registry)) {
        this.log(
          chalk.yellow(
            `Warning: Registry file exists but is not an array. Initializing as empty array.`,
          ),
        );
        registry = [];
      }

      // Check for duplicates using the utility function
      const newApp = {
        appName: this.props.appName,
        entryName: this.props.entryName,
        rootUrl: this.props.rootUrl,
        productId: this.props.productId,
      };
      const duplicates = checkForDuplicates(registry, newApp);

      if (duplicates.length > 0) {
        const errorMessage = `Cannot create application due to duplicate entries in content-build registry:
${duplicates.join('\n')}`;
        this.log(chalk.red(errorMessage));
        throw new Error(errorMessage);
      }

      registry.push({
        appName: this.props.appName,
        entryName: this.props.entryName,
        rootUrl: this.props.rootUrl,
        productId: this.props.productId,
        template: {
          vagovprod: false,
          layout: 'page-react.html',
          ...(this.sharedProps?.usesMinimalHeader
            ? {
                includeBreadcrumbs: false,
                minimalExcludePaths: ['/introduction', '/confirmation'],
                minimalFooter: true,
                minimalHeader: {
                  title: this.props.appName,
                  subtitle: `${this.sharedProps?.benefitDescription} (VA Form ${this.sharedProps.formNumber})`,
                },
              }
            : {}),
        },
      });
      this.fs.writeJSON(registryFile, registry);
    } catch (error) {
      this.log(chalk.red(`Could not write to ${registryFile}. ${error.message}`));
      throw error; // Re-throw to stop the generator
    }
  }
};

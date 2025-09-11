'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const { isNonInteractiveMode } = require('../../utils/cli-validation');
const TEMPLATE_TYPES = {
  WITH_1_PAGE: 'WITH_1_PAGE',
  WITH_4_PAGES: 'WITH_4_PAGES',
  FORM_ENGINE: 'FORM_ENGINE',
};

/**
 * Helper that returns the last day of next year
 * of M/D/YYYY
 * 12/31/2019
 */
function getDate() {
  const now = new Date();
  const year = now.getFullYear() + 1;
  return `12/31/${year}`;
}

module.exports = class extends Generator {
  constructor(args, options) {
    super(args, options);

    // Define all form options that can be passed via command line
    this.option('formNumber', {
      type: String,
      required: false,
      description: "Form number (e.g. '22-0993' or '21P-530')",
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

  _getDefaultTrackingPrefix() {
    return `${this.props.entryName || 'app'}-`;
  }

  _getDefaultRespondentBurden() {
    return '30';
  }

  _getDefaultExpirationDate() {
    return getDate();
  }

  _getDefaultBenefitDescription() {
    return 'benefits';
  }

  _getDefaultUsesVetsJsonSchema() {
    return false;
  }

  _getDefaultUsesMinimalHeader() {
    return true;
  }

  _getDefaultTemplateType() {
    return TEMPLATE_TYPES.WITH_4_PAGES;
  }

  initializing() {
    this.props = { ...this.options };

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

      return boolLike;
    };

    if (this.props.usesVetsJsonSchema !== undefined) {
      this.props.usesVetsJsonSchema = makeBool(this.props.usesVetsJsonSchema);
    }

    if (this.props.usesMinimalHeader !== undefined) {
      this.props.usesMinimalHeader = makeBool(this.props.usesMinimalHeader);
    }

    if (this.props.formNumber) {
      this.props.formNumber = this.props.formNumber.replace(/\s|_/g, '-').toUpperCase();
      this.props.formIdConst = `FORM_${this.props.formNumber.replace(/-/g, '_')}`;
    }

    // Only set defaults in non-interactive mode
    const shouldSetDefaults =
      !this.options.sharedProps && isNonInteractiveMode(this.options);

    if (shouldSetDefaults) {
      if (!this.props.trackingPrefix) {
        this.props.trackingPrefix = this._getDefaultTrackingPrefix();
      }

      if (!this.props.respondentBurden) {
        this.props.respondentBurden = this._getDefaultRespondentBurden();
      }

      if (!this.props.expirationDate) {
        this.props.expirationDate = this._getDefaultExpirationDate();
      }

      if (!this.props.benefitDescription) {
        this.props.benefitDescription = this._getDefaultBenefitDescription();
      }

      if (this.props.usesVetsJsonSchema === undefined) {
        this.props.usesVetsJsonSchema = this._getDefaultUsesVetsJsonSchema();
      }

      if (this.props.usesMinimalHeader === undefined) {
        this.props.usesMinimalHeader = this._getDefaultUsesMinimalHeader();
      }

      if (!this.props.templateType) {
        this.props.templateType = this._getDefaultTemplateType();
      }
    }
  }

  prompting() {
    const prompts = [
      {
        type: 'input',
        name: 'formNumber',
        message: "What's your form number? Examples: '22-0993' or '21P-530'",
        // 1. Replace spaces and underscores with dashes
        // 2. Convert to uppercase
        filter(val) {
          return val.replace(/\s|_/g, '-').toUpperCase();
        },
        validate(input) {
          if (input.trim() === '') {
            return 'Form number is required';
          }

          if (input.match(/['"]/)) {
            return 'Form number cannot contain quotes';
          }

          return true;
        },
        when: !this.props.formNumber,
      },
      {
        type: 'input',
        name: 'trackingPrefix',
        message:
          "What's the Google Analytics event prefix that you want to use? Examples: 'burials-530-' or 'edu-0993-'",
        default: () => this._getDefaultTrackingPrefix(),
        when: !this.props.trackingPrefix,
      },
      {
        type: 'input',
        name: 'respondentBurden',
        message: "What's the respondent burden of this form in minutes?",
        default: () => this._getDefaultRespondentBurden(),
        when: !this.props.respondentBurden,
      },
      {
        type: 'input',
        name: 'ombNumber',
        message: "What's the OMB control number for this form? Example: '2900-0797'",
        when: !this.props.ombNumber,
      },
      {
        type: 'input',
        name: 'expirationDate',
        message:
          "What's the OMB expiration date (in M/D/YYYY format) for this form? Example: '1/31/2019'",
        default: () => this._getDefaultExpirationDate(),
        when: !this.props.expirationDate,
      },
      {
        type: 'input',
        name: 'benefitDescription',
        message:
          "What's the benefit description for this form? Examples: 'education benefits' or 'disability claims increase'",
        default: () => this._getDefaultBenefitDescription(),
        when: !this.props.benefitDescription,
      },
      {
        type: 'confirm',
        name: 'usesVetsJsonSchema',
        message:
          'Does this form use vets-json-schema? (JSON schemas defined in separate repository)',
        default: () => this._getDefaultUsesVetsJsonSchema(),
        when: (props) =>
          this.props.usesVetsJsonSchema === undefined &&
          (this.props.formNumber || props.formNumber),
      },
      {
        type: 'confirm',
        name: 'usesMinimalHeader',
        message: 'Use minimal header (minimal form flow) pattern?',
        default: () => this._getDefaultUsesMinimalHeader(),
        when: () => this.props.usesMinimalHeader === undefined,
      },
      {
        type: 'list',
        name: 'templateType',
        message: 'Which form template would you like to start with?',
        choices: [
          `${TEMPLATE_TYPES.WITH_1_PAGE}: A form with 1 page - name and date of birth`,
          `${TEMPLATE_TYPES.WITH_4_PAGES}: A form with 4 pages - name and date of birth, identification information, mailing address, and phone and email`,
          `${TEMPLATE_TYPES.FORM_ENGINE}: A form from Drupal using the shared Form Engine`,
        ],
        filter: (choice) => choice.split(':')[0],
        default: () => this._getDefaultTemplateType(),
        when: !this.props.templateType,
      },
    ];

    return this.prompt(prompts).then((props) => {
      // Store the values from prompts, preserving CLI options and config precedence
      this.props = { ...this.props, ...props };
      this.props.formIdConst = `FORM_${this.props.formNumber.replace(/-/g, '_')}`;

      if (this.options.sharedProps) {
        // Update these so that app/index.js can have access to them
        this.options.sharedProps.usesMinimalHeader = this.props.usesMinimalHeader;
        this.options.sharedProps.benefitDescription = this.props.benefitDescription;
        this.options.sharedProps.formNumber = this.props.formNumber;
      }
    });
  }

  writing() {
    const appPath = `src/applications/${this.props.folderName}`;

    if (
      this.props.templateType === TEMPLATE_TYPES.WITH_1_PAGE ||
      this.props.templateType === TEMPLATE_TYPES.WITH_4_PAGES
    ) {
      this.fs.copyTpl(
        this.templatePath('entry.scss.ejs'),
        this.destinationPath(`${appPath}/sass/${this.props.entryName}.scss`),
        this.props,
      );

      this.fs.copyTpl(
        this.templatePath('reducer.js.ejs'),
        this.destinationPath(`${appPath}/reducers/index.js`),
        this.props,
      );

      this.fs.copyTpl(
        this.templatePath('App.jsx.ejs'),
        this.destinationPath(`${appPath}/containers/App.jsx`),
        this.props,
      );

      this.fs.copyTpl(
        this.templatePath('routes.jsx.ejs'),
        this.destinationPath(`${appPath}/routes.jsx`),
        this.props,
      );

      // Copy static test files (containers, fixtures that don't need templating)
      this.fs.copy(
        this.templatePath('tests/containers'),
        this.destinationPath(`${appPath}/tests/containers`),
      );

      this.fs.copy(
        this.templatePath('tests/fixtures/mocks/application-submit.json'),
        this.destinationPath(`${appPath}/tests/fixtures/mocks/application-submit.json`),
      );

      this.fs.copy(
        this.templatePath('tests/fixtures/mocks/local-mock-responses.js'),
        this.destinationPath(`${appPath}/tests/fixtures/mocks/local-mock-responses.js`),
      );

      this.fs.copy(
        this.templatePath('tests/fixtures/mocks/user.json'),
        this.destinationPath(`${appPath}/tests/fixtures/mocks/user.json`),
      );

      // Copy E2E test
      this.fs.copyTpl(
        this.templatePath('tests/e2e/<%= formNumber %>.cypress.spec.js.ejs'),
        this.destinationPath(
          `${appPath}/tests/e2e/${this.props.entryName}.cypress.spec.js`,
        ),
        this.props,
      );

      // Copy feature toggles mock
      this.fs.copyTpl(
        this.templatePath('tests/fixtures/mocks/feature-toggles.json.ejs'),
        this.destinationPath(`${appPath}/tests/fixtures/mocks/feature-toggles.json`),
        this.props,
      );

      // Copy test data files
      this.fs.copyTpl(
        this.templatePath('tests/fixtures/data/minimal-test.json.ejs'),
        this.destinationPath(`${appPath}/tests/fixtures/data/minimal-test.json`),
        this.props,
      );

      this.fs.copyTpl(
        this.templatePath('tests/fixtures/data/maximal-test.json.ejs'),
        this.destinationPath(`${appPath}/tests/fixtures/data/maximal-test.json`),
        this.props,
      );

      // Copy page tests - always include nameAndDateOfBirth since it exists in all templates
      this.fs.copy(
        this.templatePath('tests/pages/nameAndDateOfBirth.unit.spec.jsx'),
        this.destinationPath(`${appPath}/tests/pages/nameAndDateOfBirth.unit.spec.jsx`),
      );

      this.fs.copyTpl(
        this.templatePath('IntroductionPage.jsx.ejs'),
        this.destinationPath(`${appPath}/containers/IntroductionPage.jsx`),
        this.props,
      );

      this.fs.copyTpl(
        this.templatePath('ConfirmationPage.jsx.ejs'),
        this.destinationPath(`${appPath}/containers/ConfirmationPage.jsx`),
        this.props,
      );

      this.fs.copyTpl(
        this.templatePath('pages/nameAndDateOfBirth.js.ejs'),
        this.destinationPath(`${appPath}/pages/nameAndDateOfBirth.js`),
        this.props,
      );

      this.fs.copyTpl(
        this.templatePath('constants.js.ejs'),
        this.destinationPath(`${appPath}/constants.js`),
        this.props,
      );

      this.fs.copyTpl(
        this.templatePath('form.js.ejs'),
        this.destinationPath(`${appPath}/config/form.js`),
        this.props,
      );
    }

    if (this.props.templateType === TEMPLATE_TYPES.WITH_4_PAGES) {
      this.fs.copyTpl(
        this.templatePath('pages/identificationInformation.js.ejs'),
        this.destinationPath(`${appPath}/pages/identificationInformation.js`),
        this.props,
      );

      this.fs.copyTpl(
        this.templatePath('pages/mailingAddress.js.ejs'),
        this.destinationPath(`${appPath}/pages/mailingAddress.js`),
        this.props,
      );

      this.fs.copyTpl(
        this.templatePath('pages/phoneAndEmailAddress.js.ejs'),
        this.destinationPath(`${appPath}/pages/phoneAndEmailAddress.js`),
        this.props,
      );

      // Copy additional page tests for 4-page template
      this.fs.copy(
        this.templatePath('tests/pages/identificationInformation.unit.spec.jsx'),
        this.destinationPath(
          `${appPath}/tests/pages/identificationInformation.unit.spec.jsx`,
        ),
      );

      this.fs.copy(
        this.templatePath('tests/pages/mailingAddress.unit.spec.jsx'),
        this.destinationPath(`${appPath}/tests/pages/mailingAddress.unit.spec.jsx`),
      );

      this.fs.copy(
        this.templatePath('tests/pages/phoneAndEmailAddress.unit.spec.jsx'),
        this.destinationPath(`${appPath}/tests/pages/phoneAndEmailAddress.unit.spec.jsx`),
      );
    }

    if (this.props.templateType === TEMPLATE_TYPES.FORM_ENGINE) {
      this.fs.copyTpl(
        this.templatePath('formEngine.js.ejs'),
        this.destinationPath(`${appPath}/app-entry.jsx`),
        this.props,
      );
    }

    this.regexFileReplacements();
  }

  regexFileReplacements() {
    const tryUpdateRegexInFile = (filePath, regex, newEntry, detailMessage) => {
      const content = this.fs.read(filePath);

      try {
        const updatedContent = content.replace(
          regex,
          (match, start, arrayContent, end) => {
            if (arrayContent.includes(newEntry)) {
              return match;
            }

            return `${start}${arrayContent.trimEnd()}\n${newEntry}\n${end}`;
          },
        );

        this.fs.write(filePath, updatedContent);
      } catch {
        this.log(chalk.yellow(`Could not write to ${filePath}. ${detailMessage}`));
      }
    };

    const updateMissingJsonSchema = () => {
      if (!this.props.usesVetsJsonSchema) {
        const filePath =
          './src/platform/forms/tests/forms-config-validator.unit.spec.jsx';
        const regex = /(const missingFromVetsJsonSchema = \[)([\s\S]*?)(\];)/;
        const newEntry = `  VA_FORM_IDS.${this.props.formIdConst},`;
        tryUpdateRegexInFile(
          filePath,
          regex,
          newEntry,
          'Trying to update missingFromVetsJsonSchema.',
        );
      }
    };

    updateMissingJsonSchema();

    if (this.props.formNumber) {
      const filePath = './src/platform/forms/constants.js';
      let regex = /(export const VA_FORM_IDS = Object\.freeze\({)([\s\S]*?)(}\))/;
      let newEntry = `  ${this.props.formIdConst}: '${this.props.formNumber}',`;
      let detail = 'Trying to update VA_FORM_IDS.';
      tryUpdateRegexInFile(filePath, regex, newEntry, detail);

      regex = /(export const FORM_BENEFITS = {)([\s\S]*?)(};)/;
      newEntry = `  [VA_FORM_IDS.${this.props.formIdConst}]: '${this.props.benefitDescription}',`;
      detail = 'Trying to update FORM_BENEFITS.';
      tryUpdateRegexInFile(filePath, regex, newEntry, detail);

      regex = /(export const TRACKING_PREFIXES = {)([\s\S]*?)(};)/;
      newEntry = `  [VA_FORM_IDS.${this.props.formIdConst}]: '${this.props.trackingPrefix}',`;
      detail = 'Trying to update TRACKING_PREFIXES.';
      tryUpdateRegexInFile(filePath, regex, newEntry, detail);

      regex = /(export const SIP_ENABLED_FORMS = new Set\(\[)([\s\S]*?)(]\);)/;
      newEntry = `  VA_FORM_IDS.${this.props.formIdConst},`;
      detail = 'Trying to update SIP_ENABLED_FORMS.';
      tryUpdateRegexInFile(filePath, regex, newEntry, detail);

      regex = /(export const getAllFormLinks = [\s\S]*?return {)([\s\S]*?)( {2}};)/;
      newEntry = `    [VA_FORM_IDS.${this.props.formIdConst}]: \`\${tryGetAppUrl('${this.props.formNumber}')}/\`,`;
      detail = 'Trying to update getAllFormLinks.';
      tryUpdateRegexInFile(filePath, regex, newEntry, detail);

      regex = /(export const MY_VA_SIP_FORMS = \[)([\s\S]*?)(];)/;
      newEntry =
        `  {\n` +
        `    id: VA_FORM_IDS.${this.props.formIdConst},\n` +
        `    benefit: '${this.props.benefitDescription}',\n` +
        `    title: '${this.props.appName}',\n` +
        `    description: '${this.props.benefitDescription}',\n` +
        `    trackingPrefix: '${this.props.trackingPrefix}',\n` +
        `  },`;
      detail = 'Trying to update MY_VA_SIP_FORMS.';
      tryUpdateRegexInFile(filePath, regex, newEntry, detail);
    }
  }

  end() {
    process.nextTick(() => {
      this.log('------------------------------------');
      this.log(chalk.bold('Next Steps for Deployment:'));
      this.log('Create and merge PRs in the following order:');
      if (this.props.usesVetsJsonSchema) {
        this.log(chalk.bold('1.') + ' ' + chalk.cyan('../vets-json-schema'));
        this.log(chalk.bold('2.') + ' ' + chalk.cyan('vets-website'));
        this.log(chalk.bold('3.') + ' ' + chalk.cyan('../content-build'));
      } else {
        this.log(chalk.bold('1.') + ' ' + chalk.cyan('vets-website'));
        this.log(chalk.bold('2.') + ' ' + chalk.cyan('../content-build'));
      }

      this.log(
        chalk.yellow('Note:') +
          ' Cypress tests disabled in CI. Re-enable after content-build is deployed',
      );

      this.log('');
      this.log('------------------------------------');
      this.log(chalk.bold('Development Commands:'));
      this.log(
        chalk.bold(`Site:      `) +
          chalk.cyan(`http://localhost:3001${this.props.rootUrl}`),
      );
      this.log(
        chalk.bold(`Watch:     `) +
          chalk.cyan(`yarn watch --env entry=${this.props.entryName}`),
      );
      this.log(
        chalk.bold(`Mock API:  `) +
          chalk.cyan(
            `yarn mock-api --responses src/applications/${this.props.folderName}/tests/fixtures/mocks/local-mock-responses.js`,
          ),
      );
      this.log(
        chalk.bold(`Unit test: `) +
          chalk.cyan(
            `yarn test:unit --app-folder ${this.props.folderName} --log-level all`,
          ),
      );
      this.log(
        chalk.bold(`Cypress:   `) +
          chalk.cyan(
            `yarn cy:run --spec "src/applications/${this.props.folderName}/tests/e2e/${this.props.entryName}.cypress.spec.js"`,
          ),
      );
      this.log('------------------------------------');
    });
  }
};

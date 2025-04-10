'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
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
      },
      {
        type: 'input',
        name: 'trackingPrefix',
        message:
          "What's the Google Analytics event prefix that you want to use? Examples: 'burials-530-' or 'edu-0993-'",
        default: `${this.options.entryName}-`,
      },
      {
        type: 'input',
        name: 'respondentBurden',
        message: "What's the respondent burden of this form in minutes?",
        default: '30',
      },
      {
        type: 'input',
        name: 'ombNumber',
        message: "What's the OMB control number for this form? Example: '2900-0797'",
      },
      {
        type: 'input',
        name: 'expirationDate',
        message:
          "What's the OMB expiration date (in M/D/YYYY format) for this form? Example: '1/31/2019'",
        default: getDate,
      },
      {
        type: 'input',
        name: 'benefitDescription',
        message:
          "What's the benefit description for this form? Examples: 'education benefits' or 'disability claims increase'",
        default: `benefits`,
      },
      {
        type: 'confirm',
        name: 'usesVetsJsonSchema',
        message:
          'Does this form use vets-json-schema? (JSON schemas defined in separate repository)',
        default: false,
        when: (props) => props.formNumber,
      },
      {
        type: 'confirm',
        name: 'usesMinimalHeader',
        message: 'Use minimal header (minimal form flow) pattern?',
        default: false,
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
      },
    ];

    return this.prompt(prompts).then((props) => {
      this.props = { ...this.options, ...props };
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

      this.fs.copy(this.templatePath('tests'), this.destinationPath(`${appPath}/tests`));

      this.fs.copyTpl(
        this.templatePath('cypress.spec.js.ejs'),
        this.destinationPath(`${appPath}/tests/${this.props.entryName}.cypress.spec.js`),
        this.props,
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
      this.log(chalk.bold('Commands:'));
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
      this.log('------------------------------------');
    });
  }
};

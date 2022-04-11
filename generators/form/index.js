'use strict';
const Generator = require('yeoman-generator');

const TEMPLATE_TYPES = {
  BLANK: 'BLANK',
  SIMPLE: 'SIMPLE',
  COMPLEX: 'COMPLEX',
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
        filter: val => {
          return val.replace(/\s|_/g, '-').toUpperCase();
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
        type: 'list',
        name: 'templateType',
        message: 'Which form template would you like to start with?',
        choices: [
          `${TEMPLATE_TYPES.BLANK}: A form without any fields`,
          `${TEMPLATE_TYPES.SIMPLE}: A single-chapter form with a single field`,
          `${TEMPLATE_TYPES.COMPLEX}: A complex, multi-chapter form with multiple fields`,
        ],
        filter: choice => choice.split(':')[0],
      },
    ];

    return this.prompt(prompts).then(props => {
      this.props = Object.assign({}, this.options, props);
    });
  }

  writing() {
    const appPath = `src/applications/${this.props.folderName}`;

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
      // TODO: change the name of App.jsx to something like a ClassCase version of `${this.props.entryName}App.jsx`?
      this.destinationPath(`${appPath}/containers/App.jsx`),
      this.props,
    );

    this.fs.copyTpl(
      this.templatePath('routes.jsx.ejs'),
      this.destinationPath(`${appPath}/routes.jsx`),
      this.props,
    );

    this.fs.copyTpl(
      this.templatePath('test-data.json.ejs'),
      this.destinationPath(`${appPath}/tests/fixtures/data/test-data.json`),
      this.props,
    );

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

    switch (this.props.templateType) {
      case TEMPLATE_TYPES.BLANK:
        this.fs.copyTpl(
          this.templatePath('formBlank.js.ejs'),
          this.destinationPath(`${appPath}/config/form.js`),
          this.props,
        );
        break;
      case TEMPLATE_TYPES.SIMPLE:
        this.fs.copyTpl(
          this.templatePath('formSimple.js.ejs'),
          this.destinationPath(`${appPath}/config/form.js`),
          this.props,
        );
        break;
      case TEMPLATE_TYPES.COMPLEX:
        this.fs.copyTpl(
          this.templatePath('formComplex.js.ejs'),
          this.destinationPath(`${appPath}/config/form.js`),
          this.props,
        );
        this.fs.copyTpl(
          this.templatePath('complex-form-schema.json.ejs'),
          this.destinationPath(`${appPath}/${this.props.formNumber}-schema.json`),
          this.props,
        );
        this.fs.copyTpl(
          this.templatePath('toursOfDuty.js.ejs'),
          this.destinationPath(`${appPath}/definitions/toursOfDuty.js`),
          this.props,
        );
        this.fs.copyTpl(
          this.templatePath('pageDirectDeposit.js.ejs'),
          this.destinationPath(`${appPath}/pages/directDeposit.js`),
          this.props,
        );
        this.fs.copyTpl(
          this.templatePath('pageServiceHistory.js.ejs'),
          this.destinationPath(`${appPath}/pages/serviceHistory.js`),
          this.props,
        );
        break;
      default:
        break;
    }
  }
};

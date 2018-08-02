'use strict';
const Generator = require('yeoman-generator');

/**
 * Helper that returns a date one year from today in the dumb standard USA style
 * of M/D/YYYY
 * 8/3/2019
 */
function getDate() {
  const now = new Date();
  const month = now.getMonth();
  const date = now.getDate();
  const year = now.getFullYear() + 1;
  return `${month}/${date}/${year}`;
}

module.exports = class extends Generator {
  prompting() {
    const prompts = [
      {
        type: 'input',
        name: 'formNumber',
        message: "What's your form number?",
        default: 'XX-230'
      },
      {
        type: 'input',
        name: 'trackingPrefix',
        message: "What's the Google Analytics event prefix you want to use?",
        default: `${this.options.folderName}-`
      },
      {
        type: 'input',
        name: 'respondentBurden',
        message: "What's the respondent burden of this form in minutes?",
        default: '30'
      },
      {
        type: 'input',
        name: 'ombNumber',
        message: "What's the OMB control number for this form?",
        default: answers => answers.formNumber
      },
      {
        type: 'input',
        name: 'expirationDate',
        message: "What's the OMB expiration date for this form?",
        default: getDate
      },
      {
        type: 'input',
        name: 'benefitDescription',
        message: "What's the benefit description for this form?",
        default: `${this.options.appName} Benefits`
      }
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
      this.props
    );

    this.fs.copyTpl(
      this.templatePath('reducer.js.ejs'),
      this.destinationPath(`${appPath}/reducers/index.js`),
      this.props
    );
    this.fs.copyTpl(
      this.templatePath('App.jsx.ejs'),
      // TODO: change the name of App.jsx to something like a ClassCase version of `${this.props.entryName}App.jsx`?
      this.destinationPath(`${appPath}/containers/App.jsx`),
      this.props
    );
    this.fs.copyTpl(
      this.templatePath('routes.jsx.ejs'),
      this.destinationPath(`${appPath}/routes.jsx`),
      this.props
    );
    this.fs.copyTpl(
      this.templatePath('form.js.ejs'),
      this.destinationPath(`${appPath}/config/form.js`),
      this.props
    );
    this.fs.copyTpl(
      this.templatePath('IntroductionPage.jsx.ejs'),
      this.destinationPath(`${appPath}/containers/IntroductionPage.jsx`),
      this.props
    );
    this.fs.copyTpl(
      this.templatePath('ConfirmationPage.jsx.ejs'),
      this.destinationPath(`${appPath}/containers/ConfirmationPage.jsx`),
      this.props
    );
  }
};

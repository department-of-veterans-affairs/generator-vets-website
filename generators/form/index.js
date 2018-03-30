'use strict';
const Generator = require('yeoman-generator');

module.exports = class extends Generator {
  prompting() {
    const prompts = [
      {
        type: 'input',
        name: 'formNumber',
        message: "What's your form number?"
      },
      {
        type: 'input',
        name: 'trackingPrefix',
        message: "What's the Google Analytics event prefix you want to use?"
      },
      {
        type: 'input',
        name: 'respondentBurden',
        message: "What's the respondent burden of this form in minutes?"
      },
      {
        type: 'input',
        name: 'ombNumber',
        message: "What's the OMB control number for this form?"
      },
      {
        type: 'input',
        name: 'expirationDate',
        message: "What's the OMB expiration date for this form?"
      },
      {
        type: 'input',
        name: 'benefitDescription',
        message:
          "What's the benefit description for this form? Something like 'health care benefits'"
      }
    ];

    return this.prompt(prompts).then(props => {
      this.props = Object.assign({}, this.options, props);
    });
  }

  writing() {
    const appPath = `src/js/${this.props.folderName}`;

    this.fs.copy(
      this.templatePath('entry.scss'),
      this.destinationPath(`src/sass/${this.props.entryName}.scss`)
    );

    this.fs.copyTpl(
      this.templatePath('reducer.js.ejs'),
      this.destinationPath(`${appPath}/reducers/index.js`),
      this.props
    );
    this.fs.copyTpl(
      this.templatePath('App.jsx.ejs'),
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

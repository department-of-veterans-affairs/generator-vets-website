'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');

module.exports = class extends Generator {
  prompting() {
    // Have Yeoman greet the user.
    this.log(yosay(`Welcome to the ${chalk.red('vets-website')} generator!`));
    this.log(
      `A guide for using this Yeoman generator, including example answers for each prompt, can be found at:\n${chalk.cyan(
        'https://github.com/department-of-veterans-affairs/vets-website/blob/master/docs/GeneratorOptions.md',
      )}\n`,
    );
    this.log(
      `'Tutorial - Creating Your First Form' can be found at:\n${chalk.cyan(
        'https://department-of-veterans-affairs.github.io/va-digital-services-platform-docs/docs/vets-developer-docs/vets-website/forms/form-tutorial.html',
      )}\n`,
    );

    const prompts = [
      {
        type: 'input',
        name: 'appName',
        message:
          "What's the name of your application? This will be the default page title. Examples: '21P-530 Burials benefits form' or 'GI Bill School Feedback Tool'",
        default: 'A New Form',
      },
      {
        type: 'input',
        name: 'folderName',
        message:
          "What folder in `src/applications/` should your app live in? This can be a subfolder. Examples: 'burials' or 'edu-benefits/0993'",
        validate: folder => {
          if (!folder.includes(' ')) {
            return true;
          }

          return 'Folder names should not include spaces';
        },
        // Remove leading and trailing forward slashes
        filter: val => {
          if (val.startsWith('/')) {
            val = val.substring(1);
          }
          if (val.endsWith('/')) {
            val = val.substring(0, -1);
          }
          return val;
        },
        default: 'new-form',
      },
      {
        type: 'input',
        name: 'entryName',
        message:
          "What should be the name of your app's entry bundle? Examples: '0993-edu-benefits' or 'complaint-tool'",
        validate: name => {
          if (!name.includes(' ')) {
            return true;
          }

          return 'Bundle names should not include spaces';
        },
        default: answers => answers.folderName.split('/').pop(),
      },
      {
        type: 'input',
        name: 'rootUrl',
        message:
          "What's the root url for this app? Examples: '/gi-bill-comparison-tool/' or '/education/opt-out-information-sharing/opt-out-form-0993'",
        filter: val => {
          // Add leading slash if needed
          if (!val.startsWith('/')) {
            val = `/${val}`;
          }
          // Add `index` if a page name was not included
          if (val.endsWith('/')) {
            val = `${val}index`;
          }
          return val;
        },
        default: answers => `/${answers.folderName}`,
      },
      {
        type: 'confirm',
        name: 'isForm',
        message: 'Is this a form app?',
        default: false,
      },
    ];

    return this.prompt(prompts).then(props => {
      this.props = props;
    });
  }

  default() {
    const subfolders = Array.from(this.props.folderName).filter(c => c === '/').length;
    if (subfolders) {
      this.props.subFolder = `${new Array(subfolders).fill('..').join('/')}/`;
    } else {
      this.props.subFolder = '';
    }

    if (this.props.isForm) {
      this.composeWith(require.resolve('../form'), {
        folderName: this.props.folderName,
        appName: this.props.appName,
        entryName: this.props.entryName,
        subFolder: this.props.subFolder,
      });
    }
  }

  writing() {
    const rootPath = `src/applications/`;
    const appPath = `${rootPath}${this.props.folderName}`;

    this.fs.copyTpl(
      this.templatePath('manifest.json.ejs'),
      this.destinationPath(`${appPath}/manifest.json`),
      this.props,
    );
    this.fs.copyTpl(
      this.templatePath('index.md.ejs'),
      this.destinationPath(`content/pages${this.props.rootUrl}.md`),
      this.props,
    );
    this.fs.copyTpl(
      this.templatePath('e2e.spec.js.ejs'),
      this.destinationPath(`${appPath}/tests/00.${this.props.entryName}.e2e.spec.js`),
      this.props,
    );
    this.fs.copyTpl(
      this.templatePath('app-entry.jsx.ejs'),
      this.destinationPath(`${appPath}/app-entry.jsx`),
      this.props,
    );

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
    }
  }
};

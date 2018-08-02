'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const camelCase = require('camelcase');

module.exports = class extends Generator {
  prompting() {
    // Have Yeoman greet the user.
    this.log(yosay(`Welcome to the ${chalk.red('vets-website')} generator!`));

    const prompts = [
      {
        type: 'input',
        name: 'appName',
        message:
          "What's the name of your application? This will be the default page title.",
        default: 'A New Form'
      },
      {
        type: 'input',
        name: 'folderName',
        message:
          'What folder in `src/applications/` should your app live in? This can be a subfolder.',
        validate: folder => {
          if (!folder.includes(' ')) {
            return true;
          }

          return 'Folder names should not include spaces';
        },
        default: 'new-form'
      },
      {
        type: 'input',
        name: 'entryName',
        message: "What should be the name of your app's entry bundle?",
        validate: name => {
          if (!name.includes(' ')) {
            return true;
          }

          return 'Bundle names should not include spaces';
        },
        default: answers => camelCase(answers.folderName)
      },
      {
        type: 'input',
        name: 'rootUrl',
        message: "What's the root url for this app?",
        validate: url => {
          if (url.startsWith('/') && !url.endsWith('/')) {
            return true;
          }

          return 'Urls should start with a / and not end with one';
        },
        default: answers => `/${answers.folderName}`
      },
      {
        type: 'confirm',
        name: 'isForm',
        message: 'Is this a form app?',
        default: false
      }
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
        subFolder: this.props.subFolder
      });
    }
  }

  writing() {
    const rootPath = `src/applications/`;
    const appPath = `${rootPath}${this.props.folderName}`;

    this.fs.copyTpl(
      this.templatePath('manifest.json.ejs'),
      this.destinationPath(`${appPath}/manifest.json`),
      this.props
    );
    this.fs.copyTpl(
      this.templatePath('index.md.ejs'),
      this.destinationPath(`content/pages${this.props.rootUrl}.md`),
      this.props
    );
    this.fs.copyTpl(
      this.templatePath('e2e.spec.js.ejs'),
      this.destinationPath(`${appPath}/tests/00.${this.props.entryName}.e2e.spec.js`),
      this.props
    );
    this.fs.copyTpl(
      this.templatePath('app-entry.jsx.ejs'),
      this.destinationPath(`${appPath}/app-entry.jsx`),
      this.props
    );

    if (!this.props.isForm) {
      this.fs.copy(
        this.templatePath('entry.scss'),
        this.destinationPath(`${appPath}/sass/${this.props.entryName}.scss`)
      );

      this.fs.copy(
        this.templatePath('reducer.js'),
        this.destinationPath(`${appPath}/reducers/index.js`)
      );
      this.fs.copy(
        this.templatePath('App.jsx'),
        this.destinationPath(`${appPath}/containers/App.jsx`)
      );
      this.fs.copy(
        this.templatePath('routes.jsx'),
        this.destinationPath(`${appPath}/routes.jsx`)
      );
    }
  }
};

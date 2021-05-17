'use strict';
const fs = require('fs');
const path = require('path');
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');

const defaultContentRepoPath = '../vagov-content';

function hasAccessTo(location) {
  try {
    fs.accessSync(location, fs.constants.F_OK | fs.constants.W_OK);
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = class extends Generator {
  prompting() {
    // Have Yeoman greet the user.
    this.log(yosay(`Welcome to the ${chalk.red('vets-website app')} generator!`));

    this.log(
      `For a guide on using this Yeoman generator, including example answers for each prompt:\n${chalk.cyan(
        'https://department-of-veterans-affairs.github.io/veteran-facing-services-tools/platform/tools/generator/',
      )}\n`,
    );

    this.log(
      `To follow a basic tutorial on creating and modifying a form application:\n${chalk.cyan(
        'https://department-of-veterans-affairs.github.io/veteran-facing-services-tools/forms/form-tutorial-basic',
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
          "What should be the name of your app's entry bundle? Examples: '0993-edu-benefits' or 'feedback-tool'",
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
          "What's the root url for this app? Examples: '/gi-bill-comparison-tool' or '/education/opt-out-information-sharing/opt-out-form-0993'",
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
      {
        type: 'input',
        name: 'contentRepoLocation',
        message:
          'Where can I find the vagov-content repo? This path can be absolute or relative to vets-website.',
        default: () => {
          const location = path.join(this.destinationRoot(), defaultContentRepoPath);
          return hasAccessTo(location) ? path.resolve(location) : null;
        },
        validate: repoPath =>
          hasAccessTo(repoPath) ||
          `Could not find the directory ${path.normalize(repoPath)}`,
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

  writingNewFiles() {
    const rootPath = `src/applications/`;
    const appPath = `${rootPath}${this.props.folderName}`;
    let contentRepoMarkdownCopied = false;

    // Vagov-content files
    try {
      this.fs.copyTpl(
        this.templatePath('index.md.ejs'),
        path.join(this.props.contentRepoLocation, 'pages', `${this.props.rootUrl}.md`),
        this.props,
      );
      contentRepoMarkdownCopied = true;
    } catch (e) {
      this.log(
        chalk.red(
          `Could not write to ${this.props.contentRepoLocation}; skipping this step.`,
        ),
      );
    }

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
          `Don't forget to make a markdown file in the vagov-content repo at pages${
            this.props.rootUrl
          }.md!`,
        ),
      );
  }

  updateRegistry() {
    const registryFile = '../content-build/src/applications/registry.json';
    const registry = this.fs.readJSON(registryFile);

    try {
      registry.push({
        appName: this.props.appName,
        entryName: this.props.entryName,
        rootUrl: this.props.rootUrl,
        template: {
          vagovprod: false,
          layout: 'page-react.html',
        },
      });
      this.fs.writeJSON(registryFile, registry);
    } catch (error) {
      this.log(
        chalk.red(
          `Could not write to ${registryFile}`,
        ),
      );
    }


  }
};

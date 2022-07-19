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

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

module.exports = class extends Generator {

  constructor(args, options) {
    super(args,options)
    this.option('appName', {
      type: String, 
      required: false, 
      default: 'my-app-name'
    })
    this.option('folderName', {
      type: String, 
      required: false, 
      default: 'my-folder'
    })
    this.option('entryName', {
      type: String, 
      required: false, 
      default: 'my-entry-name'
    })
    this.option('rootUrl', {
      type: String, 
      required: false, 
      default: '/my-app'
    })           
    this.option('slackGroup', {
      type: String, 
      required: false, 
      default: '@my-slack-group'
    })              
    this.option('isForm', {
      type: Boolean, 
      required: false,
      default: false
    })
    this.option('contentLoc', {
      type: String,
      required: false,
      default: 'docs'
    })
  }

  initializing() {
    // Add validation later
    this.props = {
      appName: this.options.appName,
      folderName: this.options.folderName,
      entryName: this.options.entryName,
      rootUrl: this.options.rootUrl,
      slackGroup: this.options.slackGroup,
      isForm: this.options.isForm,
      contentRepoLocation: this.options.contentLoc
    }
  }
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
        when: !this.props.appName
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
        when: !this.props.folderName
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
        when: !this.props.entryName
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
        when: !this.props.rootUrl
      },
      {
        type: 'confirm',
        name: 'isForm',
        message: 'Is this a form app?',
        default: false,
        when: this.props.isForm != false
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
        when: !this.props.contentRepoLocation
      },
      {
        type: 'input',
        name: 'slackGroup',
        message:
          "What Slack user group should be notified for CI failures on the `main` branch? Example: '@vaos-fe-dev'",
        default: 'none',
        validate: userGroup => {
          if (userGroup !== 'none' && !userGroup.includes('@')) {
            return "Slack user groups should begin with an at sign, '@'";
          }

          return true;
        },
        when: !this.props.slackGroup
      },
    ];

    return this.prompt(prompts).then(props => {
      this.props = {...this.props, ...props};
      this.props.productId = uuidv4();
    });
  }

  _updateAllowlist() {

    this.log(
      JSON.stringify(this.props),
    );

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
          config.allow.singleApps.push({
            entryName: this.props.entryName,
            slackGroup: this.props.slackGroup,
          });
        } else {
          config.allow.groupedApps.push({
            rootFolder: appPaths[0],
            slackGroup: this.props.slackGroup,
          });
        }

        this.fs.writeJSON(configPath, config);
      } catch (error) {
        this.log(chalk.red(`Could not write to ${configPath}. ${error}`));
      }
    }
  }

  configuring() {
    this.log(
      `Configuring*****}\n`,
    );
    // This needs to run before writing to the app folder, so we can know if the root folder is new.
    this._updateAllowlist();
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
    this.log(
      `hello, foldername is ${this.props.folderName}\n`,
    );
    const rootPath = `src/applications/`;
    const appPath = `${rootPath}${this.props.folderName}`;
    let contentRepoMarkdownCopied = false;

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
    this.log(
      `updatingRegistry\n`,
    );
    const registryFile = 'src/applications/registry.json';
    const registry = this.fs.readJSON(registryFile);

    try {
      registry.push({
        appName: this.props.appName,
        entryName: this.props.entryName,
        rootUrl: this.props.rootUrl,
        productId: this.props.productId,
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

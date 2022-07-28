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
    })
    this.option('folderName', {
      type: String, 
      required: false, 
    })
    this.option('entryName', {
      type: String, 
      required: false, 
    })
    this.option('rootUrl', {
      type: String, 
      required: false, 
    })           
    this.option('slackGroup', {
      type: String, 
      required: false, 
    })       
    // Accepts boolean-like strings, i.e. "N" and "FALSE" => false, "Y" and "TRUE" => true       
    this.option('isForm', {
      type: String,
      required: false
    })
    this.option('contentLoc', {
      type: String,
      required: false
    })
  }

  // Validators
  _isInvalidFolderName = folder => !folder.includes(' ') || 'Folder names should not include spaces';
  _isInvalidEntryName = entryName => !entryName.includes(' ') || 'Bundle names should not include spaces';
  _isInvalidSlackGroup = userGroup => {
    return userGroup !== 'none' && !userGroup.startsWith('@') ? `Slack user groups should begin with an at sign, '@'. Received: ${userGroup}` : true
  }

  // Remove leading and trailing forward slashes
  _folderNameFilter= folder => {
      if (folder.startsWith('/')) {
        folder = folder.substring(1);
      }
      if (folder.endsWith('/')) {
        folder = folder.substring(0, -1);
      }
      return folder;
  }

  _rootUrlFilter = url => {
      // Add leading slash if needed
      if (!url.startsWith('/')) {
        url = `/${url}`;
      }
      // Add `index` if a page name was not included
      if (url.endsWith('/')) {
        url = `${url}index`;
      }
      return url;
  }

 
  initializing() {
    this.props = {
      appName: this.options.appName,
      rootUrl: this.options.rootUrl,
      contentRepoLocation: this.options.contentLoc
    }
    

    const makeBool = boolLike => {   
      switch (boolLike?.toUpperCase()) {
        case 'N':
        case 'FALSE':
        case false:
          return false;
        default:
          return true;
      }
    }

    this.props.isForm = this.options.isForm != undefined ?  makeBool(this.options.isForm) : null;

    // Perform validations
    if(this.options.folderName) {
      const badFolder = this._isInvalidFolderName(this.options.folderName);
      badFolder === true ? this.props.folderName = this.options.folderName : this.emit('error', new Error(badFolder))
    }

    if(this.options.entryName) {
      const badEntryName = this._isInvalidEntryName(this.options.entryName);
      badEntryName === true ? this.props.entryName = this.options.entryName : this.emit('error', new Error(badEntryName))
    }     
    if(this.options.slackGroup) {
      const badSlackGroup = this._isInvalidSlackGroup(this.options.slackGroup);
      badSlackGroup === true ? this.props.slackGroup= this.options.slackGroup : this.emit('error', new Error(badSlackGroup))
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
        validate: this._isInvalidFolderName,
        filter: this._folderNameFilter,
        default: 'new-form',
        when: !this.props.folderName
      },
      {
        type: 'input',
        name: 'entryName',
        message:
          "What should be the name of your app's entry bundle? Examples: '0993-edu-benefits' or 'feedback-tool'",
        validate: this._isInvalidEntryName,
        default: answers => {
          const folder = this.props.folderName ?? answers.folderName;
          return folder.split('/').pop()
        },
        when: !this.props.entryName
      },
      {
        type: 'input',
        name: 'rootUrl',
        message:
          "What's the root url for this app? Examples: '/gi-bill-comparison-tool' or '/education/opt-out-information-sharing/opt-out-form-0993'",
        filter: this._rootUrlFilter,
        default: answers => {
          const folder = this.props.folderName ?? answers.folderName;
          return `/${folder}`
        },
        when: !this.props.rootUrl
      },
      {
        type: 'confirm',
        name: 'isForm',
        message: 'Is this a form app?',
        default: false,
        // If this prop was set from a command line argument, it will be a boolean at this point, otherwise ask.
        when: typeof this.props.isForm != 'boolean'
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
        validate: this._isInvalidSlackGroup,
        when: !this.props.slackGroup
      },
    ];


    return this.prompt(prompts).then(props => {
      this.props = {...this.props, ...props};
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
    const registryFile = '../content-build/src/applications/registry.json';
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

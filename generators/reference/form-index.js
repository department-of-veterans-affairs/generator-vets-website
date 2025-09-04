'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const { initializeFileTracking } = require('../../lib/fs-tracker');
const {
  generateOptions,
  initializePropsFromOptions,
} = require('../../lib/generator-config');
const { generatePrompts } = require('../../lib/prompts');
const { TEMPLATE_TYPES } = require('../../utils/constants');
const { getFieldDefinitions } = require('../../lib/prompts');
const { store } = require('../../lib/store');
const {
  handleExpirationDateAlias,
  computeFormProperties,
  updateSharedProps,
} = require('../../lib/form-helpers');

module.exports = class extends Generator {
  constructor(args, options) {
    super(args, options);

    this.formFields = getFieldDefinitions('form');
    initializeFileTracking(this);
    generateOptions(this, this.formFields);
  }

  initializing() {
    const tempThis = {
      props: {},
      options: this.options,
    };
    initializePropsFromOptions(tempThis, this.formFields);

    store.setOptions({ ...store.getAllOptions(), ...this.options });

    const existingProps = store.getAllProps();
    store.setProps({ ...existingProps, ...tempThis.props });

    handleExpirationDateAlias();
    computeFormProperties();
  }

  prompting() {
    if (this.options.dryRunInteractive || this.options.dryRunNonInteractive) {
      return Promise.resolve();
    }

    // Generate prompts automatically from field definitions
    const prompts = generatePrompts(this, this.formFields);

    return this.prompt(prompts).then((props) => {
      const existingProps = store.getAllProps();
      store.setProps({ ...existingProps, ...props });

      computeFormProperties();
      updateSharedProps(this.options.sharedProps);
    });
  }

  writing() {
    const appPath = `src/applications/${store.getValue('folderName')}`;

    if (
      store.getValue('templateType') === TEMPLATE_TYPES.WITH_1_PAGE ||
      store.getValue('templateType') === TEMPLATE_TYPES.WITH_4_PAGES
    ) {
      this.fs.copyTpl(
        this.templatePath('entry.scss.ejs'),
        this.destinationPath(`${appPath}/sass/${store.getValue('entryName')}.scss`),
        store.getAllProps(),
      );

      this.fs.copyTpl(
        this.templatePath('reducer.js.ejs'),
        this.destinationPath(`${appPath}/reducers/index.js`),
        store.getAllProps(),
      );

      this.fs.copyTpl(
        this.templatePath('App.jsx.ejs'),
        this.destinationPath(`${appPath}/containers/App.jsx`),
        store.getAllProps(),
      );

      this.fs.copyTpl(
        this.templatePath('routes.jsx.ejs'),
        this.destinationPath(`${appPath}/routes.jsx`),
        store.getAllProps(),
      );

      this.fs.copy(
        this.templatePath('tests/containers/ConfirmationPage.unit.spec.jsx'),
        this.destinationPath(
          `${appPath}/tests/containers/ConfirmationPage.unit.spec.jsx`,
        ),
      );
      this.fs.copy(
        this.templatePath('tests/containers/IntroductionPage.unit.spec.jsx'),
        this.destinationPath(
          `${appPath}/tests/containers/IntroductionPage.unit.spec.jsx`,
        ),
      );
      this.fs.copy(
        this.templatePath('tests/fixtures/data/minimal-test.json'),
        this.destinationPath(`${appPath}/tests/fixtures/data/minimal-test.json`),
      );
      this.fs.copy(
        this.templatePath('tests/fixtures/mocks/local-mock-responses.js'),
        this.destinationPath(`${appPath}/tests/fixtures/mocks/local-mock-responses.js`),
      );
      this.fs.copy(
        this.templatePath('tests/fixtures/mocks/user.json'),
        this.destinationPath(`${appPath}/tests/fixtures/mocks/user.json`),
      );

      this.fs.copyTpl(
        this.templatePath('cypress.spec.js.ejs'),
        this.destinationPath(
          `${appPath}/tests/${store.getValue('entryName')}.cypress.spec.js`,
        ),
        store.getAllProps(),
      );

      this.fs.copyTpl(
        this.templatePath('IntroductionPage.jsx.ejs'),
        this.destinationPath(`${appPath}/containers/IntroductionPage.jsx`),
        store.getAllProps(),
      );

      this.fs.copyTpl(
        this.templatePath('ConfirmationPage.jsx.ejs'),
        this.destinationPath(`${appPath}/containers/ConfirmationPage.jsx`),
        store.getAllProps(),
      );

      this.fs.copyTpl(
        this.templatePath('pages/nameAndDateOfBirth.js.ejs'),
        this.destinationPath(`${appPath}/pages/nameAndDateOfBirth.js`),
        store.getAllProps(),
      );

      this.fs.copyTpl(
        this.templatePath('constants.js.ejs'),
        this.destinationPath(`${appPath}/constants.js`),
        store.getAllProps(),
      );

      this.fs.copyTpl(
        this.templatePath('form.js.ejs'),
        this.destinationPath(`${appPath}/config/form.js`),
        store.getAllProps(),
      );
    }

    if (store.getValue('templateType') === TEMPLATE_TYPES.WITH_4_PAGES) {
      this.fs.copyTpl(
        this.templatePath('pages/identificationInformation.js.ejs'),
        this.destinationPath(`${appPath}/pages/identificationInformation.js`),
        store.getAllProps(),
      );

      this.fs.copyTpl(
        this.templatePath('pages/mailingAddress.js.ejs'),
        this.destinationPath(`${appPath}/pages/mailingAddress.js`),
        store.getAllProps(),
      );

      this.fs.copyTpl(
        this.templatePath('pages/phoneAndEmailAddress.js.ejs'),
        this.destinationPath(`${appPath}/pages/phoneAndEmailAddress.js`),
        store.getAllProps(),
      );
    }

    if (store.getValue('templateType') === TEMPLATE_TYPES.FORM_ENGINE) {
      this.fs.copyTpl(
        this.templatePath('formEngine.js.ejs'),
        this.destinationPath(`${appPath}/app-entry.jsx`),
        store.getAllProps(),
      );
    }

    this.regexFileReplacements();
  }

  regexFileReplacements() {
    if (this.options.dryRunInteractive || this.options.dryRunNonInteractive) {
      return;
    }

    const tryUpdateRegexInFile = (filePath, regex, newEntry, detailMessage) => {
      try {
        if (!this.fs.exists(filePath)) {
          this.log(chalk.yellow(`File ${filePath} does not exist. ${detailMessage}`));
          return;
        }

        const content = this.fs.read(filePath);

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
      } catch (error) {
        this.log(
          chalk.yellow(
            `Could not write to ${filePath}. ${detailMessage} Error: ${error.message}`,
          ),
        );
      }
    };

    const updateMissingJsonSchema = () => {
      if (!store.getValue('usesVetsJsonSchema')) {
        const filePath =
          './src/platform/forms/tests/forms-config-validator.unit.spec.jsx';
        const regex = /(const missingFromVetsJsonSchema = \[)([\s\S]*?)(\];)/;
        const newEntry = `  VA_FORM_IDS.${store.getValue('formIdConst')},`;
        tryUpdateRegexInFile(
          filePath,
          regex,
          newEntry,
          'Trying to update missingFromVetsJsonSchema.',
        );
      }
    };

    updateMissingJsonSchema();

    if (store.getValue('formNumber')) {
      const filePath = './src/platform/forms/constants.js';
      const formIdConst = store.getValue('formIdConst');
      const formNumber = store.getValue('formNumber');
      const benefitDescription = store.getValue('benefitDescription');
      const trackingPrefix = store.getValue('trackingPrefix');

      let regex = /(export const VA_FORM_IDS = Object\.freeze\({)([\s\S]*?)(}\))/;
      let newEntry = `  ${formIdConst}: '${formNumber}',`;
      let detail = 'Trying to update VA_FORM_IDS.';
      tryUpdateRegexInFile(filePath, regex, newEntry, detail);

      regex = /(export const FORM_BENEFITS = {)([\s\S]*?)(};)/;
      newEntry = `  [VA_FORM_IDS.${formIdConst}]: '${benefitDescription}',`;
      detail = 'Trying to update FORM_BENEFITS.';
      tryUpdateRegexInFile(filePath, regex, newEntry, detail);

      regex = /(export const TRACKING_PREFIXES = {)([\s\S]*?)(};)/;
      newEntry = `  [VA_FORM_IDS.${formIdConst}]: '${trackingPrefix}',`;
      detail = 'Trying to update TRACKING_PREFIXES.';
      tryUpdateRegexInFile(filePath, regex, newEntry, detail);

      regex = /(export const SIP_ENABLED_FORMS = new Set\(\[)([\s\S]*?)(]\);)/;
      newEntry = `  VA_FORM_IDS.${formIdConst},`;
      detail = 'Trying to update SIP_ENABLED_FORMS.';
      tryUpdateRegexInFile(filePath, regex, newEntry, detail);

      regex = /(export const getAllFormLinks = [\s\S]*?return {)([\s\S]*?)( {2}};)/;
      newEntry = `    [VA_FORM_IDS.${formIdConst}]: \`\${tryGetAppUrl('${formNumber}')}/\`,`;
      detail = 'Trying to update getAllFormLinks.';
      tryUpdateRegexInFile(filePath, regex, newEntry, detail);

      regex = /(export const MY_VA_SIP_FORMS = \[)([\s\S]*?)(];)/;
      newEntry =
        `  {\n` +
        `    id: VA_FORM_IDS.${formIdConst},\n` +
        `    benefit: '${benefitDescription}',\n` +
        `    title: '${store.getValue('appName')}',\n` +
        `    description: '${benefitDescription}',\n` +
        `    trackingPrefix: '${trackingPrefix}',\n` +
        `  },`;
      detail = 'Trying to update MY_VA_SIP_FORMS.';
      tryUpdateRegexInFile(filePath, regex, newEntry, detail);
    }
  }

  end() {
    if (!store.isDryRun()) {
      process.nextTick(() => {
        this.log('------------------------------------');
        this.log(chalk.bold('Commands:'));
        this.log(
          chalk.bold(`Site:      `) +
            chalk.cyan(`http://localhost:3001${store.getValue('rootUrl')}`),
        );
        this.log(
          chalk.bold(`Watch:     `) +
            chalk.cyan(`yarn watch --env entry=${store.getValue('entryName')}`),
        );
        this.log(
          chalk.bold(`Mock API:  `) +
            chalk.cyan(
              `yarn mock-api --responses src/applications/${store.getValue(
                'folderName',
              )}/tests/fixtures/mocks/local-mock-responses.js`,
            ),
        );
        this.log(
          chalk.bold(`Unit test: `) +
            chalk.cyan(
              `yarn test:unit --app-folder ${store.getValue(
                'folderName',
              )} --log-level all`,
            ),
        );
        this.log('------------------------------------');
      });
    }
  }
};

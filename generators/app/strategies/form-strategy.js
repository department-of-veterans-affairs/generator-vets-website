'use strict';

const BaseStrategy = require('./base-strategy');
const chalk = require('chalk');
const { TEMPLATE_TYPES } = require('../../../utils/constants');
const {
  handleExpirationDateAlias,
  computeFormProperties,
} = require('../../../lib/form-helpers');
const { isDryRunMode } = require('../../../lib/dry-run-helpers');

/**
 * Strategy for generating form-based applications
 */
class FormStrategy extends BaseStrategy {
  getRequiredFields() {
    return [
      'appName',
      'folderName',
      'entryName',
      'rootUrl',
      'formNumber',
      'benefitDescription',
      'ombNumber',
      'expirationDate',
      'templateType',
    ];
  }

  getAdditionalPrompts(generator, _store) {
    const { generatePrompts } = require('../../../lib/prompts');
    const { getFieldDefinitions } = require('../../../lib/prompts');

    const formFields = getFieldDefinitions('form');
    return generatePrompts(generator, formFields);
  }

  processPromptResults(_generator, _store) {
    handleExpirationDateAlias();
    computeFormProperties();
  }

  generateFiles(generator, store) {
    const appPath = this.getAppPath(store);
    const props = store.getAllProps();
    const templateType = store.getValue('templateType');

    if (
      templateType === TEMPLATE_TYPES.WITH_1_PAGE ||
      templateType === TEMPLATE_TYPES.WITH_4_PAGES
    ) {
      this._generateStandardFormFiles(generator, appPath, props);
    }

    if (templateType === TEMPLATE_TYPES.WITH_4_PAGES) {
      this._generateAdditionalPages(generator, appPath, props);
    }

    if (templateType === TEMPLATE_TYPES.FORM_ENGINE) {
      this._generateFormEngineFiles(generator, appPath, props);
    }
  }

  updateExternalFiles(generator, store) {
    this._updateMissingJsonSchema(generator, store);
    this._updatePlatformConstants(generator, store);
  }

  getCompletionMessage(store) {
    const folderName = store.getValue('folderName');
    const entryName = store.getValue('entryName');
    const rootUrl = store.getValue('rootUrl');
    const templateType = store.getValue('templateType');
    const usesVetsJsonSchema = store.getValue('usesVetsJsonSchema');

    if (templateType === 'FORM_ENGINE') {
      return [
        '------------------------------------',
        chalk.bold.yellow('⚠️  FORM ENGINE (EXPERIMENTAL)'),
        '',
        chalk.yellow('This form uses the experimental Form Engine flow.'),
        chalk.yellow('To edit this form, you must use Drupal CMS.'),
        '------------------------------------',
      ].join('\n');
    }

    return [
      '------------------------------------',
      chalk.bold('Next Steps for Deployment:'),
      'Create and merge PRs in the following order:',
      usesVetsJsonSchema
        ? [
            chalk.bold('1.') + ' ' + chalk.cyan('../vets-json-schema'),
            chalk.bold('2.') + ' ' + chalk.cyan('vets-website'),
            chalk.bold('3.') + ' ' + chalk.cyan('../content-build'),
          ].join('\n')
        : [
            chalk.bold('1.') + ' ' + chalk.cyan('vets-website'),
            chalk.bold('2.') + ' ' + chalk.cyan('../content-build'),
          ].join('\n'),
      '',
      chalk.yellow('Note:') +
        ' Cypress tests disabled in CI. Re-enable after content-build is deployed',
      '',
      '------------------------------------',
      chalk.bold('Development Commands:'),
      chalk.bold('Site:      ') + chalk.cyan(`http://localhost:3001${rootUrl}`),
      chalk.bold('Watch:     ') + chalk.cyan(`yarn watch --env entry=${entryName}`),
      chalk.bold('Mock API:  ') +
        chalk.cyan(
          `yarn mock-api --responses src/applications/${folderName}/tests/fixtures/mocks/local-mock-responses.js`,
        ),
      chalk.bold('Unit test: ') +
        chalk.cyan(`yarn test:unit --app-folder ${folderName} --log-level all`),
      chalk.bold('Cypress:   ') +
        chalk.cyan(
          `yarn cy:run --spec "src/applications/${folderName}/tests/e2e/${entryName}.cypress.spec.js"`,
        ),
      '',
      chalk.gray('Commands also available in ') +
        chalk.cyan(`src/applications/${folderName}/README.md`),
      '------------------------------------',
    ].join('\n');
  }

  _generateStandardFormFiles(generator, appPath, props) {
    // Core form files
    this.copyTemplate(
      generator,
      'form/entry.scss.ejs',
      `${appPath}/sass/${props.entryName}.scss`,
      props,
    );
    this.copyTemplate(
      generator,
      'form/reducer.js.ejs',
      `${appPath}/reducers/index.js`,
      props,
    );
    this.copyTemplate(
      generator,
      'form/App.jsx.ejs',
      `${appPath}/containers/App.jsx`,
      props,
    );
    this.copyTemplate(generator, 'form/routes.jsx.ejs', `${appPath}/routes.jsx`, props);

    // Form-specific containers
    this.copyTemplate(
      generator,
      'form/IntroductionPage.jsx.ejs',
      `${appPath}/containers/IntroductionPage.jsx`,
      props,
    );
    this.copyTemplate(
      generator,
      'form/ConfirmationPage.jsx.ejs',
      `${appPath}/containers/ConfirmationPage.jsx`,
      props,
    );

    // Form configuration
    this.copyTemplate(
      generator,
      'form/constants.js.ejs',
      `${appPath}/constants.js`,
      props,
    );
    this.copyTemplate(generator, 'form/form.js.ejs', `${appPath}/config/form.js`, props);

    // Basic page
    this.copyTemplate(
      generator,
      'form/pages/nameAndDateOfBirth.js.ejs',
      `${appPath}/pages/nameAndDateOfBirth.js`,
      props,
    );

    // Test files
    this.copyTemplate(
      generator,
      'form/tests/containers/ConfirmationPage.unit.spec.jsx',
      `${appPath}/tests/containers/ConfirmationPage.unit.spec.jsx`,
      props,
    );
    this.copyTemplate(
      generator,
      'form/tests/containers/IntroductionPage.unit.spec.jsx',
      `${appPath}/tests/containers/IntroductionPage.unit.spec.jsx`,
      props,
    );
    this.copyTemplate(
      generator,
      'form/tests/fixtures/data/minimal-test.json.ejs',
      `${appPath}/tests/fixtures/data/minimal-test.json`,
      props,
    );
    this.copyTemplate(
      generator,
      'form/tests/fixtures/data/maximal-test.json.ejs',
      `${appPath}/tests/fixtures/data/maximal-test.json`,
      props,
    );
    this.copyTemplate(
      generator,
      'form/tests/fixtures/mocks/local-mock-responses.js',
      `${appPath}/tests/fixtures/mocks/local-mock-responses.js`,
      props,
    );
    this.copyTemplate(
      generator,
      'form/tests/fixtures/mocks/user.json',
      `${appPath}/tests/fixtures/mocks/user.json`,
      props,
    );
    this.copyTemplate(
      generator,
      'form/tests/fixtures/mocks/application-submit.json',
      `${appPath}/tests/fixtures/mocks/application-submit.json`,
      props,
    );
    this.copyTemplate(
      generator,
      'form/tests/fixtures/mocks/feature-toggles.json.ejs',
      `${appPath}/tests/fixtures/mocks/feature-toggles.json`,
      props,
    );

    // Cypress test
    this.copyTemplate(
      generator,
      'form/cypress.spec.js.ejs',
      `${appPath}/tests/e2e/${props.entryName}.cypress.spec.js`,
      props,
    );
  }

  _generateAdditionalPages(generator, appPath, props) {
    this.copyTemplate(
      generator,
      'form/pages/identificationInformation.js.ejs',
      `${appPath}/pages/identificationInformation.js`,
      props,
    );
    this.copyTemplate(
      generator,
      'form/pages/mailingAddress.js.ejs',
      `${appPath}/pages/mailingAddress.js`,
      props,
    );
    this.copyTemplate(
      generator,
      'form/pages/phoneAndEmailAddress.js.ejs',
      `${appPath}/pages/phoneAndEmailAddress.js`,
      props,
    );
  }

  _generateFormEngineFiles(generator, appPath, props) {
    this.copyTemplate(
      generator,
      'form/formEngine.js.ejs',
      `${appPath}/app-entry.jsx`,
      props,
    );
  }

  _updateMissingJsonSchema(generator, store) {
    if (!store.getValue('usesVetsJsonSchema')) {
      const filePath = './src/platform/forms/tests/forms-config-validator.unit.spec.jsx';
      const regex = /(const missingFromVetsJsonSchema = \[)([\s\S]*?)(\];)/;
      const newEntry = `  VA_FORM_IDS.${store.getValue('formIdConst')},`;
      this._tryUpdateRegexInFile(generator, filePath, regex, newEntry);
    }
  }

  _updatePlatformConstants(generator, store) {
    if (store.getValue('formNumber')) {
      const filePath = './src/platform/forms/constants.js';
      const formIdConst = store.getValue('formIdConst');
      const formNumber = store.getValue('formNumber');
      const benefitDescription = store.getValue('benefitDescription');
      const trackingPrefix = store.getValue('trackingPrefix');
      const appName = store.getValue('appName');

      // Update VA_FORM_IDS
      let regex = /(export const VA_FORM_IDS = Object\.freeze\({)([\s\S]*?)(}\))/;
      let newEntry = `  ${formIdConst}: '${formNumber}',`;
      this._tryUpdateRegexInFile(generator, filePath, regex, newEntry);

      // Update FORM_BENEFITS
      regex = /(export const FORM_BENEFITS = {)([\s\S]*?)(};)/;
      newEntry = `  [VA_FORM_IDS.${formIdConst}]: '${benefitDescription}',`;
      this._tryUpdateRegexInFile(generator, filePath, regex, newEntry);

      // Update TRACKING_PREFIXES
      regex = /(export const TRACKING_PREFIXES = {)([\s\S]*?)(};)/;
      newEntry = `  [VA_FORM_IDS.${formIdConst}]: '${trackingPrefix}',`;
      this._tryUpdateRegexInFile(generator, filePath, regex, newEntry);

      // Update SIP_ENABLED_FORMS
      regex = /(export const SIP_ENABLED_FORMS = new Set\(\[)([\s\S]*?)(]\);)/;
      newEntry = `  VA_FORM_IDS.${formIdConst},`;
      this._tryUpdateRegexInFile(generator, filePath, regex, newEntry);

      // Update getAllFormLinks
      regex = /(export const getAllFormLinks = [\s\S]*?return {)([\s\S]*?)( {2}};)/;
      newEntry = `    [VA_FORM_IDS.${formIdConst}]: \`\${tryGetAppUrl('${formNumber}')}/\`,`;
      this._tryUpdateRegexInFile(generator, filePath, regex, newEntry);

      // Update MY_VA_SIP_FORMS
      regex = /(export const MY_VA_SIP_FORMS = \[)([\s\S]*?)(];)/;
      newEntry =
        `  {\n` +
        `    id: VA_FORM_IDS.${formIdConst},\n` +
        `    benefit: '${benefitDescription}',\n` +
        `    title: '${appName}',\n` +
        `    description: '${benefitDescription}',\n` +
        `    trackingPrefix: '${trackingPrefix}',\n` +
        `  },`;
      this._tryUpdateRegexInFile(generator, filePath, regex, newEntry);
    }
  }

  _tryUpdateRegexInFile(generator, filePath, regex, newEntry) {
    // In dry run mode, just track the file without trying to read/write
    if (isDryRunMode(generator.options)) {
      generator.fs.write(filePath, ''); // This will be mocked and only track the file
      return;
    }

    try {
      const content = generator.fs.read(filePath);

      const updatedContent = content.replace(regex, (match, start, arrayContent, end) => {
        if (arrayContent.includes(newEntry)) {
          return match;
        }

        return `${start}${arrayContent.trimEnd()}\n${newEntry}\n${end}`;
      });

      generator.fs.write(filePath, updatedContent);
    } catch (error) {
      generator.log(
        chalk.yellow(`Could not write to ${filePath}. Error: ${error.message}`),
      );
    }
  }
}

module.exports = FormStrategy;

'use strict';

const BaseStrategy = require('./base-strategy');
const yosay = require('yosay');

/**
 * Strategy for generating basic (non-form) applications
 * Handles simple React apps without form-specific functionality
 */
class AppStrategy extends BaseStrategy {
  /**
   * Get the fields required for basic app generation
   * @returns {Array<string>} Array of required field names
   */
  getRequiredFields() {
    return [
      'appName',
      'folderName',
      'entryName',
      'rootUrl',
      'contentRepoLocation',
      'slackGroup',
    ];
  }

  /**
   * Generate basic app files
   * @param {Object} generator - The Yeoman generator instance
   * @param {Object} store - The shared store instance
   */
  generateFiles(generator, store) {
    const appPath = this.getAppPath(store);
    const props = store.getAllProps();

    // Generate basic app files
    this.copyTemplate(
      generator,
      'entry.scss',
      `${appPath}/sass/${store.getValue('entryName')}.scss`,
      props,
    );

    this.copyTemplate(generator, 'reducer.js', `${appPath}/reducers/index.js`, props);

    this.copyTemplate(generator, 'App.jsx', `${appPath}/containers/App.jsx`, props);

    this.copyTemplate(generator, 'routes.jsx', `${appPath}/routes.jsx`, props);

    // Generate cypress test
    this.copyTemplate(
      generator,
      'cypress.spec.js.ejs',
      `${appPath}/tests/${store.getValue('entryName')}.cypress.spec.js`,
      props,
    );
  }

  /**
   * Get completion message for basic apps
   * @param {Object} store - The shared store instance
   * @returns {string} Completion message
   */
  getCompletionMessage(store) {
    const contentRepoMessage = store.getValue('contentRepoLocation')
      ? "Don't forget to make a pull request for vagov-content!"
      : `Don't forget to make a markdown file in the vagov-content repo at pages${store.getValue(
          'rootUrl',
        )}.md!`;

    return yosay(contentRepoMessage);
  }
}

module.exports = AppStrategy;

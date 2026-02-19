/**
 * Base strategy class that defines the interface for all generation strategies
 * This provides common functionality and enforces the strategy contract
 */
export default class BaseStrategy {
  constructor() {
    if (this.constructor === BaseStrategy) {
      throw new Error('BaseStrategy is abstract and cannot be instantiated directly');
    }
  }

  /**
   * Get the fields required for this strategy
   * @returns {Array<string>} Array of required field names
   */
  getRequiredFields() {
    throw new Error('getRequiredFields() must be implemented by subclass');
  }

  /**
   * Get additional prompts specific to this strategy
   * @param {Object} _generator - The Yeoman generator instance
   * @param {Object} _store - The shared store instance
   * @returns {Array} Array of additional prompts
   */
  getAdditionalPrompts(_generator, _store) {
    return [];
  }

  /**
   * Process results after prompting is complete
   * @param {Object} _generator - The Yeoman generator instance
   * @param {Object} _store - The shared store instance
   */
  processPromptResults(_generator, _store) {
    // Default implementation - subclasses can override
  }

  /**
   * Validate strategy-specific inputs
   * @param {Object} _store - The shared store instance
   * @returns {Array<string>} Array of validation error messages
   */
  validateInputs(_store) {
    return [];
  }

  /**
   * Perform strategy-specific configuration
   * @param {Object} _generator - The Yeoman generator instance
   * @param {Object} _store - The shared store instance
   */
  configure(_generator, _store) {
    // Default implementation - subclasses can override
  }

  /**
   * Generate strategy-specific files
   * @param {Object} _generator - The Yeoman generator instance
   * @param {Object} _store - The shared store instance
   */
  generateFiles(_generator, _store) {
    throw new Error('generateFiles() must be implemented by subclass');
  }

  /**
   * Update external files (registry, constants, etc.)
   * @param {Object} _generator - The Yeoman generator instance
   * @param {Object} _store - The shared store instance
   */
  updateExternalFiles(_generator, _store) {
    // Default implementation - subclasses can override
  }

  /**
   * Get completion message for this strategy
   * @param {Object} _store - The shared store instance
   * @returns {string} Completion message
   */
  getCompletionMessage(_store) {
    return 'Generator completed successfully!';
  }

  /**
   * Helper method to get the application path
   * @param {Object} store - The shared store instance
   * @returns {string} Application path
   */
  getAppPath(store) {
    return `src/applications/${store.getValue('folderName')}`;
  }

  /**
   * Helper method to copy a template file
   * @param {Object} generator - The Yeoman generator instance
   * @param {string} templatePath - Path to template file
   * @param {string} destinationPath - Destination path
   * @param {Object} templateData - Data for template interpolation
   */
  copyTemplate(generator, templatePath, destinationPath, templateData = {}) {
    if (Object.keys(templateData).length > 0) {
      generator.fs.copyTpl(
        generator.templatePath(templatePath),
        generator.destinationPath(destinationPath),
        templateData,
      );
    } else {
      generator.fs.copy(
        generator.templatePath(templatePath),
        generator.destinationPath(destinationPath),
      );
    }
  }
}

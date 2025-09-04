'use strict';

/**
 * Generate yeoman options from field definitions
 * @param {Object} generator - The Yeoman generator instance
 * @param {Object} fieldDefinitions - Field definitions object
 * @param {Array} fieldNames - Optional array of field names to process
 */
function generateOptions(generator, fieldDefinitions, fieldNames = null) {
  // Safety check for undefined fieldDefinitions
  if (!fieldDefinitions || typeof fieldDefinitions !== 'object') {
    console.warn(
      'Warning: fieldDefinitions is undefined or not an object in generateOptions',
    );
    return;
  }

  const fieldsToProcess = fieldNames || Object.keys(fieldDefinitions);

  fieldsToProcess.forEach((fieldName) => {
    const field = fieldDefinitions[fieldName];
    if (field) {
      // Handle special case for fields that accept boolean-like strings
      let optionType = String;
      if (field.type === 'Boolean' && fieldName !== 'isForm') {
        optionType = Boolean;
      } else if (fieldName === 'isForm') {
        // IsForm accepts boolean-like strings, so use String type regardless of prompt type
        optionType = String;
      }

      generator.option(fieldName, {
        type: optionType,
        description: field.description,
      });
    }
  });
}

/**
 * Initialize props from CLI options using field definitions for type conversion
 * @param {Object} generator - The Yeoman generator instance
 * @param {Object} fieldDefinitions - Field definitions object
 */
function initializePropsFromOptions(generator, fieldDefinitions) {
  // Initialize props from CLI options
  Object.keys(fieldDefinitions).forEach((fieldName) => {
    const field = fieldDefinitions[fieldName];
    const optionValue = generator.options[fieldName];

    if (optionValue !== undefined) {
      // Handle boolean conversion for string fields that accept boolean-like values
      if (field.type === 'String' && fieldName === 'isForm') {
        // Convert boolean-like strings to actual booleans for isForm
        if (typeof optionValue === 'string') {
          generator.props = generator.props || {};
          generator.props[fieldName] = ['true', 'yes', 'y', '1'].includes(
            optionValue.toLowerCase(),
          );
        } else {
          generator.props = generator.props || {};
          generator.props[fieldName] = optionValue;
        }
      } else {
        generator.props = generator.props || {};
        generator.props[fieldName] = optionValue;
      }
    }
  });
}

/**
 * Generate display options for configuration showing current values and sources
 * @param {Object} generator - The Yeoman generator instance
 * @param {Object} fieldDefinitions - Field definitions object
 * @param {Function} getOptionSource - Function to determine the source of an option
 * @returns {Array} Array of display option objects
 */
function generateDisplayOptions(generator, fieldDefinitions, getOptionSource) {
  const displayOptions = [];

  Object.keys(fieldDefinitions).forEach((fieldName) => {
    const value = generator.props[fieldName] || generator.options[fieldName];

    if (value !== undefined) {
      displayOptions.push({
        key: fieldName,
        value,
        source: getOptionSource(fieldName),
      });
    }
  });

  return displayOptions;
}

/**
 * Generate comprehensive configuration display for dry-run showing all relevant props
 * @param {Object} generator - The Yeoman generator instance
 * @param {Object} fieldDefinitions - Field definitions object
 * @param {Function} getOptionSource - Function to determine the source of an option
 * @returns {Array} Array of comprehensive configuration objects
 */
function generateComprehensiveConfig(generator, fieldDefinitions, getOptionSource) {
  const config = [];

  Object.keys(fieldDefinitions).forEach((fieldName) => {
    const field = fieldDefinitions[fieldName];
    const currentValue = generator.props[fieldName] || generator.options[fieldName];

    // Skip internal/technical fields that users don't need to see
    if (['dryRun', 'dryRunInteractive', 'dryRunNonInteractive'].includes(fieldName)) {
      return;
    }

    let displayValue = currentValue;
    let source = 'unset';
    let wouldPrompt = false;

    if (currentValue !== undefined) {
      source = getOptionSource(fieldName);
    } else if (field.required) {
      if (field.default === undefined) {
        displayValue = '<would prompt>';
        source = 'would prompt';
        wouldPrompt = true;
      } else if (typeof field.default === 'function') {
        displayValue = '<computed>';
        source = 'computed default';
      } else {
        displayValue = field.default;
        source = 'default value';
      }
    } else if (field.default === undefined) {
      displayValue = '<not set>';
      source = 'optional';
    } else {
      displayValue = field.default;
      source = 'default value';
    }

    config.push({
      key: fieldName,
      value: displayValue,
      source,
      description: field.description || '',
      required: field.required || false,
      wouldPrompt,
    });
  });

  return config;
}

module.exports = {
  generateOptions,
  generateDisplayOptions,
  generateComprehensiveConfig,
  initializePropsFromOptions,
};

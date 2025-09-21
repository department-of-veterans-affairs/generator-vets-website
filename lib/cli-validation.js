/**
 * CLI argument validation utilities
 * Provides validation functions for command-line arguments to ensure proper format
 * and catch errors early in the generator process.
 */

const { getNonInteractiveRequiredFields } = require('../lib/prompts');

/**
 * Validates that a root URL follows the correct format
 * - Must start with '/'
 * - Must not end with '/' (will be handled by filter)
 * - Should contain valid URL characters
 * @param {string} rootUrl - The root URL to validate
 * @returns {boolean|string} - true if valid, error message if invalid
 */
function validateRootUrl(rootUrl) {
  if (!rootUrl) return true; // Allow empty for format validation - required check handled separately

  // Must start with '/'
  if (!rootUrl.startsWith('/')) {
    return 'Root URL must start with a forward slash (/). Example: "/burial-allowance"';
  }

  // Check for trailing slash
  if (rootUrl.endsWith('/')) {
    return 'Root URL should not end with a slash (/). Example: "/burial-allowance" not "/burial-allowance/"';
  }

  // Check for invalid characters (basic validation)
  const invalidChars = /[<>:"\\|?*\s]/;
  if (invalidChars.test(rootUrl)) {
    return 'Root URL contains invalid characters. Use only letters, numbers, hyphens, and forward slashes. Example: "/burial-allowance" not "/burial allowance"';
  }

  return true;
}

/**
 * Validates that an app name follows naming conventions
 * - Can contain spaces (used for display purposes like page titles)
 * - Should contain valid characters for display text
 * @param {string} appName - The application name to validate
 * @returns {boolean|string} - true if valid, error message if invalid
 */
function validateAppName(appName) {
  if (!appName) return true; // Optional field

  // App names can contain spaces since they're used as page titles
  // Just check for obviously invalid characters
  const invalidChars = /[<>:"\\|?*]/;
  if (invalidChars.test(appName)) {
    return 'App name contains invalid characters. Avoid: < > : " \\ | ? *. Example: "Burial Allowance Application"';
  }

  return true;
}

/**
 * Validates that an entry name follows naming conventions
 * - No spaces allowed
 * - Should be kebab-case
 * @param {string} entryName - The entry name to validate
 * @returns {boolean|string} - true if valid, error message if invalid
 */
function validateEntryName(entryName) {
  if (!entryName) return true; // Optional field

  if (entryName.includes(' ')) {
    return 'Entry name should not contain spaces. Use kebab-case. Example: "burial-allowance" not "burial allowance"';
  }

  // Check for invalid characters (more restrictive for entry names)
  const invalidChars = /[^a-zA-Z0-9-]/;
  if (invalidChars.test(entryName)) {
    return 'Entry name should only contain letters, numbers, and hyphens. Example: "burial-allowance"';
  }

  return true;
}

/**
 * Validates form number format
 * - Should follow VA form number patterns (e.g., "22-0993", "21P-530")
 * @param {string} formNumber - The form number to validate
 * @returns {boolean|string} - true if valid, error message if invalid
 */
function validateFormNumber(formNumber) {
  if (!formNumber) return true; // Optional field

  // VA form numbers follow patterns like:
  // - 21-526EZ (1-2 digits, optional letter, dash, any combination of digits and letters)
  // - 22-1990 (2 digits, dash, 4 digits)
  // - 10-10EZ (2 digits, dash, 2 digits + 2 letters)
  // - 1-2345A (1 digit, dash, 4 digits + 1 letter)
  const formPattern = /^\d{1,2}[A-Z]?-[\dA-Z]+$/i;
  if (!formPattern.test(formNumber)) {
    return 'Form number should follow VA format (e.g., "22-0993", "21-526EZ", "10-10EZ")';
  }

  return true;
}

/**
 * Validates OMB number format
 * - Should follow OMB control number format (XXXX-XXXX)
 * @param {string} ombNumber - The OMB number to validate
 * @returns {boolean|string} - true if valid, error message if invalid
 */
function validateOmbNumber(ombNumber) {
  if (!ombNumber) return true; // Optional field

  const ombPattern = /^\d{4}-\d{4}$/;
  if (!ombPattern.test(ombNumber)) {
    return 'OMB number should follow format XXXX-XXXX (e.g., "2900-0001")';
  }

  return true;
}

/**
 * Validates expiration date format
 * - Should follow M/D/YYYY or MM/DD/YYYY format
 * @param {string} expirationDate - The expiration date to validate
 * @returns {boolean|string} - true if valid, error message if invalid
 */
function validateExpirationDate(expirationDate) {
  if (!expirationDate) return true; // Optional field

  const datePattern = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/\d{4}$/;
  if (!datePattern.test(expirationDate)) {
    return 'Expiration date should follow M/D/YYYY format. Examples: "12/31/2025" or "3/15/2026"';
  }

  // Validate that it's a future date
  const inputDate = new Date(expirationDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time for date comparison

  if (inputDate <= today) {
    return 'Expiration date should be in the future. Example: "12/31/2026"';
  }

  return true;
}

/**
 * Validates respondent burden
 * - Should be a positive number
 * @param {string} respondentBurden - The respondent burden in minutes
 * @returns {boolean|string} - true if valid, error message if invalid
 */
function validateRespondentBurden(respondentBurden) {
  if (!respondentBurden) return true; // Optional field

  const burden = parseInt(respondentBurden, 10);
  if (isNaN(burden) || burden <= 0) {
    return 'Respondent burden should be a positive number (minutes). Example: "15" or "30"';
  }

  return true;
}

/**
 * Validates template type
 * - Should be one of the allowed values
 * @param {string} templateType - The template type to validate
 * @returns {boolean|string} - true if valid, error message if invalid
 */
function validateTemplateType(templateType) {
  if (!templateType) return true; // Optional field

  const allowedTypes = ['WITH_1_PAGE', 'WITH_4_PAGES', 'FORM_ENGINE'];
  if (!allowedTypes.includes(templateType)) {
    return `Template type should be one of: ${allowedTypes.join(
      ', ',
    )}. Example: "WITH_1_PAGE"`;
  }

  return true;
}

/**
 * Validates all CLI arguments at once
 * @param {Object} options - The CLI options object
 * @returns {Array} - Array of error messages (empty if all valid)
 */
function validateAllCliArguments(options) {
  const errors = [];

  // First, check for required CLI arguments in non-interactive mode
  const requiredArgErrors = validateRequiredCliArguments(options);
  errors.push(...requiredArgErrors);

  // Then validate format/values of provided arguments
  const validators = [
    { field: 'rootUrl', validator: validateRootUrl },
    { field: 'appName', validator: validateAppName },
    { field: 'entryName', validator: validateEntryName },
    { field: 'formNumber', validator: validateFormNumber },
    { field: 'ombNumber', validator: validateOmbNumber },
    { field: 'expirationDate', validator: validateExpirationDate },
    { field: 'respondentBurden', validator: validateRespondentBurden },
    { field: 'templateType', validator: validateTemplateType },
  ];

  validators.forEach(({ field, validator }) => {
    const result = validator(options[field]);
    if (result !== true) {
      errors.push(`${field}: ${result}`);
    }
  });

  return errors;
}

/**
 * Detects if non-interactive mode is being used (any CLI arguments provided)
 * @param {Object} options - The CLI options object
 * @returns {boolean} - true if any CLI arguments are provided
 */
function isNonInteractiveMode(options) {
  if (!options || typeof options !== 'object') {
    return false;
  }

  // If dry-run-interactive is specified, force interactive mode
  if (options.dryRunInteractive) {
    return false;
  }

  // If dry-run-non-interactive is specified, force non-interactive mode
  if (options.dryRunNonInteractive) {
    return true;
  }

  const cliFields = [
    'appName',
    'folderName',
    'entryName',
    'rootUrl',
    'isForm',
    'contentLoc',
    'slackGroup',
    'formNumber',
    'trackingPrefix',
    'respondentBurden',
    'ombNumber',
    'expirationDate',
    'benefitDescription',
    'usesVetsJsonSchema',
    'usesMinimalHeader',
    'templateType',
  ];

  return cliFields.some((field) => options[field] !== undefined);
}

/**
 * Validates that all required CLI arguments are provided in non-interactive mode
 * @param {Object} options - The CLI options object
 * @returns {Array} - Array of error messages for missing required fields
 */
function validateRequiredCliArguments(options) {
  if (!isNonInteractiveMode(options)) {
    return []; // Interactive mode - no validation needed
  }

  const errors = [];
  const requiredFields = getNonInteractiveRequiredFields(options);

  requiredFields.forEach((field) => {
    if (
      options[field] === undefined ||
      options[field] === null ||
      options[field] === ''
    ) {
      // Show camelCase field names for CLI arguments (preferred format)
      errors.push(`--${field}: Required when using non-interactive mode`);
    }
  });

  return errors;
}

module.exports = {
  validateRootUrl,
  validateAppName,
  validateEntryName,
  validateFormNumber,
  validateOmbNumber,
  validateExpirationDate,
  validateRespondentBurden,
  validateTemplateType,
  validateAllCliArguments,
  isNonInteractiveMode,
  validateRequiredCliArguments,
  // Re-export from prompts for compatibility
  getNonInteractiveRequiredFields,
};

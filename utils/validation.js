/**
 * Validation utilities for generator inputs
 * Consolidates all validation logic from fields.js and cli-validation.js
 */

import fs from 'node:fs';
import { fieldNameToCliArg } from './filters.js';

/**
 * Check if a location is accessible for writing
 * @param {string} location - The file/directory path to check
 * @returns {boolean} True if accessible, false otherwise
 */
export function hasAccessTo(location) {
  try {
    fs.accessSync(location, fs.constants.F_OK | fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate folder name format
 * @param {string} folder - The folder name to validate
 * @returns {boolean|string} true if valid, error message if invalid
 */
export function isInvalidFolderName(folder) {
  return !folder.includes(' ') || 'Folder names should not include spaces';
}

/**
 * Validate entry name format
 * @param {string} entryName - The entry name to validate
 * @returns {boolean|string} true if valid, error message if invalid
 */
export function isInvalidEntryName(entryName) {
  return !entryName.includes(' ') || 'Bundle names should not include spaces';
}

/**
 * Validate Slack group format
 * @param {string} slackGroup - The Slack group to validate
 * @returns {boolean|string} true if valid, error message if invalid
 */
export function isInvalidSlackGroup(slackGroup) {
  if (slackGroup === 'none') return true;
  return (
    /^@[a-z-]+$/.test(slackGroup) ||
    'Slack group must start with @ and contain only lowercase letters and hyphens'
  );
}

/**
 * Validates that a root URL follows the correct format
 * - Must start with '/'
 * - Must not end with '/' (will be handled by filter)
 * - Should contain valid URL characters
 * @param {string} rootUrl - The root URL to validate
 * @returns {boolean|string} - true if valid, error message if invalid
 */
export function validateRootUrl(rootUrl) {
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
  if (!/^\/[a-z0-9\-/_]*$/.test(rootUrl)) {
    return 'Root URL should only contain lowercase letters, numbers, hyphens, underscores, and forward slashes. Example: "/burial-allowance"';
  }

  return true;
}

/**
 * Validates form number format
 * @param {string} formNumber - The form number to validate
 * @returns {boolean|string} - true if valid, error message if invalid
 */
export function validateFormNumber(formNumber) {
  if (!formNumber) return true; // Allow empty for format validation - required check handled separately

  // Basic format check: should contain letters, numbers, and hyphens
  if (!/^[A-Z0-9-]+$/i.test(formNumber)) {
    return 'Form number should only contain letters, numbers, and hyphens. Example: "21-526EZ"';
  }

  return true;
}

/**
 * Validates app name format
 * @param {string} appName - The app name to validate
 * @returns {boolean|string} - true if valid, error message if invalid
 */
export function validateAppName(appName) {
  if (!appName) return 'Application name is required';

  // Check length
  if (appName.length < 3) {
    return 'Application name must be at least 3 characters long';
  }

  if (appName.length > 100) {
    return 'Application name must be less than 100 characters long';
  }

  return true;
}

/**
 * Validates entry name format
 * @param {string} entryName - The entry name to validate
 * @returns {boolean|string} - true if valid, error message if invalid
 */
export function validateEntryName(entryName) {
  if (!entryName) return true; // Allow empty for format validation - required check handled separately

  // Must be valid JavaScript identifier (roughly)
  if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(entryName)) {
    return 'Entry name must start with a letter and contain only letters and numbers. Example: "burialAllowance"';
  }

  return true;
}

/**
 * Validates folder name format (more comprehensive than isInvalidFolderName)
 * @param {string} folderName - The folder name to validate
 * @returns {boolean|string} - true if valid, error message if invalid
 */
export function validateFolderName(folderName) {
  if (!folderName) return true; // Allow empty for format validation - required check handled separately

  // Check for spaces
  if (folderName.includes(' ')) {
    return 'Folder names should not include spaces';
  }

  // Check for invalid characters
  if (!/^[a-z0-9\-/_]+$/.test(folderName)) {
    return 'Folder name should only contain lowercase letters, numbers, hyphens, underscores, and forward slashes';
  }

  return true;
}

/**
 * Validate that all required fields have values in non-interactive mode
 * @param {Object} generator - The Yeoman generator instance
 * @param {Object} fieldDefinitions - Field definitions object
 * @returns {Array} Array of error messages
 */
export function validateRequiredFields(generator, fieldDefinitions) {
  const errors = [];

  Object.keys(fieldDefinitions).forEach((fieldName) => {
    const field = fieldDefinitions[fieldName];

    if (field.required) {
      // Ensure generator.props exists before accessing it
      const generatorProps = generator.props || {};
      const value = generatorProps[fieldName] || generator.options[fieldName];

      if (value === undefined || value === null || value === '') {
        const cliArgName = fieldNameToCliArg(fieldName);
        errors.push(`--${cliArgName}: Required when using non-interactive mode`);
      }
    }
  });

  return errors;
}

/**
 * Check for duplicate entries in the content-build registry
 * @param {Array} registry - The existing registry entries
 * @param {Object} newApp - The new app being created
 * @returns {Array} Array of duplicate error messages
 */
export function checkForDuplicates(registry, newApp) {
  const duplicates = [];

  if (registry.find((entry) => entry.appName === newApp.appName)) {
    duplicates.push(`App Name: "${newApp.appName}" already exists in registry`);
  }

  if (registry.find((entry) => entry.entryName === newApp.entryName)) {
    duplicates.push(`Entry Name: "${newApp.entryName}" already exists in registry`);
  }

  if (registry.find((entry) => entry.rootUrl === newApp.rootUrl)) {
    duplicates.push(`Root URL: "${newApp.rootUrl}" already exists in registry`);
  }

  if (registry.find((entry) => entry.productId === newApp.productId)) {
    duplicates.push(`Product ID: "${newApp.productId}" already exists in registry`);
  }

  return duplicates;
}

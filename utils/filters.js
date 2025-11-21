/**
 * Filter functions for transforming user input
 * Used by field definitions to clean and normalize input values
 */

/**
 * Clean up folder name by removing leading/trailing slashes
 * @param {string} folder - The folder name to clean
 * @returns {string} The cleaned folder name
 */
function folderNameFilter(folder) {
  if (folder.startsWith('/')) {
    folder = folder.substring(1);
  }

  if (folder.endsWith('/')) {
    folder = folder.slice(0, -1);
  }

  return folder;
}

/**
 * Clean up root URL by removing trailing slash and ensuring leading slash
 * @param {string} rootUrl - The root URL to clean
 * @returns {string} The cleaned root URL
 */
function rootUrlFilter(rootUrl) {
  // Remove trailing slash if present
  if (rootUrl.endsWith('/')) {
    rootUrl = rootUrl.slice(0, -1);
  }

  // Ensure it starts with a slash
  if (!rootUrl.startsWith('/')) {
    rootUrl = `/${rootUrl}`;
  }

  return rootUrl;
}

/**
 * Convert camelCase field name to kebab-case CLI argument
 * @param {string} fieldName - The camelCase field name
 * @returns {string} The kebab-case CLI argument name
 */
function fieldNameToCliArg(fieldName) {
  return fieldName.replace(/([A-Z])/g, '-$1').toLowerCase();
}

/**
 * Generate form ID constant from form number
 * @param {string} formNumber - The form number (e.g., "21-526EZ")
 * @returns {string} The form ID constant (e.g., "FORM_21_526EZ")
 */
function generateFormIdConst(formNumber) {
  const normalized = formNumber.replace(/-/g, '_');
  return normalized.startsWith('FORM_') ? normalized : `FORM_${normalized}`;
}

/**
 * Generate tracking prefix from form number
 * @param {string} formNumber - The form number (e.g., "21-526EZ")
 * @returns {string} The tracking prefix (e.g., "21_526ez")
 */
function generateTrackingPrefix(formNumber) {
  return formNumber.toLowerCase().replace(/-/g, '_');
}

module.exports = {
  folderNameFilter,
  rootUrlFilter,
  fieldNameToCliArg,
  generateFormIdConst,
  generateTrackingPrefix,
};

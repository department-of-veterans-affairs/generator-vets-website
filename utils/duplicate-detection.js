/**
 * Check for duplicate entries in the content-build registry
 * @param {Array} registry - The existing registry entries
 * @param {Object} newApp - The new app being created
 * @returns {Array} Array of duplicate error messages
 */
function checkForDuplicates(registry, newApp) {
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

module.exports = { checkForDuplicates };

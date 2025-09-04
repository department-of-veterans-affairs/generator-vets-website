'use strict';

const { store } = require('../lib/store');

/**
 * File operation tracker for Yeoman generators
 * Uses the central store for cross-generator coordination
 */

/**
 * Initialize file tracking for a generator instance
 * @param {Generator} generator - The Yeoman generator instance
 */
function initializeFileTracking(generator) {
  // Initialize local tracking array (for generator-specific operations)
  generator.trackedFiles = [];

  // Store original fs methods
  generator._originalFs = {
    copyTpl: generator.fs.copyTpl.bind(generator.fs),
    copy: generator.fs.copy.bind(generator.fs),
    writeJSON: generator.fs.writeJSON.bind(generator.fs),
    write: generator.fs.write.bind(generator.fs),
  };

  // Wrap file operations to track destination paths
  generator.fs.copyTpl = function (templatePath, destinationPath, templateData) {
    // Track in both local and central store
    generator.trackedFiles.push(destinationPath);
    store.trackFile(destinationPath);

    // Only execute in non-dry-run mode
    if (!store.isDryRun()) {
      return generator._originalFs.copyTpl(templatePath, destinationPath, templateData);
    }
  };

  generator.fs.copy = function (sourcePath, destinationPath) {
    // Track in both local and central store
    generator.trackedFiles.push(destinationPath);
    store.trackFile(destinationPath);

    // Only execute in non-dry-run mode
    if (!store.isDryRun()) {
      return generator._originalFs.copy(sourcePath, destinationPath);
    }
  };

  generator.fs.writeJSON = function (filePath, contents, replacer, space) {
    // Track in both local and central store
    generator.trackedFiles.push(filePath);
    store.trackFile(filePath);

    // Only execute in non-dry-run mode
    if (!store.isDryRun()) {
      return generator._originalFs.writeJSON(filePath, contents, replacer, space);
    }
  };

  generator.fs.write = function (filePath, contents) {
    // Track in both local and central store
    generator.trackedFiles.push(filePath);
    store.trackFile(filePath);

    // Only execute in non-dry-run mode
    if (!store.isDryRun()) {
      return generator._originalFs.write(filePath, contents);
    }
  };
}

/**
 * Get all tracked files for a generator
 * @param {Generator} generator - The Yeoman generator instance
 * @param {boolean} relativePaths - Whether to return relative paths (default: true)
 * @returns {string[]} Array of destination file paths
 */
function getTrackedFiles(generator, relativePaths = true) {
  // Use central store for all tracked files across generators
  const files = store.getTrackedFiles();

  if (!relativePaths) {
    return files;
  }

  // Make paths relative to the generator's destination root
  const destinationRoot = generator.destinationRoot();
  return files.map((filePath) => {
    // If it's already relative, return as-is
    if (!filePath.startsWith('/')) {
      return filePath;
    }

    // Make absolute paths relative to destination root
    const path = require('path');
    return path.relative(destinationRoot, filePath);
  });
}

module.exports = {
  initializeFileTracking,
  getTrackedFiles,
};

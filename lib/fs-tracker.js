import path from 'node:path';
import { store } from './store.js';

/**
 * File operation tracker for Yeoman generators
 * Uses the central store for cross-generator coordination
 */

/**
 * Initialize file tracking for a generator instance
 * @param {Generator} generator - The Yeoman generator instance
 */
export function initializeFileTracking(generator) {
  // Store original fs methods
  const originalCopyTpl = generator.fs.copyTpl;
  const originalCopy = generator.fs.copy;
  const originalWriteJSON = generator.fs.writeJSON;
  const originalWrite = generator.fs.write;
  const originalRead = generator.fs.read;

  generator._originalFs = {
    copyTpl: originalCopyTpl,
    copy: originalCopy,
    writeJSON: originalWriteJSON,
    write: originalWrite,
    read: originalRead,
  };

  const checkAndWrapIfDryRun = () => {
    if (store.isDryRun()) {
      // Wrap methods for dry-run mode - track files but don't execute operations
      generator.fs.copyTpl = function (templatePath, destinationPath, _templateData) {
        store.trackFile(destinationPath);
      };

      generator.fs.copy = function (sourcePath, destinationPath) {
        store.trackFile(destinationPath);
      };

      generator.fs.writeJSON = function (filePath, _contents, _replacer, _space) {
        store.trackFile(filePath);
      };

      generator.fs.write = function (filePath, _contents) {
        store.trackFile(filePath);
      };
    } else {
      // Use original Yeoman methods directly
      generator.fs.copyTpl = originalCopyTpl;
      generator.fs.copy = originalCopy;
      generator.fs.writeJSON = originalWriteJSON;
      generator.fs.write = originalWrite;
    }
  };

  checkAndWrapIfDryRun();
  generator.checkAndWrapIfDryRun = checkAndWrapIfDryRun;
}

/**
 * Get all tracked files for a generator
 * @param {Generator} generator - The Yeoman generator instance
 * @param {boolean} relativePaths - Whether to return relative paths (default: true)
 * @returns {string[]} Array of destination file paths
 */
export function getTrackedFiles(generator, relativePaths = true) {
  const files = store.getTrackedFiles();

  if (!relativePaths) {
    return files;
  }

  const destinationRoot = generator.destinationRoot();
  return files.map((filePath) => {
    if (!filePath.startsWith('/')) {
      return filePath;
    }

    return path.relative(destinationRoot, filePath);
  });
}

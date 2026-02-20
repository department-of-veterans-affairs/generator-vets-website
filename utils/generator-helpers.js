import chalk from 'chalk';

/**
 * Generate a UUID v4
 * @returns {string} A UUID v4 string
 */
export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;

    const v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Check Node.js compatibility and exit if not compatible
 * Now requires Node 22+ after the ESM migration
 */
export function checkNodeCompatibility() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);

  if (majorVersion < 22) {
    console.error(
      `${chalk.red('Error:')} Node.js ${nodeVersion} is not supported by this generator.`,
    );
    console.error(
      `${chalk.yellow('Required version:')} Node.js 22.0.0 or higher (use 'nvm use' to switch)`,
    );
    console.error(`${chalk.cyan('Please switch to Node.js 22+ and try again.')}`);
    console.error(
      `${chalk.gray('Note: This generator was upgraded to ESM and requires Node 22+')}`,
    );
    process.exit(1);
  }
}

/**
 * Convert a boolean-like value to an actual boolean
 * @param {*} boolLike - Value to convert to boolean
 * @returns {boolean}
 */
export function makeBool(boolLike) {
  if (typeof boolLike === 'boolean') {
    return boolLike;
  }

  if (typeof boolLike === 'string') {
    switch (boolLike.toUpperCase()) {
      case 'N':
      case 'FALSE':
        return false;
      default:
        return true;
    }
  }

  return true;
}

/**
 * Calculate the subFolder path based on folder depth
 * This is used in SCSS imports to create correct relative paths to platform files
 *
 * Examples:
 * - "my-app" → "" (no subfolders)
 * - "edu-benefits/0993" → "../" (one subfolder)
 * - "a/b/c" → "../../" (two subfolders)
 *
 * @param {string} folderName - The folder name (e.g., "edu-benefits/0993")
 * @returns {string} The subfolder path (e.g., "../")
 */
export function calculateSubFolder(folderName) {
  if (!folderName) {
    return '';
  }

  const normalized = folderName.replace(/^\/+|\/+$/g, '');
  const subfolders = Array.from(normalized).filter((c) => c === '/').length;

  if (subfolders > 0) {
    return `${new Array(subfolders).fill('..').join('/')}/`;
  }

  return '';
}

const chalk = require('chalk');

/**
 * Generate a UUID v4
 * @returns {string} A UUID v4 string
 */
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    // eslint-disable-next-line no-bitwise
    const r = (Math.random() * 16) | 0;
    // eslint-disable-next-line no-bitwise, eqeqeq
    const v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Check Node.js compatibility and exit if not compatible
 * TODO: Remove this after upgrading to node 16+
 * For now Node 14.15 is required, so give a helpful error message if we are not using that.
 */
function checkNodeCompatibility() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);

  if (majorVersion !== 14) {
    console.error(
      `${chalk.red('Error:')} Node.js ${nodeVersion} is not supported by this generator.`,
    );
    console.error(
      `${chalk.yellow('Required version:')} Node.js 14.15.0 (use 'nvm use' to switch)`,
    );
    console.error(`${chalk.cyan('Please switch to Node.js 14.15.0 and try again.')}`);
    console.error(
      `${chalk.gray(
        'Note: This restriction will be removed when we upgrade to yeoman-generator 5.10.0+',
      )}`,
    );
    process.exit(1);
  }
}

/**
 * Convert a boolean-like value to an actual boolean
 * @param {*} boolLike - Value to convert to boolean
 * @returns {boolean}
 */
function makeBool(boolLike) {
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

module.exports = {
  uuidv4,
  checkNodeCompatibility,
  makeBool,
};

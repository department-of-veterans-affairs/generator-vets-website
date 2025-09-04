/**
 * Minimal test helper for testGenerator function
 * Contains only the essential code needed for testGenerator to work
 */

/**
 * Creates a minimal Yeoman environment mock that satisfies generator requirements
 * @returns {Object} Mock environment object
 */
function createMinimalYeomanEnvironment() {
  const { EventEmitter } = require('events');

  // Create enhanced fs mock with methods yeoman-generator expects
  const mockFs = {
    readJSON(path, defaults = {}) {
      // Return defaults for any JSON file read
      return defaults;
    },
    read() {
      return '';
    },
    write() {},
    writeJSON() {},
    copy() {},
    copyTpl() {},
    move() {},
    delete() {},
    exists() {
      return false;
    },
    // Standard fs methods
    readFile() {},
    writeFile() {},
    mkdir() {},
    stat() {},
    // Store needs to be an event emitter for yeoman's Storage class
    store: new EventEmitter(),
  };

  return {
    cwd: process.cwd(),
    fs: mockFs,
    sharedFs: mockFs,
    adapter: {
      log() {},
      prompt() {
        return Promise.resolve({});
      },
    },
    runLoop: {
      add() {},
      queueNames: [],
      addSubQueue() {},
    },
    emit() {},
    namespace() {
      return 'test:app';
    },
    getVersion() {
      return '5.0.0';
    },
    runGenerator() {
      return Promise.resolve();
    },
    queueGenerator() {},
  };
}

/**
 * Simple test helper - just input options and get output
 * @param {Object} options - Generator options (like CLI args)
 * @returns {Promise<string>} - The captured output
 */
async function testGenerator(options) {
  const output = [];
  const originalConsoleLog = console.log;
  const originalProcessExit = process.exit;

  console.log = (...args) => output.push(args.join(' '));
  process.exit = () => {};

  try {
    const generator = new (require('../../generators/app'))([], {
      env: createMinimalYeomanEnvironment(),
      ...options,
    });

    generator.log = (...args) => output.push(args.join(' '));
    await generator.prompting();

    return output.join('\n');
  } finally {
    console.log = originalConsoleLog;
    process.exit = originalProcessExit;
  }
}

module.exports = {
  testGenerator,
};

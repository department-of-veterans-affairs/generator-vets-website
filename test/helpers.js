/**
 * Test helpers for generator testing
 * Provides utilities to test the vets-website generator
 */

const { EventEmitter } = require('events');

/**
 * Helper function to strip ANSI color codes for cleaner test output
 * @param {string} str - String that may contain ANSI codes
 * @returns {string} - Clean string without ANSI codes
 */
function stripAnsi(str) {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-9;]*m/g, '');
}

/**
 * Custom assertion that strips ANSI codes before pattern matching
 * @param {string} output - The output to test
 * @param {RegExp} pattern - The pattern to match
 * @param {string} message - Optional context message
 */
function assertOutputMatches(output, pattern, message) {
  const cleanOutput = stripAnsi(output);
  if (!pattern.test(cleanOutput)) {
    const error = new Error(
      `Output assertion failed!\n` +
        `Expected pattern: ${pattern}\n` +
        `Actual output:\n${cleanOutput}\n` +
        `${message ? `Context: ${message}` : ''}`,
    );
    error.name = 'OutputAssertionError';
    throw error;
  }
}

/**
 * Custom assertion that strips ANSI codes before checking absence
 * @param {string} output - The output to test
 * @param {RegExp} pattern - The pattern that should NOT match
 * @param {string} message - Optional context message
 */
function assertOutputDoesNotMatch(output, pattern, message) {
  const cleanOutput = stripAnsi(output);
  if (pattern.test(cleanOutput)) {
    const error = new Error(
      `Output assertion failed!\n` +
        `Expected pattern NOT to match: ${pattern}\n` +
        `But it was found in output:\n${cleanOutput}\n` +
        `${message ? `Context: ${message}` : ''}`,
    );
    error.name = 'OutputAssertionError';
    throw error;
  }
}

/**
 * Assert that the generator failed (exited) as expected
 * @param {Object} result - The test result object from testDryRun
 */
function assertFailure(result) {
  const assert = require('assert');
  assert.strictEqual(
    result.exitCalled,
    true,
    `Expected generator to fail (exit). Exit status: ${result.exitCalled}`,
  );
  assertOutputMatches(result.output, /❌ Generator would fail/);
}

/**
 * Assert that the generator succeeded (completed without exiting)
 * @param {Object} result - The test result object from testDryRun
 */
function assertSuccess(result) {
  const assert = require('assert');

  if (
    result.exitCalled ||
    !result.output.includes('✅ Generator would complete successfully')
  ) {
    // Helps give info if we have a test failure
    console.log('\n=== GENERATOR OUTPUT ===');
    console.log(result.output);
    console.log('=== END OUTPUT ===\n');
    console.log('Exit called:', result.exitCalled);
  }

  assert.strictEqual(
    result.exitCalled,
    false,
    `Expected generator to succeed (no exit). Exit status: ${result.exitCalled}`,
  );
  assertOutputMatches(result.output, /✅ Generator would complete successfully/);
  assertOutputMatches(result.output, /Files to be created\/modified:/);
  assertOutputDoesNotMatch(result.output, /❌/);
}

/**
 * Assert that the generator would create a specific number of files
 * @param {Object} result - The test result object from testDryRun
 * @param {number} expectedCount - The expected number of files to be created/modified
 */
function assertFilesCreated(result, expectedCount) {
  assertOutputMatches(
    result.output,
    new RegExp(`Files that would be created/modified: ${expectedCount}`),
    `Expected exactly ${expectedCount} files to be created/modified`,
  );
}

/**
 * Creates a mock Yeoman environment for testing
 * @returns {Object} Mock environment object
 */
function createMockYeomanEnvironment() {
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
 * Captures console output and process.exit calls while running a generator
 * @param {Function} testFunction - Function to run while capturing output
 * @returns {Promise<Object>} - Object containing output and exit info
 */
async function captureOutput(testFunction) {
  const output = [];
  const originalConsoleLog = console.log;
  const originalProcessExit = process.exit;
  let exitCalled = false;
  let exitCode = null;

  // Mock console.log to capture output
  console.log = (...args) => output.push(args.join(' '));

  // Mock process.exit to capture exit calls
  process.exit = (code = 0) => {
    exitCalled = true;
    exitCode = code;
    // Don't actually exit in tests
  };

  try {
    await testFunction();
    return {
      output: output.join('\n'),
      exitCalled,
      exitCode,
    };
  } finally {
    // Restore original functions
    console.log = originalConsoleLog;
    process.exit = originalProcessExit;
  }
}

/**
 * Test a generator with given options and return the captured output
 * @param {Object} options - Generator options (like CLI args)
 * @returns {Promise<Object>} - Object with output, exitCalled, and exitCode
 */
async function testGenerator(options = {}) {
  const Generator = require('../generators/app');

  return captureOutput(async () => {
    const generator = new Generator([], {
      env: createMockYeomanEnvironment(),
      ...options,
    });

    // Mock the generator's log method
    generator.log = (...args) => console.log(args.join(' '));

    // Run the generator lifecycle methods that would normally be called
    try {
      await generator.initializing();
      await generator.prompting();
      await generator.configuring();
      await generator.default();
      await generator.writingNewFiles();
      await generator.updateRegistry();
      await generator.end();
    } catch (_) {
      // Some errors are expected (like validation failures)
      // The output capture will have recorded any console.log calls
    }
  });
}

/**
 * Test only the dry-run functionality without full generator lifecycle
 * @param {Object} options - Generator options (like CLI args)
 * @returns {Promise<Object>} - Object with output, exitCalled, and exitCode
 */
async function testDryRun(options = {}) {
  const Generator = require('../generators/app');
  const { store } = require('../lib/store');
  const capturedExit = { called: false, code: null };

  // Reset the store before each test to prevent file accumulation
  store.reset();

  const result = await captureOutput(async () => {
    const generator = new Generator([], {
      env: createMockYeomanEnvironment(),
      ...options,
    });

    // Mock the generator's log method
    generator.log = (...args) => console.log(args.join(' '));

    // Override process.exit to capture the call and stop execution
    const originalProcessExit = process.exit;
    process.exit = (code = 0) => {
      capturedExit.called = true;
      capturedExit.code = code;
      // Restore the original process.exit
      process.exit = originalProcessExit;
      // Throw to stop execution
      throw new Error(`PROCESS_EXIT_${code}`);
    };

    try {
      await generator.initializing();

      // The prompting method handles dry-run logic and may call process.exit
      const promptResult = await generator.prompting();

      // If prompting returned early (dry-run), check if it's supposed to continue
      if (promptResult !== undefined) {
        return;
      }

      // In dry-run mode, we need to run the full lifecycle to track files
      if (options.dryRunInteractive || options.dryRunNonInteractive) {
        await generator.configuring();
        await generator.writingNewFiles();
        await generator.updateRegistry();
      }

      // If we get here, it means validation passed, so run end() for file display
      await generator.end();
    } catch (error) {
      // Check if this was a process.exit call
      if (error.message && error.message.startsWith('PROCESS_EXIT_')) {
        // This is expected for validation failures
        return;
      }

      // Other errors might be unexpected
      throw error;
    }
  });

  // Override the captureOutput result with our captured exit info
  return {
    output: result.output,
    exitCalled: capturedExit.called || result.exitCalled,
    exitCode: capturedExit.code === null ? result.exitCode : capturedExit.code,
  };
}

module.exports = {
  createMockYeomanEnvironment,
  captureOutput,
  testGenerator,
  testDryRun,
  stripAnsi,
  assertOutputMatches,
  assertOutputDoesNotMatch,
  assertFailure,
  assertSuccess,
  assertFilesCreated,
};

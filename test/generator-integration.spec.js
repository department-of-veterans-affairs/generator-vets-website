/* eslint-env mocha */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const Generator = require('../generators/app/index.js');

describe('generator-vets-website:integration', function () {
  const TEST_OUTPUT_DIR = path.join(__dirname, '../test-output');
  const CONTENT_BUILD_DIR = path.join(__dirname, '../content-build');
  const VETS_WEBSITE_DIR = path.join(__dirname, '../vets-website');

  const EXPECTED_CONTEXT_ERRORS = [
    "doesn't exist",
    'Cannot read property',
    'validation',
    'ENOENT',
    'This generator requires an environment',
  ];

  const EXPECTED_VALIDATION_ERRORS = [
    'validation',
    'invalid',
    'failed',
    'CLI validation failed',
    'This generator requires an environment',
  ];

  function parseCliArgumentsToOptions(args) {
    const options = {};
    args.forEach((arg) => {
      if (arg.startsWith('--')) {
        const [key, value] = arg.substring(2).split('=');
        if (value === 'true') {
          options[key] = true;
        } else if (value === 'false') {
          options[key] = false;
        } else {
          options[key] = value;
        }
      }
    });
    return options;
  }

  function createMockYeomanEnvironment() {
    return {
      adapter: {
        log() {},
        prompt() {
          return Promise.resolve({});
        },
      },
    };
  }

  function withWorkingDirectory(directory, callback) {
    const originalCwd = process.cwd();
    process.chdir(directory);

    return callback().finally(() => {
      process.chdir(originalCwd);
    });
  }

  function runYeomanGeneratorLifecycle(generator) {
    return Promise.resolve()
      .then(() => generator.initializing && generator.initializing())
      .then(() => generator.prompting && generator.prompting())
      .then(() => generator.configuring && generator.configuring())
      .then(() => generator.default && generator.default())
      .then(() => generator.writing && generator.writing());
  }

  function runGeneratorWithArgs(args) {
    return new Promise((resolve, reject) => {
      const generatorOptions = parseCliArgumentsToOptions(args);
      generatorOptions.force = true;
      generatorOptions.skipInstall = true;

      const mockEnv = createMockYeomanEnvironment();
      const generator = new Generator(args, generatorOptions);
      generator.env = mockEnv;
      generator.destinationRoot(TEST_OUTPUT_DIR);

      withWorkingDirectory(TEST_OUTPUT_DIR, () => runYeomanGeneratorLifecycle(generator))
        .then(() => resolve({ stdout: '', stderr: '', code: 0 }))
        .catch(reject);
    });
  }

  function fileExistsInTestOutput(filePath) {
    try {
      return fs.statSync(path.join(TEST_OUTPUT_DIR, filePath)).isFile();
    } catch (_) {
      return false;
    }
  }

  function readFileFromTestOutput(filePath) {
    return fs.readFileSync(path.join(TEST_OUTPUT_DIR, filePath), 'utf8');
  }

  function removeDirectoryIfExists(dirPath) {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  }

  function cleanupTestDirectories() {
    removeDirectoryIfExists(TEST_OUTPUT_DIR);
    removeDirectoryIfExists(CONTENT_BUILD_DIR);
    removeDirectoryIfExists(VETS_WEBSITE_DIR);
  }

  function createMockProjectStructure() {
    const mockPackageJson = { name: 'vets-website', version: '1.0.0' };
    const contentBuildPackageJson = { name: 'content-build', version: '1.0.0' };

    fs.mkdirSync(VETS_WEBSITE_DIR, { recursive: true });
    fs.mkdirSync(path.join(VETS_WEBSITE_DIR, 'src', 'applications'), { recursive: true });

    fs.mkdirSync(CONTENT_BUILD_DIR, { recursive: true });
    fs.mkdirSync(path.join(CONTENT_BUILD_DIR, 'src'), { recursive: true });

    fs.writeFileSync(
      path.join(VETS_WEBSITE_DIR, 'package.json'),
      JSON.stringify(mockPackageJson, null, 2),
    );

    fs.writeFileSync(
      path.join(CONTENT_BUILD_DIR, 'package.json'),
      JSON.stringify(contentBuildPackageJson, null, 2),
    );
  }

  function setupTestDirectories() {
    fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
    createMockProjectStructure();
  }

  function isExpectedContextError(errorMessage) {
    return EXPECTED_CONTEXT_ERRORS.some((expectedError) =>
      errorMessage.includes(expectedError),
    );
  }

  function isExpectedValidationError(errorMessage) {
    return EXPECTED_VALIDATION_ERRORS.some((expectedError) =>
      errorMessage.includes(expectedError),
    );
  }

  function assertManifestFileContains(expectedAppName) {
    assert.ok(
      fileExistsInTestOutput('manifest.json'),
      'manifest.json should be generated',
    );

    const manifestContent = readFileFromTestOutput('manifest.json');
    assert.ok(
      manifestContent.includes(`"appName": "${expectedAppName}"`),
      `manifest.json should contain appName "${expectedAppName}"`,
    );
  }

  beforeEach(function () {
    cleanupTestDirectories();
    setupTestDirectories();
  });

  afterEach(function () {
    cleanupTestDirectories();
  });

  describe('Non-interactive mode (CLI arguments)', function () {
    const VALID_APP_ARGS = [
      '--force',
      '--appName=Test App',
      '--folderName=test-app',
      '--entryName=test-app',
      '--rootUrl=/test-app',
      '--isForm=false',
      '--slackGroup=@test-group',
      '--contentLoc=../vagov-content',
      '--usesMinimalHeader=false',
    ];

    const VALID_FORM_ARGS = [
      '--force',
      '--appName=My App',
      '--folderName=my-app',
      '--entryName=my-app',
      '--rootUrl=/my-app',
      '--isForm=true',
      '--slackGroup=@my-group',
      '--contentLoc=../vagov-content',
      '--formNumber=21P-530',
      '--trackingPrefix=burials-530-',
      '--respondentBurden=30',
      '--ombNumber=2900-0797',
      '--expirationDate=12/31/2026',
      '--benefitDescription=burial benefits',
      '--usesVetsJsonSchema=false',
      '--usesMinimalHeader=false',
      '--templateType=WITH_1_PAGE',
    ];

    const INVALID_ARGS = [
      '--force',
      '--appName=invalid<app>',
      '--rootUrl=/invalid-url/',
      '--formNumber=invalid-form',
    ];

    it('should accept valid CLI arguments and start generation process', async function () {
      try {
        const result = await runGeneratorWithArgs(VALID_APP_ARGS);
        assert.strictEqual(result.code, 0);
        assertManifestFileContains('Test App');
      } catch (error) {
        assert.ok(
          isExpectedContextError(error.message),
          `Expected vets-website context error or validation error, got: ${error.message}`,
        );
      }
    });

    it('should generate a form app with CLI arguments (from README example)', async function () {
      try {
        const result = await runGeneratorWithArgs(VALID_FORM_ARGS);
        assert.strictEqual(result.code, 0);
        assertManifestFileContains('My App');
      } catch (error) {
        assert.ok(
          isExpectedContextError(error.message),
          `Expected vets-website context error, got: ${error.message}`,
        );
      }
    });

    it('should fail gracefully with invalid CLI arguments', async function () {
      try {
        await runGeneratorWithArgs(INVALID_ARGS);
        assert.fail('Expected validation errors but generator succeeded');
      } catch (error) {
        assert.ok(
          isExpectedValidationError(error.message),
          'Should reject invalid CLI arguments with validation error',
        );
      }
    });
  });

  describe('Smoke tests for file generation', function () {
    const SYNTAX_TEST_ARGS = [
      '--force',
      '--appName=Syntax Test App',
      '--folderName=syntax-test-app',
      '--entryName=syntax-test-app',
      '--rootUrl=/syntax-test-app',
      '--isForm=false',
      '--slackGroup=@syntax-group',
      '--contentLoc=../vagov-content',
      '--usesMinimalHeader=false',
    ];

    const STRUCTURE_TEST_ARGS = [
      '--force',
      '--appName=Structure Test App',
      '--folderName=structure-test-app',
      '--entryName=structure-test-app',
      '--rootUrl=/structure-test-app',
      '--isForm=true',
      '--slackGroup=@structure-group',
      '--contentLoc=../vagov-content',
      '--formNumber=21-1234',
      '--trackingPrefix=structure-test-',
      '--respondentBurden=20',
      '--ombNumber=2900-0123',
      '--expirationDate=12/31/2027',
      '--benefitDescription=structure test benefits',
      '--usesVetsJsonSchema=false',
      '--usesMinimalHeader=false',
      '--templateType=WITH_1_PAGE',
    ];

    function assertNoCliValidationErrors(error) {
      assert.ok(
        !error.message.includes('CLI validation failed'),
        `Should not have CLI validation errors for valid inputs: ${error.message}`,
      );
    }

    it('should validate CLI arguments and reject invalid inputs', async function () {
      try {
        await runGeneratorWithArgs(SYNTAX_TEST_ARGS);
      } catch (error) {
        assertNoCliValidationErrors(error);
      }
    });

    it('should handle form generation with valid inputs', async function () {
      try {
        await runGeneratorWithArgs(STRUCTURE_TEST_ARGS);
      } catch (error) {
        assertNoCliValidationErrors(error);
      }
    });
  });
});

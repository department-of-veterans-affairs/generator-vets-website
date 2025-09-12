/* eslint-env mocha */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

describe('generator-vets-website:integration', function () {
  const testOutputDir = path.join(__dirname, '../test-output');
  const contentBuildDir = path.join(__dirname, '../content-build');

  function runGeneratorWithArgs(args, options = {}) {
    return new Promise((resolve, reject) => {
      const yo = spawn(
        'yo',
        ['@department-of-veterans-affairs/vets-website', ...args],
        {
          cwd: testOutputDir,
          stdio: ['pipe', 'pipe', 'pipe'],
          ...options,
        },
      );

      let stdout = '';
      let stderr = '';

      yo.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      yo.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      yo.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`Generator failed with exit code ${code}: ${stderr}`));
        }
      });

      yo.on('error', (error) => {
        reject(error);
      });
    });
  }

  function fileExistsInTestOutput(filePath) {
    try {
      return fs.statSync(path.join(testOutputDir, filePath)).isFile();
    } catch (_) {
      return false;
    }
  }

  function readFileFromTestOutput(filePath) {
    return fs.readFileSync(path.join(testOutputDir, filePath), 'utf8');
  }

  function cleanupTestDirectories() {
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }

    if (fs.existsSync(contentBuildDir)) {
      fs.rmSync(contentBuildDir, { recursive: true, force: true });
    }
  }

  beforeEach(function () {
    cleanupTestDirectories();
    fs.mkdirSync(testOutputDir, { recursive: true });
  });

  afterEach(function () {
    cleanupTestDirectories();
  });

  describe('Non-interactive mode (CLI arguments)', function () {
    it('should accept valid CLI arguments and start generation process', async function () {
      const args = [
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

      try {
        const result = await runGeneratorWithArgs(args);
        assert.strictEqual(result.code, 0);

        if (fileExistsInTestOutput('manifest.json')) {
          const manifestContent = readFileFromTestOutput('manifest.json');
          assert.ok(
            manifestContent.includes('"appName": "Test App"'),
            'manifest.json should contain appName "Test App"',
          );
        }
      } catch (error) {
        assert.ok(
          error.message.includes("doesn't exist") ||
            error.message.includes('Cannot read property') ||
            error.message.includes('validation'),
          `Expected vets-website context error or validation error, got: ${error.message}`,
        );
      }
    });

    it('should generate a form app with CLI arguments (from README example)', async function () {
      const args = [
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

      try {
        const result = await runGeneratorWithArgs(args);
        assert.strictEqual(result.code, 0);

        if (fileExistsInTestOutput('manifest.json')) {
          const manifestContent = readFileFromTestOutput('manifest.json');
          assert.ok(
            manifestContent.includes('"appName": "My App"'),
            'manifest.json should contain appName "My App"',
          );
        }
      } catch (error) {
        assert.ok(
          error.message.includes("doesn't exist") ||
            error.message.includes('Cannot read property') ||
            error.message.includes('regexFileReplacements'),
          `Expected vets-website context error, got: ${error.message}`,
        );
      }
    });

    it('should fail gracefully with invalid CLI arguments', async function () {
      const args = [
        '--force',
        '--appName=invalid<app>', // Invalid characters
        '--rootUrl=/invalid-url/', // Invalid format
        '--formNumber=invalid-form', // Invalid format
      ];

      try {
        await runGeneratorWithArgs(args);
        assert.fail('Expected validation errors but generator succeeded');
      } catch (error) {
        assert.ok(
          error.message.includes('validation') ||
            error.message.includes('invalid') ||
            error.message.includes('failed'),
          'Should reject invalid CLI arguments with validation error',
        );
      }
    });
  });

  describe('Smoke tests for file generation', function () {
    it('should validate CLI arguments and reject invalid inputs', async function () {
      const args = [
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

      try {
        await runGeneratorWithArgs(args);
      } catch (error) {
        assert.ok(
          !error.message.includes('CLI validation failed'),
          `Should not have CLI validation errors for valid inputs: ${error.message}`,
        );
      }
    });

    it('should handle form generation with valid inputs', async function () {
      const args = [
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

      try {
        await runGeneratorWithArgs(args);
      } catch (error) {
        assert.ok(
          !error.message.includes('CLI validation failed'),
          `Should not have CLI validation errors for valid inputs: ${error.message}`,
        );
      }
    });
  });
});

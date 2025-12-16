const {
  testDryRun,
  assertOutputMatches,
  assertFailure,
  assertSuccess,
  assertOutputDoesNotMatch,
  assertFilesCreated,
} = require('./helpers');

const { FILE_COUNT_EXPECTATIONS } = require('./constants');

describe('Interactive Dry Run Mode', () => {
  describe('Validation Errors', () => {
    it('should show validation errors for missing app-name in interactive mode', async () => {
      const result = await testDryRun({
        dryRunInteractive: true,
        // Missing required appName field
      });

      assertFailure(result);
      assertOutputMatches(result.output, /❌ Validation errors:/);
      assertOutputMatches(result.output, /--app-name: Required/);
      assertOutputMatches(result.output, /--form-number: Required/);

      // These can be computed from appName, so not strictly required
      assertOutputDoesNotMatch(result.output, /--entry-name: Required/);
      assertOutputDoesNotMatch(result.output, /--folder-name: Required/);
      assertOutputDoesNotMatch(result.output, /--root-url: Required/);
      assertOutputDoesNotMatch(result.output, /--is-form: Required/);
    });

    it('should fail when app-name provided but form-number missing', async () => {
      const result = await testDryRun({
        dryRunInteractive: true,
        appName: 'Test App',
        // Missing formNumber - should fail because isForm defaults to true
      });

      assertFailure(result);
      assertOutputMatches(result.output, /❌ Validation errors:/);
      assertOutputMatches(result.output, /--form-number: Required/);

      // These can be computed from appName, so not strictly required
      assertOutputDoesNotMatch(result.output, /--entry-name: Required/);
      assertOutputDoesNotMatch(result.output, /--folder-name: Required/);
      assertOutputDoesNotMatch(result.output, /--root-url: Required/);
      assertOutputDoesNotMatch(result.output, /--is-form: Required/);
    });

    it('should fail when form-number has invalid format', async () => {
      const result = await testDryRun({
        dryRunInteractive: true,
        appName: 'Test App',
        formNumber: 'invalid-format', // Should fail validation
      });

      assertFailure(result);
      assertOutputMatches(result.output, /❌ Validation errors:/);
      assertOutputMatches(result.output, /Form number should follow VA format/);
    });
  });

  describe('Successful Validation', () => {
    it('should succeed when isForm=false and no form-number provided', async () => {
      const result = await testDryRun({
        dryRunInteractive: true,
        appName: 'Test App',
        isForm: 'false',
      });

      assertSuccess(result);
      assertFilesCreated(result, FILE_COUNT_EXPECTATIONS.NON_FORM_APP);
    });

    it('should succeed when minimal form criteria provided', async () => {
      const result = await testDryRun({
        dryRunInteractive: true,
        appName: 'Test App',
        formNumber: '10-10EE',
      });

      assertSuccess(result);
      assertFilesCreated(result, FILE_COUNT_EXPECTATIONS.FORM_1_PAGE);
    });

    it('should succeed when isForm=n and no form-number provided', async () => {
      const result = await testDryRun({
        dryRunInteractive: true,
        appName: 'Test App',
        isForm: 'n', // Test 'n' variant like non-interactive mode
      });

      assertSuccess(result);
      assertFilesCreated(result, FILE_COUNT_EXPECTATIONS.NON_FORM_APP); // Should generate app files, not form files
    });

    it('should compute folder-name, entry-name, and root-url from app-name', async () => {
      const result = await testDryRun({
        dryRunInteractive: true,
        appName: 'My Test Application',
        formNumber: '22-1234',
      });

      assertSuccess(result);
      assertOutputMatches(
        result.output,
        /folderName: my-test-application \(computed default\)/,
      );
      assertOutputMatches(
        result.output,
        /entryName: my-test-application \(computed default\)/,
      );
      assertOutputMatches(
        result.output,
        /rootUrl: \/my-test-application \(computed default\)/,
      );
    });

    it('should show correct source for all configuration items', async () => {
      const result = await testDryRun({
        dryRunInteractive: true,
        appName: 'Test Configuration App', // CLI arg
        formNumber: '22-5678', // CLI arg
        folderName: 'custom-test-folder', // CLI arg
        // entryName omitted - should be computed default
        // rootUrl omitted - should be computed default
        // isForm omitted - should be prompt (defaults to true)
        // All other form fields omitted - should be prompt defaults
      });

      assertSuccess(result);

      // Prompt answers - values we provided (simulating interactive answers)
      assertOutputMatches(
        result.output,
        /appName: Test Configuration App \(prompt answer\)/,
      );
      assertOutputMatches(result.output, /formNumber: 22-5678 \(prompt answer\)/);
      assertOutputMatches(
        result.output,
        /folderName: custom-test-folder \(prompt answer\)/,
      );

      // Computed defaults - calculated from other values
      assertOutputMatches(
        result.output,
        /entryName: test-configuration-app \(computed default\)/,
      );
      assertOutputMatches(
        result.output,
        /rootUrl: \/test-configuration-app \(computed default\)/,
      );
      assertOutputMatches(
        result.output,
        /trackingPrefix: test-configuration-app- \(computed default\)/,
      );
      assertOutputMatches(
        result.output,
        /expirationDate: \d+\/\d+\/\d+ \(computed default\)/,
      );

      // Computed values - system calculated
      assertOutputMatches(result.output, /contentRepoLocation: .+ \(computed\)/);

      // Defaults - would use prompt defaults since we didn't answer them
      assertOutputMatches(result.output, /isForm: true \(default\)/);
      assertOutputMatches(result.output, /slackGroup: none \(default\)/);
      assertOutputMatches(result.output, /benefitDescription: benefits \(default\)/);
      assertOutputMatches(result.output, /respondentBurden: 30 \(default\)/);
      assertOutputMatches(result.output, /ombNumber: 1234-5678 \(default\)/);
      assertOutputMatches(result.output, /usesVetsJsonSchema: false \(default\)/);
      assertOutputMatches(result.output, /usesMinimalHeader: true \(default\)/);
      assertOutputMatches(result.output, /addToMyVaSip: true \(default\)/);
      assertOutputMatches(result.output, /templateType: WITH_1_PAGE \(default\)/);
    });
  });
});

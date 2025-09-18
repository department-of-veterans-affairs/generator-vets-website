const assert = require('assert');
const {
  testDryRun,
  assertOutputMatches,
  assertOutputDoesNotMatch,
  assertFailure,
  assertSuccess,
  assertFilesCreated,
  stripAnsi,
} = require('./helpers');

describe('Non-Interactive Dry Run Mode', () => {
  describe('Validation Errors', () => {
    it('should show validation errors for missing required fields', async () => {
      const result = await testDryRun({
        dryRunNonInteractive: true,
        appName: 'Test App',
      });

      assertFailure(result);
      assertOutputMatches(result.output, /❌ Validation errors:/);
      assertOutputMatches(result.output, /--folder-name: Required/);
      assertOutputMatches(result.output, /--entry-name: Required/);
      assertOutputMatches(result.output, /--root-url: Required/);
      assertOutputMatches(result.output, /--is-form: Required/);
    });

    it('should validate form number format', async () => {
      const result = await testDryRun({
        dryRunNonInteractive: true,
        appName: 'Test App',
        folderName: 'test-app',
        entryName: 'test-app',
        rootUrl: '/test-app',
        isForm: 'true',
        formNumber: 'invalid-format',
      });

      assertFailure(result);
      assertOutputMatches(result.output, /❌ Validation errors:/);
      assertOutputMatches(
        result.output,
        /formNumber.*Form number should follow VA format/,
      );
    });
  });

  describe('Successful Validation', () => {
    it('should succeed for non-form app with all required fields', async () => {
      const result = await testDryRun({
        dryRunNonInteractive: true,
        appName: 'Test App',
        folderName: 'test-app',
        entryName: 'test-app',
        rootUrl: '/test-app',
        isForm: 'false',
      });

      assertSuccess(result);
      assertFilesCreated(result, 8);
    });

    it('should succeed for form app with all required fields', async () => {
      const result = await testDryRun({
        dryRunNonInteractive: true,
        appName: 'Test Form',
        folderName: 'test-form',
        entryName: 'test-form',
        rootUrl: '/test-form',
        isForm: 'true',
        formNumber: '22-1234',
        benefitDescription: 'disability benefits',
        ombNumber: '2900-1234',
        expirationDate: '12/31/2026',
        templateType: 'WITH_1_PAGE',
      });

      assertSuccess(result);
      assertFilesCreated(result, 18); // 1-page form template
    });

    it('should succeed for 4-page form app with all required fields', async () => {
      const result = await testDryRun({
        dryRunNonInteractive: true,
        appName: 'Test 4-Page Form',
        folderName: 'test-4-page-form',
        entryName: 'test-4-page-form',
        rootUrl: '/test-4-page-form',
        isForm: 'true',
        formNumber: '22-5678',
        benefitDescription: 'education benefits',
        ombNumber: '2900-5678',
        expirationDate: '12/31/2026',
        templateType: 'WITH_4_PAGES',
      });

      assertSuccess(result);
      assertFilesCreated(result, 21); // 4-page form template (18 + 3 additional pages = 21)
    });

    it('should require form-specific fields only when isForm=true', async () => {
      const formResult = await testDryRun({
        dryRunNonInteractive: true,
        appName: 'Test Form',
        folderName: 'test-form',
        entryName: 'test-form',
        rootUrl: '/test-form',
        isForm: 'true',
      });

      assertFailure(formResult);
      assertOutputMatches(
        formResult.output,
        /--form-number: Required|--benefit-description: Required|--omb-number: Required/,
      );

      // Test that form fields are NOT required when isForm=false
      const nonFormResult = await testDryRun({
        dryRunNonInteractive: true,
        appName: 'Test App',
        folderName: 'test-app',
        entryName: 'test-app',
        rootUrl: '/test-app',
        isForm: 'false',
        // No form-specific fields provided
      });

      assert(
        !nonFormResult.exitCalled,
        'Non-form app should succeed without form fields',
      );
      assert(
        nonFormResult.output.includes('✅ Generator would complete successfully'),
        'Should succeed for non-form app',
      );
    });

    it('should treat isForm "y" as true', async () => {
      const result = await testDryRun({
        dryRunNonInteractive: true,
        appName: 'Test Form Y',
        folderName: 'test-form-y',
        entryName: 'test-form-y',
        rootUrl: '/test-form-y',
        isForm: 'y',
        formNumber: '22-1234',
        benefitDescription: 'disability benefits',
        ombNumber: '2900-1234',
        expirationDate: '12/31/2026',
        templateType: 'WITH_1_PAGE',
      });

      assertSuccess(result);
      assertFilesCreated(result, 18); // Should generate form files like isForm=true
    });

    it('should treat isForm "n" as false', async () => {
      const result = await testDryRun({
        dryRunNonInteractive: true,
        appName: 'Test App N',
        folderName: 'test-app-n',
        entryName: 'test-app-n',
        rootUrl: '/test-app-n',
        isForm: 'n',
      });

      assertSuccess(result);
      assertFilesCreated(result, 8); // Should generate app files like isForm=false
    });

    it('should require isForm field in non-interactive mode', async () => {
      const result = await testDryRun({
        dryRunNonInteractive: true,
        appName: 'Test App',
        folderName: 'test-app',
        entryName: 'test-app',
        rootUrl: '/test-app',
        // IsForm omitted
      });

      assertFailure(result);
      assertOutputMatches(result.output, /--is-form: Required/);
    });

    it('should succeed for form engine template with minimal files', async () => {
      const result = await testDryRun({
        dryRunNonInteractive: true,
        appName: 'Test Form Engine',
        folderName: 'test-form-engine',
        entryName: 'test-form-engine',
        rootUrl: '/test-form-engine',
        isForm: 'true',
        formNumber: '22-9999',
        benefitDescription: 'form engine benefits',
        ombNumber: '2900-9999',
        expirationDate: '12/31/2026',
        templateType: 'FORM_ENGINE',
      });

      assertSuccess(result);
      assertFilesCreated(result, 3); // Form engine template should generate minimal files
    });
  });

  describe('Output Format', () => {
    it('should not show file analysis when validation fails', async () => {
      const result = await testDryRun({
        dryRunNonInteractive: true,
        appName: 'Test App',
        // Missing required fields
      });

      assertFailure(result);
      assertOutputMatches(result.output, /❌ Validation errors:/);
      assertOutputDoesNotMatch(result.output, /DRY RUN - File analysis/);
      assertOutputDoesNotMatch(result.output, /Files to be created:/);
    });

    it('should show clean error format in CLI style', async () => {
      const result = await testDryRun({
        dryRunNonInteractive: true,
        appName: 'Test App',
      });

      // All errors should be in CLI format (--field-name) not property format (fieldName)
      const lines = result.output.split('\n');
      const errorLines = lines.filter((line) =>
        line.includes('Required when using non-interactive mode'),
      );

      errorLines.forEach((line) => {
        const cleanLine = stripAnsi(line);
        assert(
          cleanLine.includes('--'),
          `Error should use CLI format with --. Line: ${cleanLine}`,
        );
        assert(
          /--[a-z-]+:/.test(cleanLine),
          `Should use kebab-case CLI format. Line: ${cleanLine}`,
        );
      });
    });

    it('should show helpful error when only --dry-run-non-interactive is provided', async () => {
      const result = await testDryRun({
        dryRunNonInteractive: true,
      });

      // Should show validation errors for all required fields
      assertOutputMatches(result.output, /Required when using non-interactive mode/);
      assertOutputMatches(result.output, /--app-name:/);
      assertOutputMatches(result.output, /--folder-name:/);
      assertOutputMatches(result.output, /--entry-name:/);
      assertOutputMatches(result.output, /--root-url:/);
      assertOutputMatches(result.output, /--is-form:/);

      // Should NOT show file analysis
      assertOutputDoesNotMatch(result.output, /DRY RUN - File analysis/);
      assertOutputDoesNotMatch(result.output, /Files to be created:/);
    });

    it('should display configuration with correct source labels for CLI args', async () => {
      const result = await testDryRun({
        dryRunNonInteractive: true,
        appName: 'Test Configuration App',
        folderName: 'custom-test-folder',
        entryName: 'custom-entry',
        rootUrl: '/custom-root',
        isForm: 'true',
        formNumber: '22-5678',
        benefitDescription: 'education benefits',
        ombNumber: '2900-5678',
        expirationDate: '12/31/2026',
        templateType: 'WITH_1_PAGE',
        slackGroup: 'education-team',
        respondentBurden: '45',
        usesVetsJsonSchema: 'true',
        usesMinimalHeader: 'false',
        trackingPrefix: 'custom-prefix-',
      });

      assertSuccess(result);
      assertOutputMatches(result.output, /appName: Test Configuration App \(CLI arg\)/);
      assertOutputMatches(result.output, /formNumber: 22-5678 \(CLI arg\)/);
      assertOutputMatches(result.output, /folderName: custom-test-folder \(CLI arg\)/);
      assertOutputMatches(result.output, /entryName: custom-entry \(CLI arg\)/);
      assertOutputMatches(result.output, /rootUrl: \/custom-root \(CLI arg\)/);
      assertOutputMatches(result.output, /isForm: true \(CLI arg\)/);
      assertOutputMatches(
        result.output,
        /benefitDescription: education benefits \(CLI arg\)/,
      );
      assertOutputMatches(result.output, /ombNumber: 2900-5678 \(CLI arg\)/);
      assertOutputMatches(result.output, /templateType: WITH_1_PAGE \(CLI arg\)/);
      assertOutputMatches(result.output, /slackGroup: education-team \(CLI arg\)/);
      assertOutputMatches(result.output, /respondentBurden: 45 \(CLI arg\)/);
      assertOutputMatches(result.output, /usesVetsJsonSchema: true \(CLI arg\)/);
      assertOutputMatches(result.output, /usesMinimalHeader: true \(CLI arg\)/);
      assertOutputMatches(result.output, /trackingPrefix: custom-prefix- \(CLI arg\)/);
      assertOutputMatches(result.output, /contentRepoLocation: .+ \(computed\)/);
      assertOutputMatches(result.output, /expirationDate: \d+\/\d+\/\d+ \(CLI arg\)/);
    });

    it('should validate all source types with minimal CLI arguments', async () => {
      const result = await testDryRun({
        dryRunNonInteractive: true,
        appName: 'Minimal Test App',
        folderName: 'minimal-test',
        entryName: 'minimal-test',
        rootUrl: '/minimal-test',
        isForm: 'true',
        formNumber: '21-5555',
        benefitDescription: 'test benefits',
        ombNumber: '2900-1234',
        expirationDate: '12/31/2026',
      });

      assertSuccess(result);
      assertOutputMatches(result.output, /appName: Minimal Test App \(CLI arg\)/);
      assertOutputMatches(result.output, /folderName: minimal-test \(CLI arg\)/);
      assertOutputMatches(result.output, /entryName: minimal-test \(CLI arg\)/);
      assertOutputMatches(result.output, /rootUrl: \/minimal-test \(CLI arg\)/);
      assertOutputMatches(result.output, /isForm: true \(CLI arg\)/);
      assertOutputMatches(result.output, /formNumber: 21-5555 \(CLI arg\)/);
      assertOutputMatches(result.output, /benefitDescription: test benefits \(CLI arg\)/);
      assertOutputMatches(result.output, /ombNumber: 2900-1234 \(CLI arg\)/);
      assertOutputMatches(result.output, /expirationDate: 12\/31\/2026 \(CLI arg\)/);
      assertOutputMatches(result.output, /contentRepoLocation: .+ \(computed\)/);
      assertOutputMatches(result.output, /slackGroup: none \(default\)/);
      assertOutputMatches(result.output, /respondentBurden: 30 \(default\)/);
      assertOutputMatches(result.output, /usesVetsJsonSchema: false \(default\)/);
      assertOutputMatches(result.output, /usesMinimalHeader: true \(default\)/);
      assertOutputMatches(result.output, /templateType: WITH_1_PAGE \(default\)/);
      assertOutputMatches(
        result.output,
        /trackingPrefix: minimal-test- \(computed default\)/,
      );
    });
  });
});

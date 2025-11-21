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
const { FILE_COUNT_EXPECTATIONS } = require('./constants');

describe('Non-Interactive Dry Run Mode', () => {
  describe('Validation Errors', () => {
    it('should show validation errors for missing required fields', async () => {
      const result = await testDryRun({
        dryRunNonInteractive: true,
        appName: 'Test App',
      });

      assertFailure(result);
      assertOutputMatches(result.output, /❌ Validation errors:/);
      assertOutputMatches(result.output, /--folderName: Required/);
      assertOutputMatches(result.output, /--entryName: Required/);
      assertOutputMatches(result.output, /--rootUrl: Required/);
      assertOutputMatches(result.output, /--isForm: Required/);
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

  describe('CLI Argument Format Support', () => {
    it('should accept camelCase CLI arguments', async () => {
      const result = await testDryRun({
        dryRunNonInteractive: true,
        appName: 'Test App',
        folderName: 'test-app',
        entryName: 'test-app',
        rootUrl: '/test-app',
        isForm: 'false',
      });

      assertSuccess(result);
      assertOutputMatches(result.output, /✅ Generator would complete successfully/);
    });

    it('should accept kebab-case CLI arguments via dual registration', async () => {
      // Note: This test uses the test helper's option object format,
      // But verifies that our dual option registration system would work
      // For actual CLI usage with kebab-case like --is-form, --folder-name, etc.
      const result = await testDryRun({
        dryRunNonInteractive: true,
        appName: 'Test App',
        'folder-name': 'test-app', // Kebab-case option name
        'entry-name': 'test-app', // Kebab-case option name
        'root-url': '/test-app', // Kebab-case option name
        'is-form': 'false', // Kebab-case option name
      });

      assertSuccess(result);
      assertOutputMatches(result.output, /✅ Generator would complete successfully/);
    });

    it('should support backward compatibility for contentLoc -> contentRepoLocation', async () => {
      const result = await testDryRun({
        dryRunNonInteractive: true,
        appName: 'Test App',
        folderName: 'test-app',
        entryName: 'test-app',
        rootUrl: '/test-app',
        isForm: 'false',
        contentLoc: '/legacy/path/to/vagov-content', // Legacy option name
      });

      assertSuccess(result);
      assertOutputMatches(
        result.output,
        /contentRepoLocation: \/legacy\/path\/to\/vagov-content \(computed\)/,
      );
    });

    it('should prefer contentRepoLocation over contentLoc when both provided', async () => {
      const result = await testDryRun({
        dryRunNonInteractive: true,
        appName: 'Test App',
        folderName: 'test-app',
        entryName: 'test-app',
        rootUrl: '/test-app',
        isForm: 'false',
        contentLoc: '/legacy/path/to/vagov-content', // Legacy option
        contentRepoLocation: '/new/path/to/vagov-content', // New option
      });

      assertSuccess(result);
      assertOutputMatches(
        result.output,
        /contentRepoLocation: \/new\/path\/to\/vagov-content \(computed\)/,
      );
      assertOutputDoesNotMatch(
        result.output,
        /contentRepoLocation: \/legacy\/path\/to\/vagov-content/,
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
      assertFilesCreated(result, FILE_COUNT_EXPECTATIONS.NON_FORM_APP);
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
      assertFilesCreated(result, FILE_COUNT_EXPECTATIONS.FORM_1_PAGE);
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
      assertFilesCreated(result, FILE_COUNT_EXPECTATIONS.FORM_4_PAGES);
    });

    it('should succeed for 1-page form with vets json schema enabled', async () => {
      const result = await testDryRun({
        dryRunNonInteractive: true,
        appName: 'Test 1-Page Form with Schema',
        folderName: 'test-1-page-schema',
        entryName: 'test-1-page-schema',
        rootUrl: '/test-1-page-schema',
        isForm: 'true',
        formNumber: '22-1111',
        benefitDescription: 'disability benefits with schema',
        ombNumber: '2900-1111',
        expirationDate: '12/31/2026',
        templateType: 'WITH_1_PAGE',
        usesVetsJsonSchema: 'true',
      });

      assertSuccess(result);
      assertFilesCreated(
        result,
        FILE_COUNT_EXPECTATIONS.FORM_1_PAGE_WITH_VETS_JSON_SCHEMA,
      );
    });

    it('should succeed for 4-page form with vets json schema enabled', async () => {
      const result = await testDryRun({
        dryRunNonInteractive: true,
        appName: 'Test 4-Page Form with Schema',
        folderName: 'test-4-page-schema',
        entryName: 'test-4-page-schema',
        rootUrl: '/test-4-page-schema',
        isForm: 'true',
        formNumber: '22-2222',
        benefitDescription: 'education benefits with schema',
        ombNumber: '2900-2222',
        expirationDate: '12/31/2026',
        templateType: 'WITH_4_PAGES',
        usesVetsJsonSchema: 'true',
      });

      assertSuccess(result);
      assertFilesCreated(
        result,
        FILE_COUNT_EXPECTATIONS.FORM_4_PAGES_WITH_VETS_JSON_SCHEMA,
      );
    });

    it('should succeed for 1-page form with vets json schema disabled', async () => {
      const result = await testDryRun({
        dryRunNonInteractive: true,
        appName: 'Test 1-Page Form without Schema',
        folderName: 'test-1-page-no-schema',
        entryName: 'test-1-page-no-schema',
        rootUrl: '/test-1-page-no-schema',
        isForm: 'true',
        formNumber: '22-3333',
        benefitDescription: 'disability benefits without schema',
        ombNumber: '2900-3333',
        expirationDate: '12/31/2026',
        templateType: 'WITH_1_PAGE',
        usesVetsJsonSchema: 'false',
      });

      assertSuccess(result);
      assertFilesCreated(result, FILE_COUNT_EXPECTATIONS.FORM_1_PAGE);
    });

    it('should succeed for 4-page form with vets json schema disabled', async () => {
      const result = await testDryRun({
        dryRunNonInteractive: true,
        appName: 'Test 4-Page Form without Schema',
        folderName: 'test-4-page-no-schema',
        entryName: 'test-4-page-no-schema',
        rootUrl: '/test-4-page-no-schema',
        isForm: 'true',
        formNumber: '22-4444',
        benefitDescription: 'education benefits without schema',
        ombNumber: '2900-4444',
        expirationDate: '12/31/2026',
        templateType: 'WITH_4_PAGES',
        usesVetsJsonSchema: 'false',
      });

      assertSuccess(result);
      assertFilesCreated(result, FILE_COUNT_EXPECTATIONS.FORM_4_PAGES);
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
        /--formNumber: Required|--benefitDescription: Required|--ombNumber: Required/,
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
      assertFilesCreated(result, FILE_COUNT_EXPECTATIONS.FORM_1_PAGE);
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
      assertFilesCreated(result, FILE_COUNT_EXPECTATIONS.NON_FORM_APP);
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
      assertOutputMatches(result.output, /--isForm: Required/);
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
      assertFilesCreated(result, FILE_COUNT_EXPECTATIONS.FORM_ENGINE);
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
      assertOutputDoesNotMatch(result.output, /Files to be created\/modified:/);
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
          /--[a-zA-Z]+:/.test(cleanLine),
          `Should use camelCase CLI format. Line: ${cleanLine}`,
        );
      });
    });

    it('should show helpful error when only --dry-run-non-interactive is provided', async () => {
      const result = await testDryRun({
        dryRunNonInteractive: true,
      });

      // Should show validation errors for all required fields
      assertOutputMatches(result.output, /Required when using non-interactive mode/);
      assertOutputMatches(result.output, /--appName:/);
      assertOutputMatches(result.output, /--folderName:/);
      assertOutputMatches(result.output, /--entryName:/);
      assertOutputMatches(result.output, /--rootUrl:/);
      assertOutputMatches(result.output, /--isForm:/);

      // Should NOT show file analysis
      assertOutputDoesNotMatch(result.output, /DRY RUN - File analysis/);
      assertOutputDoesNotMatch(result.output, /Files to be created\/modified:/);
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
        addToMyVaSip: 'false',
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
      assertOutputMatches(result.output, /usesMinimalHeader: false \(CLI arg\)/);
      assertOutputMatches(result.output, /addToMyVaSip: false \(CLI arg\)/);
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
      assertOutputMatches(result.output, /addToMyVaSip: true \(default\)/);
      assertOutputMatches(result.output, /templateType: WITH_1_PAGE \(default\)/);
      assertOutputMatches(
        result.output,
        /trackingPrefix: minimal-test- \(computed default\)/,
      );
    });
  });
});

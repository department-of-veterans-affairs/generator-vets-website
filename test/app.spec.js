/* eslint-env mocha */
const assert = require('assert');
const { checkForDuplicates } = require('../utils/duplicate-detection');
const { validateAllCliArguments } = require('../utils/cli-validation');

describe('generator-vets-website:app', function () {
  describe('CLI validation integration', function () {
    it('should detect validation errors for invalid CLI arguments', function () {
      const invalidOptions = {
        rootUrl: '/invalid-url/', // Should fail validation
        appName: 'invalid<app>', // Should fail validation - invalid characters
        formNumber: 'invalid-form', // Should fail validation
      };

      const errors = validateAllCliArguments(invalidOptions);

      assert.ok(errors.length > 0, 'Should have validation errors');
      assert.ok(errors.some((err) => err.includes('rootUrl:')));
      assert.ok(errors.some((err) => err.includes('appName:')));
      assert.ok(errors.some((err) => err.includes('formNumber:')));
    });

    it('should pass validation for valid CLI arguments', function () {
      const validOptions = {
        rootUrl: '/valid-url',
        appName: 'valid-app-name',
        entryName: 'valid-entry-name',
        formNumber: '22-0993',
        ombNumber: '2900-0001',
        respondentBurden: '15',
        templateType: 'WITH_1_PAGE',
      };

      const errors = validateAllCliArguments(validOptions);

      assert.strictEqual(errors.length, 0, 'Should have no validation errors');
    });

    it('should handle empty options gracefully', function () {
      const emptyOptions = {};

      const errors = validateAllCliArguments(emptyOptions);

      assert.strictEqual(errors.length, 0, 'Should handle empty options without errors');
    });
  });

  describe('duplicate detection integration', function () {
    it('should use the checkForDuplicates utility correctly', function () {
      const mockRegistry = [
        {
          appName: 'Existing Test App',
          entryName: 'existing-test-app',
          rootUrl: '/existing-test-app',
          productId: 'existing-test-id',
        },
      ];

      const newApp = {
        appName: 'Existing Test App', // This should trigger duplicate detection
        entryName: 'new-test-app',
        rootUrl: '/new-test-app',
        productId: 'new-test-id',
      };

      const duplicates = checkForDuplicates(mockRegistry, newApp);

      // Verify the utility function works as expected in the generator context
      assert.strictEqual(duplicates.length, 1);
      assert.ok(duplicates[0].includes('App Name'));
      assert.ok(duplicates[0].includes('Existing Test App'));
    });

    it('should validate generator can handle multiple types of duplicates', function () {
      const mockRegistry = [
        {
          appName: 'App One',
          entryName: 'app-one',
          rootUrl: '/app-one',
          productId: 'app-one-id',
        },
        {
          appName: 'App Two',
          entryName: 'app-two',
          rootUrl: '/app-two',
          productId: 'app-two-id',
        },
      ];

      // Test case that should trigger multiple duplicates
      const newAppWithMultipleDuplicates = {
        appName: 'App One', // Duplicate
        entryName: 'app-two', // Duplicate
        rootUrl: '/new-app',
        productId: 'new-id',
      };

      const duplicates = checkForDuplicates(mockRegistry, newAppWithMultipleDuplicates);

      assert.strictEqual(duplicates.length, 2);
      assert.ok(duplicates.some((d) => d.includes('App Name')));
      assert.ok(duplicates.some((d) => d.includes('Entry Name')));
    });

    it('should pass when app is completely unique', function () {
      const mockRegistry = [
        {
          appName: 'Existing App',
          entryName: 'existing-app',
          rootUrl: '/existing-app',
          productId: 'existing-id',
        },
      ];

      const uniqueApp = {
        appName: 'Completely Unique App',
        entryName: 'completely-unique-app',
        rootUrl: '/completely-unique-app',
        productId: 'completely-unique-id',
      };

      const duplicates = checkForDuplicates(mockRegistry, uniqueApp);

      assert.strictEqual(duplicates.length, 0);
    });
  });
});

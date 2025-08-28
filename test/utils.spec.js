/* eslint-env mocha */
const assert = require('assert');
const { checkForDuplicates } = require('../utils/duplicate-detection');

describe('utils/duplicate-detection', function () {
  const mockRegistry = [
    {
      appName: 'Existing App',
      entryName: 'existing-app',
      rootUrl: '/existing-app',
      productId: 'existing-product-id',
    },
    {
      appName: 'Another App',
      entryName: 'another-app',
      rootUrl: '/another-app',
      productId: 'another-product-id',
    },
  ];

  describe('checkForDuplicates', function () {
    it('should detect duplicate appName', function () {
      const newApp = {
        appName: 'Existing App',
        entryName: 'new-app',
        rootUrl: '/new-app',
        productId: 'new-id',
      };

      const duplicates = checkForDuplicates(mockRegistry, newApp);
      assert.strictEqual(duplicates.length, 1);
      assert.ok(duplicates[0].includes('App Name'));
      assert.ok(duplicates[0].includes('Existing App'));
    });

    it('should detect duplicate entryName', function () {
      const newApp = {
        appName: 'New App',
        entryName: 'existing-app',
        rootUrl: '/new-app',
        productId: 'new-id',
      };

      const duplicates = checkForDuplicates(mockRegistry, newApp);
      assert.strictEqual(duplicates.length, 1);
      assert.ok(duplicates[0].includes('Entry Name'));
      assert.ok(duplicates[0].includes('existing-app'));
    });

    it('should detect duplicate rootUrl', function () {
      const newApp = {
        appName: 'New App',
        entryName: 'new-app',
        rootUrl: '/existing-app',
        productId: 'new-id',
      };

      const duplicates = checkForDuplicates(mockRegistry, newApp);
      assert.strictEqual(duplicates.length, 1);
      assert.ok(duplicates[0].includes('Root URL'));
      assert.ok(duplicates[0].includes('/existing-app'));
    });

    it('should detect duplicate productId', function () {
      const newApp = {
        appName: 'New App',
        entryName: 'new-app',
        rootUrl: '/new-app',
        productId: 'existing-product-id',
      };

      const duplicates = checkForDuplicates(mockRegistry, newApp);
      assert.strictEqual(duplicates.length, 1);
      assert.ok(duplicates[0].includes('Product ID'));
      assert.ok(duplicates[0].includes('existing-product-id'));
    });

    it('should detect multiple duplicates', function () {
      const newApp = {
        appName: 'Existing App',
        entryName: 'another-app',
        rootUrl: '/new-app',
        productId: 'new-id',
      };

      const duplicates = checkForDuplicates(mockRegistry, newApp);
      assert.strictEqual(duplicates.length, 2);
      assert.ok(duplicates.some((d) => d.includes('App Name')));
      assert.ok(duplicates.some((d) => d.includes('Entry Name')));
    });

    it('should return no duplicates for completely unique app', function () {
      const newApp = {
        appName: 'Completely New App',
        entryName: 'completely-new-app',
        rootUrl: '/completely-new-app',
        productId: 'completely-new-id',
      };

      const duplicates = checkForDuplicates(mockRegistry, newApp);
      assert.strictEqual(duplicates.length, 0);
    });

    it('should handle empty registry', function () {
      const newApp = {
        appName: 'New App',
        entryName: 'new-app',
        rootUrl: '/new-app',
        productId: 'new-id',
      };

      const duplicates = checkForDuplicates([], newApp);
      assert.strictEqual(duplicates.length, 0);
    });
  });
});

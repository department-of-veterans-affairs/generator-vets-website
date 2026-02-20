import assert from 'node:assert';
import {
  folderNameFilter,
  rootUrlFilter,
  fieldNameToCliArg,
  generateFormIdConst,
  generateTrackingPrefix,
} from '../../utils/filters.js';

describe('filters', () => {
  describe('folderNameFilter', () => {
    it('removes leading slash', () => {
      assert.strictEqual(folderNameFilter('/my-folder'), 'my-folder');
    });

    it('removes trailing slash', () => {
      assert.strictEqual(folderNameFilter('my-folder/'), 'my-folder');
    });

    it('removes both leading and trailing slashes', () => {
      assert.strictEqual(folderNameFilter('/my-folder/'), 'my-folder');
    });

    it('handles edge case: only slash returns empty string', () => {
      assert.strictEqual(folderNameFilter('/'), '');
    });

    it('leaves clean folder names unchanged', () => {
      assert.strictEqual(folderNameFilter('my-folder'), 'my-folder');
    });
  });

  describe('rootUrlFilter', () => {
    it('adds leading slash', () => {
      assert.strictEqual(rootUrlFilter('my-app'), '/my-app');
    });

    it('removes trailing slash', () => {
      assert.strictEqual(rootUrlFilter('/my-app/'), '/my-app');
    });

    it('adds leading and removes trailing slash', () => {
      assert.strictEqual(rootUrlFilter('my-app/'), '/my-app');
    });

    it('handles edge case: only slash returns slash', () => {
      assert.strictEqual(rootUrlFilter('/'), '/');
    });

    it('leaves clean URLs unchanged', () => {
      assert.strictEqual(rootUrlFilter('/my-app'), '/my-app');
    });
  });

  describe('fieldNameToCliArg', () => {
    it('converts camelCase to kebab-case', () => {
      assert.strictEqual(fieldNameToCliArg('appName'), 'app-name');
      assert.strictEqual(fieldNameToCliArg('formNumber'), 'form-number');
    });

    it('handles multiple capitals', () => {
      assert.strictEqual(
        fieldNameToCliArg('usesVetsJsonSchema'),
        'uses-vets-json-schema',
      );
    });

    it('leaves lowercase unchanged', () => {
      assert.strictEqual(fieldNameToCliArg('folder'), 'folder');
    });
  });

  describe('generateFormIdConst', () => {
    it('converts form number to constant', () => {
      assert.strictEqual(generateFormIdConst('21-526EZ'), 'FORM_21_526EZ');
      assert.strictEqual(generateFormIdConst('22-1990'), 'FORM_22_1990');
    });
  });

  describe('generateTrackingPrefix', () => {
    it('converts form number to tracking prefix', () => {
      assert.strictEqual(generateTrackingPrefix('21-526EZ'), '21_526ez');
      assert.strictEqual(generateTrackingPrefix('22-1990'), '22_1990');
    });
  });
});

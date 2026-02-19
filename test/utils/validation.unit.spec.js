import assert from 'node:assert';
import {
  isInvalidFolderName,
  isInvalidSlackGroup,
  validateRootUrl,
  validateFormNumber,
  validateAppName,
  validateFolderName,
} from '../../utils/validation.js';

describe('validation', () => {
  describe('isInvalidFolderName', () => {
    it('returns true for valid folder names', () => {
      assert.strictEqual(isInvalidFolderName('my-folder'), true);
      assert.strictEqual(isInvalidFolderName('folder123'), true);
    });

    it('returns error for folders with spaces', () => {
      assert.strictEqual(
        isInvalidFolderName('my folder'),
        'Folder names should not include spaces',
      );
    });
  });

  describe('isInvalidSlackGroup', () => {
    it('returns true for "none"', () => {
      assert.strictEqual(isInvalidSlackGroup('none'), true);
    });

    it('returns true for valid slack groups', () => {
      assert.strictEqual(isInvalidSlackGroup('@vets-team'), true);
      assert.strictEqual(isInvalidSlackGroup('@education'), true);
    });

    it('returns error for invalid formats', () => {
      const error =
        'Slack group must start with @ and contain only lowercase letters and hyphens';
      assert.strictEqual(isInvalidSlackGroup('vets-team'), error);
      assert.strictEqual(isInvalidSlackGroup('@Vets-Team'), error);
      assert.strictEqual(isInvalidSlackGroup('@vets_team'), error);
    });
  });

  describe('validateRootUrl', () => {
    it('returns true for empty string', () => {
      assert.strictEqual(validateRootUrl(''), true);
    });

    it('returns true for valid URLs', () => {
      assert.strictEqual(validateRootUrl('/burial-allowance'), true);
      assert.strictEqual(validateRootUrl('/education/apply'), true);
    });

    it('returns error for URLs without leading slash', () => {
      const result = validateRootUrl('burial-allowance');
      assert(result.includes('Root URL must start with a forward slash'));
    });

    it('returns error for URLs with trailing slash', () => {
      const result = validateRootUrl('/burial-allowance/');
      assert(result.includes('Root URL should not end with a slash'));
    });
  });

  describe('validateFormNumber', () => {
    it('returns true for empty string', () => {
      assert.strictEqual(validateFormNumber(''), true);
    });

    it('returns true for valid form numbers', () => {
      assert.strictEqual(validateFormNumber('21-526EZ'), true);
      assert.strictEqual(validateFormNumber('22-1990'), true);
      assert.strictEqual(validateFormNumber('10-10EZ'), true);
    });

    it('returns error for invalid characters', () => {
      const result = validateFormNumber('21/526');
      assert(result.includes('should only contain letters, numbers, and hyphens'));
    });
  });

  describe('validateAppName', () => {
    it('returns error for empty string', () => {
      assert.strictEqual(validateAppName(''), 'Application name is required');
    });

    it('returns error for short names', () => {
      const result = validateAppName('AB');
      assert(result.includes('must be at least 3 characters'));
    });

    it('returns true for valid names', () => {
      assert.strictEqual(validateAppName('Burial Allowance Application'), true);
      assert.strictEqual(validateAppName('Education Benefits'), true);
    });
  });

  describe('validateFolderName', () => {
    it('returns true for empty string', () => {
      assert.strictEqual(validateFolderName(''), true);
    });

    it('returns true for valid folder names', () => {
      assert.strictEqual(validateFolderName('burial-allowance'), true);
      assert.strictEqual(validateFolderName('education/apply'), true);
    });

    it('returns error for names with spaces', () => {
      const result = validateFolderName('burial allowance');
      assert(result.includes('should not include spaces'));
    });

    it('returns error for invalid characters', () => {
      const result = validateFolderName('burial@allowance');
      assert(result.includes('should only contain lowercase letters'));
    });
  });
});

import assert from 'node:assert';
import {
  validateEntryName,
  validateFormNumber,
  validateOmbNumber,
  validateExpirationDate,
  validateRespondentBurden,
  validateTemplateType,
  isNonInteractiveMode,
} from '../../lib/cli-validation.js';

describe('cli-validation', () => {
  describe('validateFormNumber', () => {
    it('returns true for valid VA form numbers', () => {
      assert.strictEqual(validateFormNumber('21-526EZ'), true);
      assert.strictEqual(validateFormNumber('22-1990'), true);
      assert.strictEqual(validateFormNumber('10-10EZ'), true);
      assert.strictEqual(validateFormNumber('1-2345A'), true);
    });

    it('returns error for invalid formats', () => {
      const result = validateFormNumber('21/526');
      assert(result.includes('should follow VA format'));
    });

    it('returns true for empty string', () => {
      assert.strictEqual(validateFormNumber(''), true);
    });
  });

  describe('validateOmbNumber', () => {
    it('returns true for valid OMB numbers', () => {
      assert.strictEqual(validateOmbNumber('2900-0001'), true);
      assert.strictEqual(validateOmbNumber('1234-5678'), true);
    });

    it('returns error for invalid formats', () => {
      const result = validateOmbNumber('290-001');
      assert(result.includes('should follow format XXXX-XXXX'));
    });

    it('returns true for empty string', () => {
      assert.strictEqual(validateOmbNumber(''), true);
    });
  });

  describe('validateExpirationDate', () => {
    it('returns true for valid future dates', () => {
      assert.strictEqual(validateExpirationDate('12/31/2026'), true);
      assert.strictEqual(validateExpirationDate('3/15/2026'), true);
    });

    it('returns error for invalid date formats', () => {
      const result = validateExpirationDate('2026-12-31');
      assert(result.includes('should follow M/D/YYYY format'));
    });

    it('returns error for past dates', () => {
      const result = validateExpirationDate('1/1/2020');
      assert(result.includes('should be in the future'));
    });

    it('returns true for empty string', () => {
      assert.strictEqual(validateExpirationDate(''), true);
    });
  });

  describe('validateRespondentBurden', () => {
    it('returns true for valid positive numbers', () => {
      assert.strictEqual(validateRespondentBurden('15'), true);
      assert.strictEqual(validateRespondentBurden('30'), true);
    });

    it('returns error for invalid numbers', () => {
      const result = validateRespondentBurden('abc');
      assert(result.includes('should be a positive number'));
    });

    it('returns error for zero or negative', () => {
      const result = validateRespondentBurden('0');
      assert(result.includes('should be a positive number'));
    });

    it('returns true for empty string', () => {
      assert.strictEqual(validateRespondentBurden(''), true);
    });
  });

  describe('validateTemplateType', () => {
    it('returns true for valid template types', () => {
      assert.strictEqual(validateTemplateType('WITH_1_PAGE'), true);
      assert.strictEqual(validateTemplateType('WITH_4_PAGES'), true);
      assert.strictEqual(validateTemplateType('FORM_ENGINE'), true);
    });

    it('returns error for invalid template type', () => {
      const result = validateTemplateType('INVALID_TYPE');
      assert(result.includes('should be one of'));
    });

    it('returns true for empty string', () => {
      assert.strictEqual(validateTemplateType(''), true);
    });
  });

  describe('validateEntryName', () => {
    it('returns true for valid kebab-case names', () => {
      assert.strictEqual(validateEntryName('burial-allowance'), true);
      assert.strictEqual(validateEntryName('education-benefits'), true);
    });

    it('returns error for names with spaces', () => {
      const result = validateEntryName('burial allowance');
      assert(result.includes('should not contain spaces'));
    });

    it('returns error for invalid characters', () => {
      const result = validateEntryName('burial_allowance');
      assert(result.includes('should only contain letters, numbers, and hyphens'));
    });
  });

  describe('isNonInteractiveMode', () => {
    it('returns true when CLI args are provided', () => {
      assert.strictEqual(isNonInteractiveMode({ appName: 'Test' }), true);
      assert.strictEqual(isNonInteractiveMode({ folderName: 'test' }), true);
    });

    it('returns false for empty options', () => {
      assert.strictEqual(isNonInteractiveMode({}), false);
      assert.strictEqual(isNonInteractiveMode(null), false);
    });

    it('returns false when dryRunInteractive is true', () => {
      assert.strictEqual(
        isNonInteractiveMode({ dryRunInteractive: true, appName: 'Test' }),
        false,
      );
    });

    it('returns true when dryRunNonInteractive is true', () => {
      assert.strictEqual(isNonInteractiveMode({ dryRunNonInteractive: true }), true);
    });
  });
});

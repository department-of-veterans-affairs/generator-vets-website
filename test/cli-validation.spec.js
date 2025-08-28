/* global describe, it */
const assert = require('assert');
const {
  validateRootUrl,
  validateAppName,
  validateEntryName,
  validateFormNumber,
  validateOmbNumber,
  validateExpirationDate,
  validateRespondentBurden,
  validateTemplateType,
  validateAllCliArguments,
  isNonInteractiveMode,
  validateRequiredCliArguments,
} = require('../utils/cli-validation');

describe('CLI Validation', () => {
  describe('validateRootUrl', () => {
    it('should accept valid root URLs', () => {
      assert.strictEqual(validateRootUrl('/my-app'), true);
      assert.strictEqual(validateRootUrl('/health-care/apply'), true);
      assert.strictEqual(validateRootUrl('/forms/form-123'), true);
    });

    it('should reject URLs ending with slash', () => {
      const result = validateRootUrl('/my-app/');
      assert.strictEqual(typeof result, 'string');
      assert.ok(result.includes('should not end with a slash'));
    });

    it('should reject URLs not starting with slash', () => {
      const result = validateRootUrl('my-app');
      assert.strictEqual(typeof result, 'string');
      assert.ok(result.includes('must start with a forward slash'));
    });

    it('should reject URLs with invalid characters', () => {
      const result = validateRootUrl('/my app'); // Space character
      assert.strictEqual(typeof result, 'string');
      assert.ok(result.includes('invalid characters'));
    });

    it('should accept empty/undefined values', () => {
      assert.strictEqual(validateRootUrl(''), true);
      assert.strictEqual(validateRootUrl(undefined), true);
    });
  });

  describe('validateAppName', () => {
    it('should accept valid app names', () => {
      assert.strictEqual(validateAppName('my-app'), true);
      assert.strictEqual(validateAppName('myApp'), true);
      assert.strictEqual(validateAppName('my_app'), true);
      assert.strictEqual(validateAppName('app123'), true);
      assert.strictEqual(validateAppName('Decision Reviews Onramp Tool'), true);
      assert.strictEqual(validateAppName('21P-530 Burials benefits form'), true);
    });

    it('should reject app names with invalid characters', () => {
      const result = validateAppName('my<app>');
      assert.strictEqual(typeof result, 'string');
      assert.ok(result.includes('invalid characters'));
    });

    it('should accept empty/undefined values', () => {
      assert.strictEqual(validateAppName(''), true);
      assert.strictEqual(validateAppName(undefined), true);
    });
  });

  describe('validateEntryName', () => {
    it('should accept valid entry names', () => {
      assert.strictEqual(validateEntryName('my-entry'), true);
      assert.strictEqual(validateEntryName('entry123'), true);
      assert.strictEqual(validateEntryName('health-care-application'), true);
    });

    it('should reject entry names with spaces', () => {
      const result = validateEntryName('my entry');
      assert.strictEqual(typeof result, 'string');
      assert.ok(result.includes('should not contain spaces'));
    });

    it('should reject entry names with underscores', () => {
      const result = validateEntryName('my_entry');
      assert.strictEqual(typeof result, 'string');
      assert.ok(result.includes('should only contain'));
    });

    it('should accept empty/undefined values', () => {
      assert.strictEqual(validateEntryName(''), true);
      assert.strictEqual(validateEntryName(undefined), true);
    });
  });

  describe('validateFormNumber', () => {
    it('should accept valid form numbers', () => {
      // Real VA form numbers from official sources
      assert.strictEqual(validateFormNumber('21-526EZ'), true);
      assert.strictEqual(validateFormNumber('22-1990'), true);
      assert.strictEqual(validateFormNumber('22-1995'), true);
      assert.strictEqual(validateFormNumber('10-10EZ'), true);
      assert.strictEqual(validateFormNumber('22-0993'), true);
      assert.strictEqual(validateFormNumber('21P-530'), true);
      assert.strictEqual(validateFormNumber('1-2345A'), true);
    });

    it('should reject invalid form number formats', () => {
      const result = validateFormNumber('invalid-form');
      assert.strictEqual(typeof result, 'string');
      assert.ok(result.includes('should follow VA format'));
    });

    it('should accept empty/undefined values', () => {
      assert.strictEqual(validateFormNumber(''), true);
      assert.strictEqual(validateFormNumber(undefined), true);
    });
  });

  describe('validateOmbNumber', () => {
    it('should accept valid OMB numbers', () => {
      assert.strictEqual(validateOmbNumber('2900-0001'), true);
      assert.strictEqual(validateOmbNumber('1234-5678'), true);
    });

    it('should reject invalid OMB number formats', () => {
      const result = validateOmbNumber('invalid-omb');
      assert.strictEqual(typeof result, 'string');
      assert.ok(result.includes('should follow format XXXX-XXXX'));
    });

    it('should accept empty/undefined values', () => {
      assert.strictEqual(validateOmbNumber(''), true);
      assert.strictEqual(validateOmbNumber(undefined), true);
    });
  });

  describe('validateExpirationDate', () => {
    it('should accept valid future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const dateStr = `${
        futureDate.getMonth() + 1
      }/${futureDate.getDate()}/${futureDate.getFullYear()}`;
      assert.strictEqual(validateExpirationDate(dateStr), true);
    });

    it('should reject past dates', () => {
      const result = validateExpirationDate('1/1/2020');
      assert.strictEqual(typeof result, 'string');
      assert.ok(result.includes('should be in the future'));
    });

    it('should reject invalid date formats', () => {
      const result = validateExpirationDate('invalid-date');
      assert.strictEqual(typeof result, 'string');
      assert.ok(result.includes('should follow M/D/YYYY format'));
    });

    it('should accept empty/undefined values', () => {
      assert.strictEqual(validateExpirationDate(''), true);
      assert.strictEqual(validateExpirationDate(undefined), true);
    });
  });

  describe('validateRespondentBurden', () => {
    it('should accept valid numbers', () => {
      assert.strictEqual(validateRespondentBurden('5'), true);
      assert.strictEqual(validateRespondentBurden('30'), true);
      assert.strictEqual(validateRespondentBurden('120'), true);
    });

    it('should reject non-positive numbers', () => {
      const result = validateRespondentBurden('0');
      assert.strictEqual(typeof result, 'string');
      assert.ok(result.includes('should be a positive number'));
    });

    it('should reject non-numeric values', () => {
      const result = validateRespondentBurden('invalid');
      assert.strictEqual(typeof result, 'string');
      assert.ok(result.includes('should be a positive number'));
    });

    it('should accept empty/undefined values', () => {
      assert.strictEqual(validateRespondentBurden(''), true);
      assert.strictEqual(validateRespondentBurden(undefined), true);
    });
  });

  describe('validateTemplateType', () => {
    it('should accept valid template types', () => {
      assert.strictEqual(validateTemplateType('WITH_1_PAGE'), true);
      assert.strictEqual(validateTemplateType('WITH_4_PAGES'), true);
    });

    it('should reject invalid template types', () => {
      const result = validateTemplateType('INVALID_TYPE');
      assert.strictEqual(typeof result, 'string');
      assert.ok(result.includes('should be one of'));
    });

    it('should accept empty/undefined values', () => {
      assert.strictEqual(validateTemplateType(''), true);
      assert.strictEqual(validateTemplateType(undefined), true);
    });
  });

  describe('validateAllCliArguments', () => {
    it('should return empty array for valid arguments', () => {
      const options = {
        rootUrl: '/my-app',
        appName: 'my-app',
        entryName: 'my-entry',
        formNumber: '22-0993',
        ombNumber: '2900-0001',
        respondentBurden: '15',
        templateType: 'WITH_1_PAGE',
      };

      const errors = validateAllCliArguments(options);
      assert.ok(Array.isArray(errors));
      assert.strictEqual(errors.length, 0);
    });

    it('should return errors for invalid arguments', () => {
      const options = {
        rootUrl: '/my-app/', // Invalid - ends with slash
        appName: 'my<app>', // Invalid - contains invalid characters
        entryName: 'my_entry', // Invalid - contains underscore
        formNumber: 'invalid', // Invalid - wrong format
        ombNumber: 'invalid', // Invalid - wrong format
        respondentBurden: '0', // Invalid - not positive
        templateType: 'INVALID', // Invalid - not allowed
      };

      const errors = validateAllCliArguments(options);
      assert.ok(Array.isArray(errors));
      assert.strictEqual(errors.length, 7);
      assert.ok(errors[0].includes('rootUrl:'));
      assert.ok(errors[1].includes('appName:'));
      assert.ok(errors[2].includes('entryName:'));
      assert.ok(errors[3].includes('formNumber:'));
      assert.ok(errors[4].includes('ombNumber:'));
      assert.ok(errors[5].includes('respondentBurden:'));
      assert.ok(errors[6].includes('templateType:'));
    });

    it('should ignore empty/undefined values', () => {
      const options = {
        rootUrl: undefined,
        appName: '',
        entryName: null,
      };

      const errors = validateAllCliArguments(options);
      assert.strictEqual(errors.length, 0);
    });
  });

  describe('isNonInteractiveMode', () => {
    it('should return true when any CLI argument is provided', () => {
      assert.strictEqual(isNonInteractiveMode({ appName: 'test' }), true);
      assert.strictEqual(isNonInteractiveMode({ rootUrl: '/test' }), true);
      assert.strictEqual(isNonInteractiveMode({ isForm: true }), true);
      assert.strictEqual(isNonInteractiveMode({ formNumber: '22-0993' }), true);
    });

    it('should return false when no CLI arguments are provided', () => {
      assert.strictEqual(isNonInteractiveMode({}), false);
      assert.strictEqual(isNonInteractiveMode({ unknownField: 'value' }), false);
    });

    it('should handle undefined input', () => {
      assert.strictEqual(isNonInteractiveMode(undefined), false);
    });
  });

  describe('validateRequiredCliArguments', () => {
    it('should return empty array for interactive mode', () => {
      const errors = validateRequiredCliArguments({});
      assert.strictEqual(errors.length, 0);
    });

    it('should require core fields in non-interactive mode for non-form apps', () => {
      const options = {
        appName: 'Test App',
        isForm: false,
        // Missing other required fields
      };

      const errors = validateRequiredCliArguments(options);
      assert.ok(errors.length > 0);
      assert.ok(errors.some((err) => err.includes('folderName')));
      assert.ok(errors.some((err) => err.includes('entryName')));
      assert.ok(errors.some((err) => err.includes('rootUrl')));
      // ContentLoc and slackGroup should be optional with defaults
      assert.ok(!errors.some((err) => err.includes('contentLoc')));
      assert.ok(!errors.some((err) => err.includes('slackGroup')));
    });

    it('should require additional fields for form apps', () => {
      const options = {
        appName: 'Test Form',
        folderName: 'test-form',
        entryName: 'test-form',
        rootUrl: '/test-form',
        isForm: true,
        // Missing form-specific required fields
      };

      const errors = validateRequiredCliArguments(options);
      assert.ok(errors.length > 0);
      assert.ok(errors.some((err) => err.includes('formNumber')));
      assert.ok(errors.some((err) => err.includes('benefitDescription')));
      assert.ok(errors.some((err) => err.includes('ombNumber')));
      assert.ok(errors.some((err) => err.includes('expirationDate')));
      // These should be optional with defaults
      assert.ok(!errors.some((err) => err.includes('trackingPrefix')));
      assert.ok(!errors.some((err) => err.includes('respondentBurden')));
    });

    it('should pass validation with all required fields for non-form app', () => {
      const options = {
        appName: 'Test App',
        folderName: 'test-app',
        entryName: 'test-app',
        rootUrl: '/test-app',
        isForm: false,
        // Optional fields with defaults not needed for validation
      };

      const errors = validateRequiredCliArguments(options);
      assert.strictEqual(errors.length, 0);
    });

    it('should pass validation with all required fields for form app', () => {
      const options = {
        appName: 'Test Form',
        folderName: 'test-form',
        entryName: 'test-form',
        rootUrl: '/test-form',
        isForm: true,
        formNumber: '22-0993',
        benefitDescription: 'test benefits',
        ombNumber: '2900-0001',
        expirationDate: '12/31/2026',
        // Optional fields with defaults not needed for validation
      };

      const errors = validateRequiredCliArguments(options);
      assert.strictEqual(errors.length, 0);
    });

    it('should handle isForm as string "true"', () => {
      const options = {
        appName: 'Test Form',
        folderName: 'test-form',
        entryName: 'test-form',
        rootUrl: '/test-form',
        isForm: 'true', // String instead of boolean
        // Missing form-specific required fields
      };

      const errors = validateRequiredCliArguments(options);
      assert.ok(errors.length > 0);
      assert.ok(errors.some((err) => err.includes('formNumber')));
      assert.ok(errors.some((err) => err.includes('benefitDescription')));
      assert.ok(errors.some((err) => err.includes('ombNumber')));
      assert.ok(errors.some((err) => err.includes('expirationDate')));
    });
  });
});

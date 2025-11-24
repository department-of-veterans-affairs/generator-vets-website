/**
 * Shared field definitions for all generators
 * Single source of truth for all field configurations
 */

const {
  isInvalidFolderName,
  isInvalidEntryName,
  isInvalidSlackGroup,
} = require('../utils/validation');
const { folderNameFilter } = require('../utils/filters');
const { store } = require('./store');

/**
 * Check if a CLI argument was provided in either camelCase or kebab-case format
 * @param {string} fieldName - The field name to check for
 * @param {Object} generator - The Yeoman generator instance
 * @returns {boolean} - True if the argument was provided
 */
function hasCliArgument(fieldName, generator) {
  // Convert camelCase to kebab-case
  const kebabCase = fieldName.replace(/([A-Z])/g, '-$1').toLowerCase();

  // Check if argument exists in process.argv (supports both --arg and --arg=value formats)
  const hasCamelCase = process.argv.some((arg) => arg.startsWith(`--${fieldName}`));
  const hasKebabCase = process.argv.some((arg) => arg.startsWith(`--${kebabCase}`));

  // Also check if the option was parsed and is available in generator.options
  const hasOptionValue = generator.options && generator.options[fieldName] !== undefined;

  return hasCamelCase || hasKebabCase || hasOptionValue;
}

const appFields = {
  appName: {
    type: 'input',
    message:
      "What's the name of your application? This will be the default page title. Examples: '21P-530 Burials benefits form' or 'GI Bill School Feedback Tool'",
    default: 'A New Form',
    required: true,
    validate: (input) => (input ? true : 'Application name is required'),
  },
  folderName: {
    type: 'input',
    message:
      "What folder in `src/applications/` should your app live in? This can be a subfolder. Examples: 'burials' or 'edu-benefits/0993'",
    required: true,
    validate: isInvalidFolderName,
    filter: folderNameFilter,
    default(answers) {
      // First try to get from current answers, then fall back to store
      const appName = (answers && answers.appName) || store.getValue('appName');
      if (appName) {
        return appName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }

      return undefined;
    },
  },
  entryName: {
    type: 'input',
    message:
      "What should be the name of your app's entry bundle? Examples: '0993-edu-benefits' or 'feedback-tool'",
    required: true,
    validate: isInvalidEntryName,
    default(answers) {
      // First try to get from current answers, then fall back to store
      const appName = (answers && answers.appName) || store.getValue('appName');
      if (appName) {
        return appName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }

      return undefined;
    },
  },
  rootUrl: {
    type: 'input',
    message:
      "What's the root url of your application? It should start with a forward slash and be all lowercase. Examples: '/burials-530/' or '/education/0993/'",
    required: true,
    validate: (input) => (input ? true : 'Root URL is required'),
    default(answers) {
      // First try to get from current answers, then fall back to store
      const appName = (answers && answers.appName) || store.getValue('appName');
      if (appName) {
        const kebabName = appName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        return `/${kebabName}`;
      }

      return undefined;
    },
  },
  isForm: {
    type: 'Boolean',
    message: 'Is this a form application?',
    default: true,
    required: true,
  },
  contentRepoLocation: {
    type: 'input',
    message:
      'Where can I find the vagov-content repo? This path can be absolute or relative to vets-website.',
    default() {
      const currentDir = process.cwd();
      const parentDir = require('path').dirname(currentDir);
      return require('path').join(parentDir, 'vagov-content');
    },
  },
  slackGroup: {
    type: 'input',
    message:
      "What Slack user group should be notified for CI failures on the `main` branch? Example: '@vaos-fe-dev'",
    default: 'none',
    validate: isInvalidSlackGroup,
  },
  productId: {
    type: 'input',
    message: 'What is the product ID for the registry?',
    default() {
      return require('uuid').v4();
    },
  },
};

// Form-specific field definitions
const formFields = {
  formNumber: {
    type: 'input',
    message: "What's your form number? Examples: '22-0993' or '21P-530'",
    required: true,
    validate: (input) => (input ? true : 'Form number is required'),
  },
  benefitDescription: {
    type: 'input',
    message:
      "What's the benefit description for this form? Examples: 'education benefits' or 'disability claims increase'",
    default: 'benefits',
  },
  trackingPrefix: {
    type: 'input',
    message:
      "What's the Google Analytics event prefix that you want to use? Examples: 'burials-530-' or 'edu-0993-'",
    default() {
      // Get entryName from the store (set by app generator)
      const entryName = store.getValue('entryName');
      if (entryName) {
        return `${entryName}-`;
      }

      // Fallback to getting from appName in store
      const appName = store.getValue('appName');
      if (appName) {
        const kebabName = appName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        return `${kebabName}-`;
      }

      return 'form-';
    },
  },
  respondentBurden: {
    type: 'input',
    message: "What's the respondent burden of this form in minutes?",
    default: '30',
    validate: (input) => (input ? true : 'Respondent burden is required'),
  },
  ombNumber: {
    type: 'input',
    message: "What's the OMB control number for this form? Example: '2900-0797'",
    default: '1234-5678',
  },
  expirationDate: {
    type: 'input',
    message:
      "What's the OMB expiration date (in M/D/YYYY format) for this form? Example: '1/31/2019'",
    default() {
      const today = new Date();
      const nextYear = new Date(
        today.getFullYear() + 1,
        today.getMonth(),
        today.getDate(),
      );
      return `${nextYear.getMonth() + 1}/${nextYear.getDate()}/${nextYear.getFullYear()}`;
    },
  },
  usesVetsJsonSchema: {
    type: 'Boolean',
    message:
      'Does this form use vets-json-schema? (JSON schemas defined in separate repository)',
    default: false,
  },
  usesMinimalHeader: {
    type: 'Boolean',
    message: 'Use minimal header (minimal form flow) pattern?',
    default: true,
  },
  addToMyVaSip: {
    type: 'Boolean',
    message:
      'Should this form appear on the My VA dashboard for users with in-progress applications?',
    default: true,
  },
  templateType: {
    type: 'list',
    promptType: 'list',
    message: 'Which form template would you like to start with?',
    choices: [
      {
        name: 'WITH_1_PAGE: A form with 1 page - name and date of birth',
        value: 'WITH_1_PAGE',
      },
      {
        name: 'WITH_4_PAGES: A form with 4 pages - name and date of birth, identification information, mailing address, and phone and email',
        value: 'WITH_4_PAGES',
      },
      {
        name: 'FORM_ENGINE: A form from Drupal using the shared Form Engine',
        value: 'FORM_ENGINE',
      },
    ],
    default: 'WITH_1_PAGE',
  },
};

/**
 * Get field definitions for a specific generator type
 * @param {string} type - 'app' or 'form' or 'all'
 * @returns {Object} Field definitions
 */
function getFieldDefinitions(type = 'app') {
  switch (type) {
    case 'app':
      return appFields;
    case 'form':
      return formFields;
    case 'all':
      return { ...appFields, ...formFields };
    default:
      throw new Error(`Unknown field type: ${type}. Use 'app', 'form', or 'all'`);
  }
}

/**
 * Get field definitions based on context (isForm flag)
 * @param {boolean} isForm - Whether this is a form application
 * @returns {Object} Appropriate field definitions
 */
function getContextualFieldDefinitions(isForm) {
  return isForm ? getFieldDefinitions('all') : getFieldDefinitions('app');
}

/**
 * Gets required field names based on form configuration (for prompt validation)
 */
function getRequiredFields(isForm) {
  const fields = getContextualFieldDefinitions(isForm);
  return Object.keys(fields).filter((key) => fields[key].required);
}

/**
 * Gets the list of required CLI arguments for non-interactive mode (strict validation)
 * In non-interactive mode, all these fields must be explicitly provided via CLI arguments
 * @param {Object} options - The CLI options object
 * @returns {Array} - Array of required field names
 */
function getNonInteractiveRequiredFields(options) {
  // Core required fields for all apps in non-interactive mode
  const requiredFields = ['appName', 'folderName', 'entryName', 'rootUrl', 'isForm'];

  // Additional required fields for forms only
  if (options.isForm === true || options.isForm === 'true') {
    requiredFields.push(
      'formNumber',
      'benefitDescription',
      'ombNumber',
      'expirationDate',
    );
  }

  return requiredFields;
}

/**
 * Gets the list of required CLI arguments for legacy compatibility
 * @param {Object} options - The CLI options object
 * @returns {Array} - Array of required field names
 */
function getLegacyRequiredFields(options) {
  // Core required fields for all apps (based on consumer requirements)
  const requiredFields = [
    'appName',
    'folderName',
    'entryName',
    'rootUrl',
    'isForm', // Internal requirement to determine if additional fields needed
  ];

  // Additional required fields for forms only
  if (options.isForm === true || options.isForm === 'true') {
    requiredFields.push(
      'formNumber',
      'benefitDescription',
      'ombNumber',
      'expirationDate',
      'templateType',
    );
  }

  return requiredFields;
}

module.exports = {
  appFields,
  formFields,
  getFieldDefinitions,
  getContextualFieldDefinitions,
  getRequiredFields,
  getNonInteractiveRequiredFields,
  getLegacyRequiredFields,
};

/**
 * Generate prompts from field definitions for Yeoman generator
 * @param {Object} generator - The Yeoman generator instance
 * @param {Object} fieldDefinitions - Field definitions object
 * @param {Array} fieldNames - Optional array of field names to process
 */
function generatePrompts(generator, fieldDefinitions, fieldNames = null) {
  const fieldsToProcess = fieldNames || Object.keys(fieldDefinitions);

  return fieldsToProcess
    .map((fieldName) => {
      const field = fieldDefinitions[fieldName];
      if (!field || !field.message) return null;

      const prompt = {
        type: field.promptType || (field.type === 'Boolean' ? 'confirm' : 'input'),
        name: fieldName,
        message: field.message,
      };

      // Add optional properties
      if (field.default !== undefined) {
        // If default is a function that expects (props, generator), bind the generator
        if (typeof field.default === 'function') {
          prompt.default = (answers) => field.default(answers, generator);
        } else {
          prompt.default = field.default;
        }
      }

      if (field.choices !== undefined) {
        prompt.choices = field.choices;
      }

      if (field.validate !== undefined) {
        prompt.validate = field.validate;
      }

      if (field.filter !== undefined) {
        prompt.filter = field.filter;
      }

      if (field.when !== undefined) {
        // If when is a function that expects (props, generator), bind the generator
        if (typeof field.when === 'function') {
          prompt.when = (answers) => field.when(answers, generator);
        } else {
          prompt.when = field.when;
        }
      }

      return prompt;
    })
    .filter(Boolean);
}

module.exports = {
  appFields,
  formFields,
  getFieldDefinitions,
  getContextualFieldDefinitions,
  getRequiredFields,
  getNonInteractiveRequiredFields,
  getLegacyRequiredFields,
  generatePrompts,
  hasCliArgument,
};

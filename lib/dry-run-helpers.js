const chalk = require('chalk');
const { store } = require('../lib/store');
const { getTrackedFiles } = require('./fs-tracker');
const { validateAllCliArguments } = require('./cli-validation');

/**
 * Check if the generator is running in any dry-run mode
 * @param {object} options - Generator options
 * @returns {boolean}
 */
function isDryRunMode(options) {
  return options.dryRunInteractive || options.dryRunNonInteractive;
}

/**
 * Initialize dry-run mode in the store
 * @param {object} options - Generator options
 */
function initializeDryRunMode(options) {
  if (isDryRunMode(options)) {
    store.setDryRun(true);
  }
}

/**
 * Convert generic --dry-run flag to specific dry-run mode
 * @param {object} options - Generator options (will be modified)
 */
function normalizeDryRunOptions(options) {
  if (options.dryRun && !options.dryRunInteractive && !options.dryRunNonInteractive) {
    options.dryRunNonInteractive = true;
    options.dryRun = false; // Clear the generic flag
  }
}

/**
 * Check if validation should be skipped in dry-run mode
 * @param {object} options - Generator options
 * @returns {boolean}
 */
function shouldSkipValidation(options) {
  return isDryRunMode(options);
}

/**
 * Compute props for dry-run mode
 * @param {object} generator - The generator instance
 * @param {object} allFields - Field definitions
 */
function computePropsForDryRun(generator, allFields) {
  const workingProps = { ...store.getAllProps() };

  Object.keys(allFields).forEach((fieldName) => {
    if (generator.options[fieldName] !== undefined) {
      workingProps[fieldName] = generator.options[fieldName];
    }
  });

  // Compute missing required fields using their default functions
  Object.keys(allFields).forEach((fieldName) => {
    const field = allFields[fieldName];

    // Skip if we already have a value
    if (workingProps[fieldName] !== undefined) {
      return;
    }

    // Try to compute using default function
    if (typeof field.default === 'function') {
      try {
        const computedValue = field.default(workingProps, generator);
        workingProps[fieldName] = computedValue;
        // Set it in the store so file operations can access it
        store.setProp(fieldName, computedValue);
      } catch (_) {
        // If computation fails, leave it undefined
      }
    } else if (field.default !== undefined) {
      workingProps[fieldName] = field.default;
      store.setProp(fieldName, field.default);
    }
  });
}

/**
 * Handle dry-run prompting validation and early exit
 * @param {object} generator - The generator instance
 * @param {object} allFields - Field definitions
 * @returns {Promise<void>} - Resolves if dry-run should continue, exits process if validation fails
 */
function handleDryRunPrompting(generator, allFields) {
  if (!isDryRunMode(generator.options)) {
    return null; // Not in dry-run mode, continue with normal prompting
  }

  console.log(chalk.cyan('\nDRY RUN - Configuration'));

  // For interactive dry-run, validate that required fields are provided as CLI args
  if (generator.options.dryRunInteractive) {
    // AppName is always required
    const requiredFields = ['appName'];
    const missingFields = [];

    // Check if appName is provided
    requiredFields.forEach((field) => {
      const kebabField = field.replace(/([A-Z])/g, '-$1').toLowerCase();
      if (!generator.options[field] && !store.getValue(field)) {
        missingFields.push(
          `--${kebabField}: Required (other fields can be computed from this)`,
        );
      }
    });

    // Determine if this is a form (defaults to true unless explicitly set to false)
    const isForm =
      generator.options.isForm === undefined
        ? true // Default to true
        : generator.options.isForm === true ||
          generator.options.isForm === 'true' ||
          generator.options.isForm === 'y';

    // If it's a form, formNumber is required
    if (isForm && !generator.options.formNumber && !store.getValue('formNumber')) {
      missingFields.push('--form-number: Required when creating a form application');
    }

    // Also validate format/values of any provided CLI arguments
    const validationErrors = validateAllCliArguments(generator.options);
    const allErrors = [...missingFields, ...validationErrors];

    if (allErrors.length > 0) {
      console.log(chalk.red('\n❌ Validation errors:'));
      allErrors.forEach((error) => {
        console.log(chalk.red(`  • ${error}`));
      });
      console.log(chalk.red('\nDRY RUN SUMMARY:'));
      console.log(chalk.red('❌ Generator would fail due to validation errors'));
      process.exit(1);
    }
  }

  // For non-interactive dry-run, use existing validation with all relevant fields
  if (generator.options.dryRunNonInteractive) {
    // Use the centralized CLI validation which already handles required fields
    const validationErrors = validateAllCliArguments(generator.options);

    if (validationErrors.length > 0) {
      console.log(chalk.red('\n❌ Validation errors:'));
      validationErrors.forEach((error) => {
        console.log(chalk.red(`  • ${error}`));
      });
      console.log(chalk.red('\nDRY RUN SUMMARY:'));
      console.log(chalk.red('❌ Generator would fail due to validation errors'));
      process.exit(1);
    }
  }

  // Early computation of props for dry-run modes so file operations have correct values
  computePropsForDryRun(generator, allFields);

  // Create strategy based on computed isForm value for dry-run mode
  if (!generator.strategy) {
    const { store } = require('./store');
    const isFormValue = store.getValue('isForm');
    if (isFormValue !== null && isFormValue !== undefined) {
      generator.strategy = generator._createStrategy(isFormValue);
    }
  }

  return Promise.resolve();
}

/**
 * Handle dry-run composition logic
 * @param {object} options - Generator options
 */
function handleDryRunComposition(options) {
  // Calculate subFolder like the real method does
  const folderName = store.getValue('folderName') || options.folderName || '';
  const subfolders = Array.from(folderName || '').filter((c) => c === '/').length;
  if (subfolders) {
    store.setProp('subFolder', `${new Array(subfolders).fill('..').join('/')}/`);
  } else {
    store.setProp('subFolder', '');
  }

  // Note: Configuration display and file analysis will happen in end() method
  // The file tracker will capture operations and display them in dry-run mode

  return Promise.resolve();
}

/**
 * Check if a field is provided via CLI options
 * @param {string} optionName - Name of the option
 * @param {object} options - Generator options
 * @returns {boolean}
 */
function isProvidedViaOptions(optionName, options) {
  return options[optionName] !== undefined;
}

/**
 * Analyze a store value to determine its source
 * @param {string} optionName - Name of the option
 * @param {object} allFields - Field definitions
 * @returns {string} - Source description
 */
function analyzeStoreValue(optionName, allFields) {
  const field = allFields[optionName];

  if (field && typeof field.default === 'function') {
    return 'computed default';
  }

  if (field && field.default !== undefined) {
    return 'default';
  }

  // If no default in field definition, it might be computed elsewhere
  return 'computed';
}

/**
 * Get source for dry-run modes (both interactive and non-interactive)
 * @param {string} optionName - Name of the option
 * @param {object} options - Generator options
 * @param {object} allFields - Field definitions
 * @param {boolean} isInteractive - Whether this is interactive mode
 * @returns {string} - Source description
 */
function getDryRunSource(optionName, options, allFields, isInteractive) {
  if (isProvidedViaOptions(optionName, options)) {
    return isInteractive ? 'prompt answer' : 'CLI arg';
  }

  if (store.getValue(optionName) !== undefined) {
    return analyzeStoreValue(optionName, allFields);
  }

  return 'missing';
}

/**
 * Get source for interactive dry-run mode
 * @param {string} optionName - Name of the option
 * @param {object} options - Generator options
 * @param {object} allFields - Field definitions
 * @returns {string} - Source description
 */
function getInteractiveSource(optionName, options, allFields) {
  return getDryRunSource(optionName, options, allFields, true);
}

/**
 * Get source for non-interactive dry-run mode
 * @param {string} optionName - Name of the option
 * @param {object} options - Generator options
 * @param {object} allFields - Field definitions
 * @returns {string} - Source description
 */
function getNonInteractiveSource(optionName, options, allFields) {
  return getDryRunSource(optionName, options, allFields, false);
}

/**
 * Get source for default mode (non-dry-run)
 * @param {string} optionName - Name of the option
 * @param {object} options - Generator options
 * @returns {string} - Source description
 */
function getDefaultSource(optionName, options) {
  if (isProvidedViaOptions(optionName, options)) {
    return 'CLI arg';
  }

  if (store.getValue(optionName) !== undefined) {
    return 'prompt';
  }

  return 'missing';
}

/**
 * Get the source of an option value (CLI arg, prompt, computed, etc.)
 * @param {string} optionName - Name of the option
 * @param {object} options - Generator options
 * @param {object} allFields - Field definitions
 * @returns {string} - Source description
 */
function getOptionSource(optionName, options, allFields) {
  // Special handling for auto-generated/computed fields
  const computedFields = ['productId', 'subFolder', 'contentRepoLocation'];
  if (computedFields.includes(optionName) && store.getValue(optionName) !== undefined) {
    return 'computed';
  }

  // Route to appropriate handler based on mode
  if (options.dryRunInteractive) {
    return getInteractiveSource(optionName, options, allFields);
  }

  if (options.dryRunNonInteractive) {
    return getNonInteractiveSource(optionName, options, allFields);
  }

  return getDefaultSource(optionName, options);
}

/**
 * Get the color for displaying a source type
 * @param {string} source - Source type
 * @returns {Function} - Chalk color function
 */
function getSourceColor(source) {
  switch (source) {
    case 'CLI arg':
      return chalk.blue;
    case 'prompt answer':
      return chalk.bold.green;
    case 'prompt':
      return chalk.gray;
    case 'default':
      return chalk.gray;
    case 'computed':
      return chalk.gray;
    case 'computed default':
      return chalk.gray;
    case 'missing':
      return chalk.red;
    default:
      return chalk.gray;
  }
}

/**
 * Show tracked files and configuration for dry-run mode
 * @param {object} generator - The generator instance
 * @param {object} allFields - Field definitions
 */
function showTrackedFiles(generator, allFields) {
  console.log(chalk.cyan('\nDRY RUN - Configuration'));
  console.log(chalk.yellow('Final configuration that would be used:'));

  const metaFields = ['productId', 'dryRunInteractive', 'dryRunNonInteractive'];

  const userVisibleFields = Object.keys(allFields).filter(
    (fieldName) => !metaFields.includes(fieldName),
  );

  const missingRequiredFields = [];

  const { getNonInteractiveRequiredFields } = require('./prompts');
  const actualRequiredFields = getNonInteractiveRequiredFields(generator.options);

  userVisibleFields.forEach((fieldName) => {
    const value = store.getValue(fieldName);
    const source = getOptionSource(fieldName, generator.options, allFields);
    const isActuallyRequired = actualRequiredFields.includes(fieldName);

    if (source === 'missing' && isActuallyRequired) {
      console.log(
        `  ${chalk.red('❌')} ${chalk.cyan(fieldName)}: ${chalk.red('missing')}`,
      );
      missingRequiredFields.push(fieldName);
    } else if (value !== undefined) {
      const sourceColor = getSourceColor(source);
      console.log(
        `  ${chalk.green('✓')} ${chalk.cyan(fieldName)}: ${chalk.white(
          value,
        )} ${sourceColor('(' + source + ')')}`,
      );
    } else if (isActuallyRequired) {
      console.log(
        `  ${chalk.yellow('❓')} ${chalk.cyan(fieldName)}: ${chalk.yellow(
          '<would prompt>',
        )}`,
      );
    }
  });

  if (missingRequiredFields.length > 0) {
    console.log(chalk.red('\nDRY RUN SUMMARY:'));
    console.log(chalk.red('❌ Generator would fail due to missing required fields:'));
    missingRequiredFields.forEach((field) => {
      console.log(chalk.red(`  • ${field}: Required field is missing`));
    });
    process.exit(1);
  }

  console.log(chalk.cyan('\nDRY RUN - File analysis'));

  const trackedFiles = getTrackedFiles(generator);

  console.log(chalk.yellow('Files to be created:'));

  if (trackedFiles.length === 0) {
    console.log(chalk.gray('  No files tracked yet'));
  } else {
    // Sort for consistent output
    trackedFiles.sort().forEach((file) => {
      console.log(chalk.green(`  ${file}`));
    });
  }

  // Final summary
  console.log(chalk.cyan('\nDRY RUN SUMMARY:'));
  if (trackedFiles.length > 0) {
    console.log(chalk.blue(`Files that would be created: ${trackedFiles.length}`));
  }

  console.log(chalk.green('✅ Generator would complete successfully'));
}

module.exports = {
  isDryRunMode,
  initializeDryRunMode,
  normalizeDryRunOptions,
  shouldSkipValidation,
  computePropsForDryRun,
  handleDryRunPrompting,
  handleDryRunComposition,
  getOptionSource,
  getSourceColor,
  showTrackedFiles,
};

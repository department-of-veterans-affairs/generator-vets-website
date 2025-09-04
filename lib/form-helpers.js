const { store } = require('../lib/store');
const { TEMPLATE_TYPES } = require('../utils/constants');
const { generateFormIdConst, generateTrackingPrefix } = require('../utils/filters');

/**
 * Handle expirationDate alias for backward compatibility
 * Some callers use expirationDate instead of formExpiration
 */
function handleExpirationDateAlias() {
  if (store.getValue('expirationDate') && !store.getValue('formExpiration')) {
    store.setProp('formExpiration', store.getValue('expirationDate'));
  }
}

/**
 * Compute and set form-specific properties based on current store values
 */
function computeFormProperties() {
  const formNumber = store.getValue('formNumber');

  // Generate computed properties that are needed regardless of prompting
  if (formNumber) {
    store.setProp('formIdConst', generateFormIdConst(formNumber));
  }

  // Set defaults for tracking prefix if not provided
  if (!store.getValue('trackingPrefix') && formNumber) {
    store.setProp('trackingPrefix', generateTrackingPrefix(formNumber));
  }

  // Set default template type if not provided
  if (!store.getValue('templateType')) {
    store.setProp('templateType', TEMPLATE_TYPES.WITH_1_PAGE);
  }
}

/**
 * Update shared props for app generator
 * @param {object} sharedProps - The shared props object to update
 */
function updateSharedProps(sharedProps) {
  if (sharedProps) {
    sharedProps.usesMinimalHeader = store.getValue('usesMinimalHeader');
    sharedProps.benefitDescription = store.getValue('benefitDescription');
    sharedProps.formNumber = store.getValue('formNumber');
  }
}

module.exports = {
  handleExpirationDateAlias,
  computeFormProperties,
  updateSharedProps,
};

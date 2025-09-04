import {
  testNumberOfWebComponentFields,
  testNumberOfErrorsOnSubmitForWebComponents,
} from 'platform/forms-system/test/pageTestHelpers.spec';

import formConfig from '../../config/form';

const {
  schema,
  uiSchema,
} = formConfig.chapters.personalInformationChapter.pages.mailingAddress;

const pageTitle = 'Mailing address';

testNumberOfWebComponentFields(formConfig, schema, uiSchema, 6, pageTitle);

testNumberOfErrorsOnSubmitForWebComponents(
  formConfig,
  schema,
  uiSchema,
  4,
  pageTitle,
);

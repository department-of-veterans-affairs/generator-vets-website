/* eslint-env mocha */
const assert = require('assert');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

describe('generator-vets-website:form templates', function () {
  const templatesDir = path.join(__dirname, '../generators/form/templates');

  describe('test data templates', function () {
    it('should render minimal-test.json correctly for 1-page template', function () {
      const templatePath = path.join(
        templatesDir,
        'tests/fixtures/data/minimal-test.json.ejs',
      );
      const template = fs.readFileSync(templatePath, 'utf8');

      const result = ejs.render(template, { templateType: 'WITH_1_PAGE' });
      const data = JSON.parse(result);

      assert.ok(data.data.fullName);
      assert.ok(data.data.dateOfBirth);
      assert.ok(!data.data.homePhone, 'Should not have homePhone for 1-page template');
    });

    it('should render minimal-test.json correctly for 4-page template', function () {
      const templatePath = path.join(
        templatesDir,
        'tests/fixtures/data/minimal-test.json.ejs',
      );
      const template = fs.readFileSync(templatePath, 'utf8');

      const result = ejs.render(template, { templateType: 'WITH_4_PAGES' });
      const data = JSON.parse(result);

      assert.ok(data.data.fullName);
      assert.ok(data.data.dateOfBirth);
      assert.ok(data.data.homePhone, 'Should have homePhone for 4-page template');
    });

    it('should render maximal-test.json correctly for 1-page template', function () {
      const templatePath = path.join(
        templatesDir,
        'tests/fixtures/data/maximal-test.json.ejs',
      );
      const template = fs.readFileSync(templatePath, 'utf8');

      const result = ejs.render(template, { templateType: 'WITH_1_PAGE' });
      const data = JSON.parse(result);

      assert.ok(data.data.fullName);
      assert.ok(data.data.dateOfBirth);
      assert.ok(!data.data.veteranId, 'Should not have veteranId for 1-page template');
      assert.ok(!data.data.address, 'Should not have address for 1-page template');
    });

    it('should render maximal-test.json correctly for 4-page template', function () {
      const templatePath = path.join(
        templatesDir,
        'tests/fixtures/data/maximal-test.json.ejs',
      );
      const template = fs.readFileSync(templatePath, 'utf8');

      const result = ejs.render(template, { templateType: 'WITH_4_PAGES' });
      const data = JSON.parse(result);

      assert.ok(data.data.fullName);
      assert.ok(data.data.dateOfBirth);
      assert.ok(data.data.veteranId, 'Should have veteranId for 4-page template');
      assert.ok(data.data.address, 'Should have address for 4-page template');
      assert.ok(data.data.homePhone, 'Should have homePhone for 4-page template');
      assert.ok(data.data.emailAddress, 'Should have emailAddress for 4-page template');
    });
  });

  describe('feature toggles template', function () {
    it('should render feature toggle with correct form number format', function () {
      const templatePath = path.join(
        templatesDir,
        'tests/fixtures/mocks/feature-toggles.json.ejs',
      );
      const template = fs.readFileSync(templatePath, 'utf8');

      const result = ejs.render(template, { formNumber: '21-4192' });
      const data = JSON.parse(result);

      assert.strictEqual(data.data.type, 'feature_toggles');
      assert.ok(data.data.features);
      assert.strictEqual(data.data.features[0].name, 'form_21_4192');
      assert.strictEqual(data.data.features[0].value, true);
    });
  });

  describe('e2e test template', function () {
    it('should render E2E test with correct form number', function () {
      const templatePath = path.join(
        templatesDir,
        'tests/e2e/<%= formNumber %>.cypress.spec.js.ejs',
      );
      const template = fs.readFileSync(templatePath, 'utf8');

      const result = ejs.render(template, { formNumber: '22-1995' });

      assert.ok(
        result.includes(
          "import featureToggles from '../fixtures/mocks/feature-toggles.json';",
        ),
      );
      assert.ok(result.includes("dataSets: ['minimal-test', 'maximal-test']"));
      assert.ok(result.includes('testForm(testConfig)'));
    });
  });
});

# Changelog

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)

## [4.0.0] - 2026-01-30
### BREAKING CHANGES
- **Node.js 22+ required**: This version requires Node.js 22.0.0 or higher
- **ES Modules**: The entire codebase has been converted from CommonJS to ES Modules
- **Yeoman Generator 7.x**: Upgraded to yeoman-generator 7.5.0 (ESM-only)

### Changed
- Upgraded all dependencies to Node 22 compatible versions
- Converted all files from CommonJS (`require/module.exports`) to ES Modules (`import/export`)
- Upgraded `yeoman-generator` from 5.7.0 to 7.5.0
- Upgraded `chalk` from 4.1.2 to 5.4.1
- Upgraded `yosay` from 2.0.2 to 3.0.0
- Upgraded `eslint` from 8.x to 9.18.0 with new flat config format
- Upgraded `mocha` from 10.x to 11.0.1
- Upgraded `prettier` from 2.x to 3.4.2
- Upgraded `husky` from 8.x to 9.1.7
- Upgraded `lint-staged` from 13.x to 16.0.0
- Updated CI workflow to use Node.js 22.17.0

### Added
- `eslint.config.js` for ESLint 9 flat configuration
- `yo` as dev dependency for E2E testing
- E2E test scripts (`scripts/e2e-dry-run.sh`, `scripts/e2e-real-generation.sh`, `scripts/e2e-all.sh`)
- `uuid` package for productId generation
- `globals` package for ESLint configuration
- `mem-fs` and `mem-fs-editor` dev dependencies for test mocking

### Removed
- `.eslintignore` file (now uses `ignores` in eslint.config.js)
- `eslintConfig` section from package.json
- `resolutions` overrides from package.json
- `eslint-config-xo` dependency

## [3.18.0] - 2025-11-21
### Added
- New prompt for 'Should this form appear on the My VA dashboard for users with in-progress applications?'

### Fixed
- Fixed SCSS file path when using a sub-nested folder
- Fixed populating to `missingFromVetsJsonSchema` when `usesVetsJsonSchema` is false

## [3.17.1] - 2025-10-07
### Fixed
- Added missing `lib` directory to npm package files to fix "Cannot find module" errors
- Corrected `main` entry point from non-existent `generators/index.js` to `generators/app/index.js`

## [3.17.0] - 2025-09-18
### Added
- Dry run modes (`--dry-run-interactive` and `--dry-run-non-interactive`) for testing generator output without creating files
- Comprehensive test suite with 30+ permutation coverage
- Strategy pattern architecture for better code organization

### Changed
- Complete internal architecture overhaul while maintaining backward compatibility
- Unified app and form generators into single generator with strategies
- Enhanced validation and error messaging

## [3.16.0] - 2025-08-28
### Added
- CLI argument validation
- Interactive/non-interactive mode detection for CLI usage
- Node.js version compatibility check (requires 14.15.0)
- `.nvmrc` file for easy Node.js version management
- Pull request template for consistent development workflow
- Test coverage for CLI validation and duplicate detection

### Changed
- Updated CI workflow to test only with Node.js 14.15.0
- Improved error messages with helpful guidance for version switching
- Enhanced documentation with nvm usage instructions
- Standardized on npm package manager in workflows

## [3.15.0] - 2025-08-25
### Added
- CLI support for all generator options
- Ability to skip interactive prompts by passing arguments via CLI

## [3.14.1] - 2025-08-21
### Changed
- Changed default value for minimal header prompt from false to true

## [3.14.0] - 2025-04-11
### Changed
- Added new TEMPLATE_TYPE for form apps to generate structure for FORM_ENGINE powered forms.

## [3.13.0] - 2025-04-04
### Changed
- New question for using minimal header
- Refactor to use new ConfirmationView in ConfirmationPage

## [3.11.0] - 2024-08-27
### Changed
- Refactor Introduction and Confirmation page
- Include base tests
- New question if you have JSON schema

## [3.10.0] - 2024-08-20
### Changed
- Prompt from blank, simple, complex, to 1 page or 4 pages, using web component patterns.

## [3.4.0] - 2020-08-26
### Changed
- E2E tests are now Cypress tests instead of Nightwatch tests.
    - The form app test uses the form tester. There's also an empty data fixture that's used in the test.
- The form confirmation page gracefully handles a missing name field so that the generated E2E test passes without any changes.
- Updated links to documentation on using the generator.

## [3.3.0] - 2019-03-04
### Changed
- Removed Redux setup in IntroductionPage for props that are already available to SaveInProgressIntro
- Updated documentation links
- renamed `jean-pants` to `formation`
- `us-forms-system` moved to `platform/forms-system`

## [3.2.0] - 2018-08-10
### Added
- New complex form template that has the following features:
    - The form is multi-chapter with some single-page chapters and a multi-page chapter
    - Imports and leverages an external schema to demonstrate how a real app would leverage a schema from `vets-json-schema`
    - Depends on imported helper and definitions modules.

## [3.1.0] - 2018-08-08
### Added
- Links to documentation at the top of the Yeoman generator output.
- Gives the user multiple types of form templates to start with: blank, 1 page, or 4 pages.
- Sample answers and default answers to guide users.
### Changed
- Updated the templates to be in line with current best practices for the Vets.gov website.
- Improved prompt answer validators and filters.
### Fixed
- Updated all file names and paths to make the generated form work with the current structure of the Vets.gov website.

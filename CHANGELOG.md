# Changelog

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)

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

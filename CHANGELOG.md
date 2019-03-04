# Changelog

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
## [3.3.0] - 2019-04-19
### Changed
- Removed Redux setup in IntroductionPage for props that are already available to SaveInProgressIntro
- Updated documentation links
## [3.2.0] - 2018-08-10
### Added
- New complex form template that has the following features:
    - The form is multi-chapter with some single-page chapters and a multi-page chapter
    - Imports and leverages an external schema to demonstrate how a real app would leverage a schema from `vets-json-schema`
    - Depends on imported helper and definitions modules.

## [3.1.0] - 2018-08-08
### Added
- Links to documentation at the top of the Yeoman generator output.
- Gives the user multiple types of form templates to start with: Blank, Simple, or Complex.
- Sample answers and default answers to guide users.

### Changed
- Updated the templates to be in line with current best practices for the Vets.gov website.
- Improved prompt answer validators and filters.

### Fixed
- Updated all file names and paths to make the generated form work with the current structure of the Vets.gov website.


# Dry-Run Functionality MVP

This MVP adds dry-run functionality to the vets-website generator to help test and validate generator behavior without actually creating files.

## Features Added

### Two Dry-Run Modes

1. **Interactive Mode Simulation (`--dry-run-interactive`)**
   - Simulates the interactive prompt flow
   - Uses CLI options as mock answers to prompts
   - Shows what prompts would be displayed
   - Tests conditional logic (e.g., form prompts when `isForm=true`)

2. **Non-Interactive Mode Simulation (`--dry-run-non-interactive`)**
   - Simulates CLI-only mode
   - Shows validation errors for missing/invalid options
   - Lists what files would be created
   - Tests error handling

### Usage Examples

#### Test Interactive Flow
```bash
# Test pure interactive mode (shows all prompts)
yo @department-of-veterans-affairs/vets-website --dry-run-interactive

# Test interactive with some mock answers (for conditional logic)
yo @department-of-veterans-affairs/vets-website --dry-run-interactive --appName="Test App" --isForm=true
```

#### Test Non-Interactive Flow
```bash
# Test with missing required options (shows validation errors)
yo @department-of-veterans-affairs/vets-website --dry-run-non-interactive --appName="Test App" --isForm=false

# Test with complete options (shows successful simulation)
yo @department-of-veterans-affairs/vets-website \
  --dry-run-non-interactive \
  --appName="Test App" \
  --folderName="test-app" \
  --entryName="test-app" \
  --rootUrl="/test-app" \
  --isForm=false
```

## Output Format

### Interactive Mode Output
```json
{
  "mode": "interactive",
  "promptsShown": [
    {
      "name": "appName",
      "message": "What's the name of your application?...",
      "type": "input",
      "default": "A New Form",
      "when": "!this.props.appName"
    }
  ],
  "questionsAsked": [...],
  "questionsAnswered": [
    {
      "name": "appName",
      "answer": "Test App",
      "source": "cli-option"
    }
  ],
  "questionsPending": [...],
  "errors": [],
  "finished": true,
  "filesWouldBeCreated": [
    "src/applications/test-app/App.jsx",
    "src/applications/test-app/manifest.json",
    ...
  ]
}
```

### Non-Interactive Mode Output
```json
{
  "mode": "non-interactive",
  "promptsSkipped": [
    {
      "name": "appName",
      "value": "Test App",
      "reason": "provided-via-cli"
    }
  ],
  "promptsMissing": [
    {
      "name": "folderName",
      "required": true,
      "message": "folderName is required in non-interactive mode"
    }
  ],
  "questionsAnswered": [...],
  "questionsPending": [...],
  "errors": [
    "folderName is required in non-interactive mode",
    "entryName is required in non-interactive mode"
  ],
  "finished": false,
  "filesWouldBeCreated": []
}
```

## Implementation Details

### Key Components Added

1. **Unified Generator (`generators/app/index.js`)**
   - Added `dryRunInteractive` and `dryRunNonInteractive` options
   - Added `_simulateInteractiveMode()` method
   - Added `_simulateNonInteractiveMode()` method
   - Added `_simulateFileCreation()` method
   - Modified `prompting()` to detect dry-run modes
   - Skip file operations in dry-run modes
   - Uses strategy pattern to handle both app and form generation

2. **Strategy Implementation**
   - App Strategy (`generators/app/strategies/app-strategy.js`)
   - Form Strategy (`generators/app/strategies/form-strategy.js`)
   - Base Strategy (`generators/app/strategies/base-strategy.js`)
   - Provides clean separation between app and form generation logic

3. **Test File (`test/dry-run.spec.js`)**
   - Basic tests for both dry-run modes
   - Validates simulation output structure

### Test Coverage Enabled

This MVP enables testing of:

✅ **Interactive Flow**
- What prompts are shown in different scenarios
- Conditional prompt logic (form prompts when `isForm=true`)
- Mock answers from CLI options

✅ **Non-Interactive Flow**
- Validation error handling for missing options
- CLI argument processing
- Required field checking

✅ **File Generation**
- What files would be created for different app types
- Form vs non-form file differences

## Benefits

1. **No Complex Mocking**: Works with any Node version, no yeoman-test complexity
2. **Real Logic Testing**: Uses actual generator code paths
3. **Easy Testing**: Simple CLI commands to test different scenarios
4. **Comprehensive Coverage**: Tests prompts, validation, and file generation
5. **Debugging Friendly**: Clear JSON output for analysis

## Future Enhancements

- Add dry-run support for other sub-generators
- More detailed file content simulation
- Integration with automated test suites
- Enhanced error reporting and suggestions
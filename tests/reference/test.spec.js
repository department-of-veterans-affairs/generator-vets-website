const { testGenerator } = require('./helpers');

describe('Simple Output Tests', () => {
  it('should show validation error for invalid form number', async () => {
    const output = await testGenerator({
      dryRunNonInteractive: true,
      appName: 'blah',
      formNumber: '12345', // Invalid format
    });

    console.log('Output was:\n', output);

    // Assert(output.includes('❌ Validation errors:'));
    // // Assert(output.includes('--folder-name') && output.includes('Required'));
    // assert(output.includes('--entry-name') && output.includes('Required'));
    // assert(output.includes('--root-url') && output.includes('Required'));
    // assert(output.includes('--is-form') && output.includes('Required'));
    // assert(
    //   output.includes('formNumber') &&
    //     output.includes('Form number should follow VA format'),
    // );
  });

  // It('should show error for missing form number', async () => {
  //   const output = await testGenerator({
  //     dryRunNonInteractive: true,
  //     appName: 'blah',
  //     // FormNumber is missing
  //   });

  //   console.log('Output was:\n', output);

  //   // assert(output.includes('❌ Validation errors:'));
  //   // // Assert(output.includes('--folder-name') && output.includes('Required'));
  //   // assert(output.includes('--entry-name') && output.includes('Required'));
  //   // assert(output.includes('--root-url') && output.includes('Required'));
  //   // assert(output.includes('--is-form') && output.includes('Required'));
  // });
});

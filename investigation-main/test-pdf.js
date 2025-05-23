// This script runs the test-pdf.ts file using ts-node
const { exec } = require('child_process');

console.log('Running test with ts-node...');
exec('npx ts-node -r tsconfig-paths/register src/test-pdf.ts', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error running test: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Test stderr: ${stderr}`);
  }

  console.log(stdout);
  console.log('Test completed successfully.');
});

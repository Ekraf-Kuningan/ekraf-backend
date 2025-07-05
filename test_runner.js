// Simple test to check if the enhanced script works
const { exec } = require('child_process');

console.log('Testing the enhanced script...');

exec('node test_endpoints.js', { timeout: 30000 }, (error, stdout, stderr) => {
  if (error) {
    console.log('Error:', error.message);
    return;
  }
  if (stderr) {
    console.log('Stderr:', stderr);
    return;
  }
  console.log('Stdout:', stdout);
});

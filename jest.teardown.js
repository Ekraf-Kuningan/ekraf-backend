module.exports = async () => {
  console.log('\nCleaning up test environment...');
  // No actual database cleanup needed as Prisma client is mocked
  console.log('Test environment cleanup complete.');
};
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFiles: ['dotenv/config'],
  globalSetup: '<rootDir>/jest.setup.new.js',
  globalTeardown: '<rootDir>/jest.teardown.js',
};
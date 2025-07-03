// Set up environment variables for testing
process.env.JWT_SECRET = 'test_jwt_secret_for_testing_only';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000/api';

// No database setup needed since tests are fully mocked

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:4097/api'; // Assuming your Next.js server runs on this port

// Test configuration
const TEST_CONFIG = {
  showResponseData: true,
  maxResponseLength: 100,
  retryFailedRequests: true,
  maxRetries: 2,
  retryDelay: 1000,
  skipSlowTests: false,
  generateReport: true,
  saveFailedTests: true,
  parallel: false,
  timeout: 10000
};

// Test statistics
const testStats = {
  totalTests: 0,
  successfulTests: 0,
  failedTests: 0,
  retriedTests: 0,
  startTime: null,
  endTime: null,
  endpointResults: {},
  failedTestDetails: []
};

let authToken = null;
let adminToken = null;
let superAdminToken = null;

// Color codes for better console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper function for colored console output
function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Delay function for retries
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to get authentication token for different user levels
async function getAuthTokenForLevel(level = 'umkm') {
  const users = {
    'umkm': { username: 'dewani', password: 'dewani123' },
    'admin': { username: 'admin', password: 'admin123' },
    'superadmin': { username: 'superadmin', password: 'superadmin123' }
  };

  try {
    const loginData = {
      usernameOrEmail: users[level].username,
      password: users[level].password
    };

    const startTime = Date.now();
    const response = await axios.post(`${API_BASE_URL}/auth/login/${level}`, loginData, {
      timeout: TEST_CONFIG.timeout
    });
    const duration = Date.now() - startTime;
    
    if (response.data && response.data.token) {
      colorLog('green', `✓ ${level.toUpperCase()} authentication token obtained (${duration}ms)`);
      return response.data.token;
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    colorLog('red', `• ${level.toUpperCase()} login failed: ${errorMessage}`);
    
    // Add to failed tests for tracking
    testStats.failedTestDetails.push({
      endpoint: `POST /auth/login/${level}`,
      level: level,
      error: errorMessage,
      statusCode: error.response?.status,
      timestamp: new Date().toISOString()
    });
  }
  return null;
}

const routeFiles = [
  // Authentication endpoints first - in logical order
  'C:/ekraf-backend/app/api/auth/register/umkm/route.ts',
  'C:/ekraf-backend/app/api/auth/login/[level]/route.ts',
  'C:/ekraf-backend/app/api/auth/verify/route.ts',
  'C:/ekraf-backend/app/api/auth/forgot-password/route.ts',
  'C:/ekraf-backend/app/api/auth/reset-password/route.ts',
  
  // Public endpoints (no auth required)
  'C:/ekraf-backend/app/api/swagger/route.ts',
  'C:/ekraf-backend/app/api/master-data/levels/route.ts',
  'C:/ekraf-backend/app/api/master-data/subsectors/route.ts',
  'C:/ekraf-backend/app/api/master-data/business-categories/route.ts',
  
  // Basic CRUD endpoints
  'C:/ekraf-backend/app/api/subsectors/route.ts',
  'C:/ekraf-backend/app/api/subsectors/[id]/route.ts',
  'C:/ekraf-backend/app/api/business-categories/route.ts',
  'C:/ekraf-backend/app/api/business-categories/[id]/route.ts',
  'C:/ekraf-backend/app/api/products/route.ts',
  'C:/ekraf-backend/app/api/products/[id]/route.ts',
  'C:/ekraf-backend/app/api/products/[id]/links/route.ts',
  'C:/ekraf-backend/app/api/products/[id]/links/[linkId]/route.ts',
  'C:/ekraf-backend/app/api/articles/route.ts',
  'C:/ekraf-backend/app/api/articles/[id]/route.ts',
  
  // User endpoints (require auth)
  'C:/ekraf-backend/app/api/users/route.ts',
  'C:/ekraf-backend/app/api/users/profile/route.ts',
  'C:/ekraf-backend/app/api/users/[id]/route.ts',
  'C:/ekraf-backend/app/api/users/[id]/articles/route.ts',
  'C:/ekraf-backend/app/api/users/[id]/products/route.ts'
];

async function testEndpoint(filePath) {
  const apiPath = filePath
    .replace('C:/ekraf-backend/app/api', '')
    .replace(/\\/g, '/') // Replace backslashes with forward slashes
    .replace('/route.ts', '')
    .replace(/\[(\w+)\]/g, (match, p1) => {
      // Replace dynamic segments with placeholder values
      if (p1 === 'id' || p1 === 'linkId') return '1'; // Use '1' for ID placeholders
      if (p1 === 'level') return 'umkm'; // Use 'umkm' for level placeholder
      return 'placeholder'; // Fallback for other dynamic segments
    });

  const url = `${API_BASE_URL}${apiPath}`;
  colorLog('blue', `\nTesting endpoint: ${url}`);

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Determine supported methods by looking for exported functions
    const methods = [];
    if (fileContent.includes('export async function GET')) methods.push('GET');
    if (fileContent.includes('export async function POST')) methods.push('POST');
    if (fileContent.includes('export async function PUT')) methods.push('PUT');
    if (fileContent.includes('export async function DELETE')) methods.push('DELETE');

    if (methods.length === 0) {
      colorLog('yellow', '  No HTTP methods found in this route file.');
      return;
    }

    for (const method of methods) {
      await testSingleMethod(url, method);
    }
  } catch (fileError) {
    colorLog('red', `  Error reading file ${filePath}: ${fileError.message}`);
  }
}

async function testSingleMethod(url, method) {
  console.log(`  Attempting ${method} request...`);
  
  // Test with different user levels for protected endpoints
  const tokensToTest = [
    { name: 'UMKM', token: authToken },
    { name: 'Admin', token: adminToken },
    { name: 'SuperAdmin', token: superAdminToken }
  ];
  
  // For public endpoints, test without auth first
  if (url.includes('/swagger') || url.includes('/master-data')) {
    await testWithToken(url, method, null, 'Public');
    return;
  }
  
  // For auth endpoints, test without token
  if (url.includes('/auth/')) {
    await testWithToken(url, method, null, 'Auth');
    return;
  }
  
  // For protected endpoints, test with all available tokens
  let anySuccess = false;
  for (const { name, token } of tokensToTest) {
    if (token) {
      const success = await testWithToken(url, method, token, name);
      if (success) anySuccess = true;
    }
  }
  
  // If no token worked, try without auth
  if (!anySuccess) {
    await testWithToken(url, method, null, 'No Auth');
  }
}

async function testWithToken(url, method, token, levelName, retryCount = 0) {
  testStats.totalTests++;
  let startTime = Date.now(); // Declare startTime at function scope
  
  try {
    const config = {
      headers: {},
      timeout: TEST_CONFIG.timeout
    };

    // Add auth token if provided
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    let response;
    const data = getTestData(url, method);

    startTime = Date.now(); // Update startTime just before request
    
    switch (method) {
      case 'GET':
        response = await axios.get(url, config);
        break;
      case 'POST':
        response = await axios.post(url, data, config);
        break;
      case 'PUT':
        response = await axios.put(url, data, config);
        break;
      case 'DELETE':
        response = await axios.delete(url, config);
        break;
    }
    
    const duration = Date.now() - startTime;
    
    testStats.successfulTests++;
    
    // Record endpoint result
    const endpointKey = `${method} ${url}`;
    if (!testStats.endpointResults[endpointKey]) {
      testStats.endpointResults[endpointKey] = {};
    }
    testStats.endpointResults[endpointKey][levelName] = {
      status: 'success',
      statusCode: response.status,
      duration: duration,
      retryCount: retryCount
    };
    
    colorLog('green', `  ✓ ${method} ${url} [${levelName}] - Status: ${response.status} (${duration}ms)`);
    if (response.data && TEST_CONFIG.showResponseData) {
      console.log(`    Response: ${JSON.stringify(response.data).substring(0, TEST_CONFIG.maxResponseLength)}...`);
    }
    return true;
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime; // Now startTime is always defined
    
    // Retry logic
    if (TEST_CONFIG.retryFailedRequests && retryCount < TEST_CONFIG.maxRetries && error.code !== 'ECONNREFUSED') {
      testStats.retriedTests++;
      colorLog('yellow', `  ⚠ ${method} ${url} [${levelName}] - Retry ${retryCount + 1}/${TEST_CONFIG.maxRetries}`);
      await delay(TEST_CONFIG.retryDelay);
      return await testWithToken(url, method, token, levelName, retryCount + 1);
    }
    
    testStats.failedTests++;
    
    // Record failed test details
    const failedTest = {
      endpoint: `${method} ${url}`,
      level: levelName,
      error: error.message,
      statusCode: error.response?.status,
      data: error.response?.data,
      retryCount: retryCount,
      timestamp: new Date().toISOString()
    };
    testStats.failedTestDetails.push(failedTest);
    
    // Record endpoint result
    const endpointKey = `${method} ${url}`;
    if (!testStats.endpointResults[endpointKey]) {
      testStats.endpointResults[endpointKey] = {};
    }
    testStats.endpointResults[endpointKey][levelName] = {
      status: 'failed',
      statusCode: error.response?.status,
      error: error.message,
      duration: duration,
      retryCount: retryCount
    };
    
    colorLog('red', `  ✗ ${method} ${url} [${levelName}] - Error: ${error.message}`);
    if (error.response) {
      console.error(`    Status: ${error.response.status}`);
      console.error(`    Data: ${JSON.stringify(error.response.data).substring(0, 200)}...`);
    }
    return false;
  }
}

// Separate test data generators for better maintainability
const testDataGenerators = {
  registerUMKM: () => ({
    name: 'Test User',
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'password123',
    gender: 'Laki-laki',
    phone_number: '08123456789',
    business_name: 'Test Business',
    business_status: 'BARU',
    business_category_id: '1'
  }),
  
  login: (url) => {
    if (url.includes('/admin')) {
      return { usernameOrEmail: 'admin', password: 'admin123' };
    } else if (url.includes('/superadmin')) {
      return { usernameOrEmail: 'superadmin', password: 'superadmin123' };
    } else {
      return { usernameOrEmail: 'dewani', password: 'dewani123' };
    }
  },
  
  forgotPassword: () => ({ email: 'test@example.com' }),
  
  resetPassword: () => ({ token: 'sample-token', password: 'newpassword123' }),
  
  article: () => ({
    title: `Test Article ${Date.now()}`,
    content: 'This is a test article content.',
    author_id: 1,
    artikel_kategori_id: 1,
  }),
  
  product: () => ({
    name: `Test Product ${Date.now()}`,
    owner_name: 'Test Owner',
    description: 'Test product description',
    price: 100.00,
    stock: 10,
    phone_number: '08123456789',
    business_category_id: 1,
    image: 'https://example.com/test-image.jpg'
  }),
  
  businessCategory: () => ({
    name: `Test Category ${Date.now()}`,
    sub_sector_id: 28,
  }),
  
  subsector: () => ({
    title: `Test Subsector ${Date.now()}`,
    description: 'Test subsector description'
  }),
  
  genericUpdate: () => ({ name: `Updated Name ${Date.now()}` })
};

function getTestData(url, method) {
  if (method === 'GET' || method === 'DELETE') {
    return {};
  }

  if (url.includes('/api/auth/register/umkm') && method === 'POST') {
    return testDataGenerators.registerUMKM();
  } 
  
  if (url.includes('/api/auth/login') && method === 'POST') {
    return testDataGenerators.login(url);
  } 
  
  if (url.includes('/api/auth/forgot-password') && method === 'POST') {
    return testDataGenerators.forgotPassword();
  } 
  
  if (url.includes('/api/auth/reset-password') && method === 'POST') {
    return testDataGenerators.resetPassword();
  } 
  
  if (url.includes('/api/articles') && method === 'POST') {
    return testDataGenerators.article();
  } 
  
  if (url.includes('/api/products') && method === 'POST') {
    return testDataGenerators.product();
  } 
  
  if (url.includes('/api/business-categories') && method === 'POST') {
    return testDataGenerators.businessCategory();
  } 
  
  if (url.includes('/api/subsectors') && method === 'POST') {
    return testDataGenerators.subsector();
  } 
  
  if (method === 'PUT') {
    return testDataGenerators.genericUpdate();
  }

  return {};
}

async function runAllTests() {
  colorLog('cyan', '🚀 Starting comprehensive endpoint tests...\n');
  testStats.startTime = new Date();
  
  colorLog('blue', '📋 Testing endpoints in logical order...');
  
  for (const filePath of routeFiles) {
    
    // Special handling for register endpoint
    if (filePath.includes('/auth/register/umkm/')) {
      colorLog('magenta', '\n🔐 Testing user registration first...');
      await testEndpoint(filePath);
      continue;
    }
    
    // Special handling for login endpoint - test all user levels
    if (filePath.includes('/auth/login/')) {
      await testAllUserLevels();
      continue;
    }
    
    // Test other endpoints normally
    await testEndpoint(filePath);
  }
  
  testStats.endTime = new Date();
  const duration = ((testStats.endTime - testStats.startTime) / 1000).toFixed(2);
  
  colorLog('green', '\n✅ All endpoint tests completed.');
  colorLog('bright', `📊 Test Summary:`);
  console.log(`   - Total endpoints: ${routeFiles.length}`);
  console.log(`   - Total tests: ${testStats.totalTests}`);
  colorLog('green', `   - Successful: ${testStats.successfulTests} (${((testStats.successfulTests/testStats.totalTests)*100).toFixed(1)}%)`);
  colorLog('red', `   - Failed: ${testStats.failedTests} (${((testStats.failedTests/testStats.totalTests)*100).toFixed(1)}%)`);
  if (testStats.retriedTests > 0) {
    colorLog('yellow', `   - Retried: ${testStats.retriedTests}`);
  }
  console.log(`   - Duration: ${duration} seconds`);
  
  const tokenCount = [authToken, adminToken, superAdminToken].filter(Boolean).length;
  colorLog('cyan', `🔑 Authentication: ${tokenCount}/3 tokens obtained`);
  
  if (authToken) colorLog('green', '   - UMKM token: ✅');
  if (adminToken) colorLog('green', '   - Admin token: ✅');
  if (superAdminToken) colorLog('green', '   - SuperAdmin token: ✅');
  
  // Generate detailed report
  if (TEST_CONFIG.generateReport) {
    generateTestReport();
  }
  
  // Save failed tests if configured
  if (TEST_CONFIG.saveFailedTests && testStats.failedTestDetails.length > 0) {
    saveFailedTestsReport();
  }
}

// Test all user levels
async function testAllUserLevels() {
  colorLog('cyan', '\n🔑 Testing login for all user levels...');
  
  // Test UMKM login
  authToken = await getAuthTokenForLevel('umkm');
  
  // Test Admin login
  adminToken = await getAuthTokenForLevel('admin');
  
  // Test SuperAdmin login
  superAdminToken = await getAuthTokenForLevel('superadmin');
  
  colorLog('bright', '\n📊 Login Test Results:');
  colorLog(authToken ? 'green' : 'red', `- UMKM: ${authToken ? '✅ Success' : '❌ Failed'}`);
  colorLog(adminToken ? 'green' : 'red', `- Admin: ${adminToken ? '✅ Success' : '❌ Failed'}`);
  colorLog(superAdminToken ? 'green' : 'red', `- SuperAdmin: ${superAdminToken ? '✅ Success' : '❌ Failed'}`);
}

// Generate comprehensive test report
function generateTestReport() {
  colorLog('bright', '\n📋 Generating detailed test report...');
  
  console.log('\n' + '='.repeat(80));
  colorLog('bright', '📊 DETAILED TEST REPORT');
  console.log('='.repeat(80));
  
  // Summary by endpoint
  colorLog('cyan', '\n🔍 Results by Endpoint:');
  Object.entries(testStats.endpointResults).forEach(([endpoint, results]) => {
    console.log(`\n${endpoint}:`);
    Object.entries(results).forEach(([level, result]) => {
      const statusIcon = result.status === 'success' ? '✅' : '❌';
      const retryInfo = result.retryCount > 0 ? ` (${result.retryCount} retries)` : '';
      const durationInfo = result.duration ? ` - ${result.duration}ms` : '';
      console.log(`  ${statusIcon} ${level}: ${result.statusCode || 'N/A'}${durationInfo}${retryInfo}`);
    });
  });
  
  // Permission analysis
  colorLog('cyan', '\n🔐 Permission Analysis:');
  const permissionAnalysis = analyzePermissions();
  Object.entries(permissionAnalysis).forEach(([level, analysis]) => {
    console.log(`\n${level} (Level ${getLevelId(level)}):`);
    console.log(`  ✅ Can access: ${analysis.canAccess.length} endpoints`);
    console.log(`  ❌ Cannot access: ${analysis.cannotAccess.length} endpoints`);
    console.log(`  🚫 Forbidden: ${analysis.forbidden.length} endpoints`);
  });
  
  // Top errors
  if (testStats.failedTestDetails.length > 0) {
    colorLog('red', '\n🚨 Most Common Errors:');
    const errorCounts = {};
    testStats.failedTestDetails.forEach(test => {
      const error = test.error;
      errorCounts[error] = (errorCounts[error] || 0) + 1;
    });
    
    Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([error, count]) => {
        console.log(`  • ${error}: ${count} occurrences`);
      });
  }
  
  console.log('\n' + '='.repeat(80));
}

// Analyze permissions for each user level
function analyzePermissions() {
  const analysis = {
    'UMKM': { canAccess: [], cannotAccess: [], forbidden: [] },
    'Admin': { canAccess: [], cannotAccess: [], forbidden: [] },
    'SuperAdmin': { canAccess: [], cannotAccess: [], forbidden: [] }
  };
  
  Object.entries(testStats.endpointResults).forEach(([endpoint, results]) => {
    Object.entries(results).forEach(([level, result]) => {
      // Ensure the level exists in analysis
      if (!analysis[level]) {
        analysis[level] = { canAccess: [], cannotAccess: [], forbidden: [] };
      }
      
      if (result.status === 'success') {
        analysis[level].canAccess.push(endpoint);
      } else if (result.statusCode === 403) {
        analysis[level].forbidden.push(endpoint);
      } else {
        analysis[level].cannotAccess.push(endpoint);
      }
    });
  });
  
  return analysis;
}

// Get level ID for user level
function getLevelId(level) {
  const levelMap = { 'UMKM': 3, 'Admin': 2, 'SuperAdmin': 1 };
  return levelMap[level] || 'Unknown';
}

// Save failed tests to file
function saveFailedTestsReport() {
  try {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFailed: testStats.failedTests,
        totalRetried: testStats.retriedTests
      },
      failedTests: testStats.failedTestDetails
    };
    
    const filename = `test-failures-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    colorLog('yellow', `💾 Failed tests report saved to: ${filename}`);
  } catch (error) {
    colorLog('red', `❌ Failed to save test report: ${error.message}`);
  }
}

// Start the test execution
console.log('🔧 Initializing enhanced test runner...');
runAllTests().catch(error => {
  colorLog('red', `❌ Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

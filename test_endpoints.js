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
  retryFailedRequests: false,
  skipSlowTests: false
};

// Test statistics
const testStats = {
  totalTests: 0,
  successfulTests: 0,
  failedTests: 0,
  startTime: null,
  endTime: null
};

let authToken = null;
let adminToken = null;
let superAdminToken = null;

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

    const response = await axios.post(`${API_BASE_URL}/auth/login/${level}`, loginData);
    if (response.data && response.data.token) {
      console.log(`✓ ${level.toUpperCase()} authentication token obtained`);
      return response.data.token;
    }
  } catch (error) {
    console.log(`• ${level.toUpperCase()} login failed:`, error.response?.data?.message || error.message);
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
  console.log(`\nTesting endpoint: ${url}`);

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Determine supported methods by looking for exported functions
    const methods = [];
    if (fileContent.includes('export async function GET')) methods.push('GET');
    if (fileContent.includes('export async function POST')) methods.push('POST');
    if (fileContent.includes('export async function PUT')) methods.push('PUT');
    if (fileContent.includes('export async function DELETE')) methods.push('DELETE');

    if (methods.length === 0) {
      console.log('  No HTTP methods found in this route file.');
      return;
    }

    for (const method of methods) {
      await testSingleMethod(url, method);
    }
  } catch (fileError) {
    console.error(`  Error reading file ${filePath}: ${fileError.message}`);
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

async function testWithToken(url, method, token, levelName) {
  testStats.totalTests++;
  
  try {
    const config = {
      headers: {}
    };

    // Add auth token if provided
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    let response;
    const data = getTestData(url, method);

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
    
    testStats.successfulTests++;
    console.log(`  ✓ ${method} ${url} [${levelName}] - Status: ${response.status}`);
    if (response.data && TEST_CONFIG.showResponseData) {
      console.log(`    Response: ${JSON.stringify(response.data).substring(0, TEST_CONFIG.maxResponseLength)}...`);
    }
    return true;
  } catch (error) {
    testStats.failedTests++;
    console.error(`  ✗ ${method} ${url} [${levelName}] - Error: ${error.message}`);
    if (error.response) {
      console.error(`    Status: ${error.response.status}`);
      console.error(`    Data: ${JSON.stringify(error.response.data).substring(0, 200)}...`);
    }
    return false;
  }
}

function getTestData(url, method) {
  if (method === 'GET' || method === 'DELETE') {
    return {};
  }

  // Add sample data for specific endpoints if known
  if (url.includes('/api/auth/register/umkm') && method === 'POST') {
    return {
      name: 'Test User',
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'password123',
      gender: 'Laki-laki',
      phone_number: '08123456789',
      business_name: 'Test Business',
      business_status: 'BARU',
      business_category_id: '1'
    };
  } else if (url.includes('/api/auth/login') && method === 'POST') {
    // Return different login data based on URL level
    if (url.includes('/admin')) {
      return {
        usernameOrEmail: 'admin',
        password: 'admin123'
      };
    } else if (url.includes('/superadmin')) {
      return {
        usernameOrEmail: 'superadmin',
        password: 'superadmin123'
      };
    } else {
      return {
        usernameOrEmail: 'dewani',
        password: 'dewani123'
      };
    }
  } else if (url.includes('/api/auth/forgot-password') && method === 'POST') {
    return {
      email: 'test@example.com'
    };
  } else if (url.includes('/api/auth/reset-password') && method === 'POST') {
    return {
      token: 'sample-token',
      password: 'newpassword123'
    };
  } else if (url.includes('/api/articles') && method === 'POST') {
    return {
      title: `Test Article ${Date.now()}`,
      content: 'This is a test article content.',
      author_id: 1,
      artikel_kategori_id: 1,
    };
  } else if (url.includes('/api/products') && method === 'POST') {
    return {
      name: `Test Product ${Date.now()}`,
      owner_name: 'Test Owner',
      description: 'Test product description',
      price: 100.00,
      stock: 10,
      phone_number: '08123456789',
      business_category_id: 1,
    };
  } else if (url.includes('/api/business-categories') && method === 'POST') {
    return {
      name: `Test Category ${Date.now()}`,
      sub_sector_id: 1,
    };
  } else if (url.includes('/api/subsectors') && method === 'POST') {
    return {
      title: `Test Subsector ${Date.now()}`,
    };
  } else if (method === 'PUT') {
    // Generic PUT data
    return { name: `Updated Name ${Date.now()}` };
  }

  return {};
}

async function runAllTests() {
  console.log('🚀 Starting endpoint tests...\n');
  testStats.startTime = new Date();
  
  console.log('📋 Testing endpoints in logical order...');
  
  for (const filePath of routeFiles) {
    
    // Special handling for register endpoint
    if (filePath.includes('/auth/register/umkm/')) {
      console.log('\n🔐 Testing user registration first...');
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
  
  console.log('\n✅ All endpoint tests completed.');
  console.log(`📊 Test Summary:`);
  console.log(`   - Total endpoints: ${routeFiles.length}`);
  console.log(`   - Total tests: ${testStats.totalTests}`);
  console.log(`   - Successful: ${testStats.successfulTests} (${((testStats.successfulTests/testStats.totalTests)*100).toFixed(1)}%)`);
  console.log(`   - Failed: ${testStats.failedTests} (${((testStats.failedTests/testStats.totalTests)*100).toFixed(1)}%)`);
  console.log(`   - Duration: ${duration} seconds`);
  
  const tokenCount = [authToken, adminToken, superAdminToken].filter(Boolean).length;
  console.log(`🔑 Authentication: ${tokenCount}/3 tokens obtained`);
  
  if (authToken) console.log('   - UMKM token: ✅');
  if (adminToken) console.log('   - Admin token: ✅');
  if (superAdminToken) console.log('   - SuperAdmin token: ✅');
}

// Legacy function to get authentication token (for UMKM level)
async function getAuthToken() {
  authToken = await getAuthTokenForLevel('umkm');
  return authToken;
}

// Test all user levels
async function testAllUserLevels() {
  console.log('\n🔑 Testing login for all user levels...');
  
  // Test UMKM login
  authToken = await getAuthTokenForLevel('umkm');
  
  // Test Admin login
  adminToken = await getAuthTokenForLevel('admin');
  
  // Test SuperAdmin login
  superAdminToken = await getAuthTokenForLevel('superadmin');
  
  console.log('\n📊 Login Test Results:');
  console.log(`- UMKM: ${authToken ? '✅ Success' : '❌ Failed'}`);
  console.log(`- Admin: ${adminToken ? '✅ Success' : '❌ Failed'}`);
  console.log(`- SuperAdmin: ${superAdminToken ? '✅ Success' : '❌ Failed'}`);
}

runAllTests();

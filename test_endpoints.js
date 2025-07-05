/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:4097/api'; // Assuming your Next.js server runs on this port

let authToken = null;

// Function to get authentication token
async function getAuthToken() {
  try {
    // Try to login with existing user from production data
    const loginData = {
      usernameOrEmail: 'dewani', // username from production data (user ID 11)
      password: 'dewani123' // correct password for dewani user
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login/umkm`, loginData);
      if (response.data && response.data.token) {
        authToken = response.data.token;
        console.log('✓ Authentication token obtained');
        return authToken;
      }
    } catch (loginError) {
      console.log('• Login with existing user failed, trying to register new user...');
    }

    // If login failed, try to register a test user
    const registerData = {
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

    try {
      await axios.post(`${API_BASE_URL}/auth/register/umkm`, registerData);
      console.log('✓ Test user registered successfully');
      
      // Try to login with new user
      const newLoginData = {
        usernameOrEmail: registerData.username,
        password: registerData.password
      };

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/login/umkm`, newLoginData);
        if (response.data && response.data.token) {
          authToken = response.data.token;
          console.log('✓ Authentication token obtained');
          return authToken;
        }
      } catch {
        console.log('• Login with new user failed');
      }
    } catch {
      console.log('• Test user registration failed (might already exist)');
    }
  } catch {
    console.log('• Could not obtain auth token');
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
  try {
    const config = {
      headers: {}
    };

    // Add auth token if available
    if (authToken) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
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
    
    console.log(`  ✓ ${method} ${url} - Status: ${response.status}`);
    if (response.data) {
      console.log(`    Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
    }
  } catch (error) {
    console.error(`  ✗ ${method} ${url} - Error: ${error.message}`);
    if (error.response) {
      console.error(`    Status: ${error.response.status}`);
      console.error(`    Data: ${JSON.stringify(error.response.data).substring(0, 200)}...`);
    }
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
    return {
      usernameOrEmail: 'testuser',
      password: 'password123'
    };
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
  
  console.log('📋 Testing endpoints in logical order...');
  
  for (const filePath of routeFiles) {
    
    // Special handling for register endpoint
    if (filePath.includes('/auth/register/umkm/')) {
      console.log('\n🔐 Testing user registration first...');
      await testEndpoint(filePath);
      continue;
    }
    
    // Special handling for login endpoint - try to get auth token after testing
    if (filePath.includes('/auth/login/')) {
      console.log('\n🔑 Testing login endpoint...');
      await testEndpoint(filePath);
      
      // Try to get auth token for subsequent tests
      if (!authToken) {
        console.log('\n� Attempting to get authentication token for remaining tests...');
        await getAuthToken();
      }
      continue;
    }
    
    // Test other endpoints normally
    await testEndpoint(filePath);
  }
  
  console.log('\n✅ All endpoint tests completed.');
  console.log(`📊 Summary: Tested ${routeFiles.length} endpoints`);
  
  if (authToken) {
    console.log('🔑 Tests completed with authentication token');
  } else {
    console.log('⚠️  Tests completed without authentication token');
  }
}

runAllTests();

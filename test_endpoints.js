const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:4097/api'; // Assuming your Next.js server runs on this port

const routeFiles = [
  'C:/ekraf-backend/app/api/users/[id]/articles/route.ts',
  'C:/ekraf-backend/app/api/products/[id]/links/route.ts',
  'C:/ekraf-backend/app/api/products/[id]/links/[linkId]/route.ts',
  'C:/ekraf-backend/app/api/auth/verify/route.ts',
  'C:/ekraf-backend/app/api/auth/reset-password/route.ts',
  'C:/ekraf-backend/app/api/auth/login/[level]/route.ts',
  'C:/ekraf-backend/app/api/auth/forgot-password/route.ts',
  'C:/ekraf-backend/app/api/users/route.ts',
  'C:/ekraf-backend/app/api/subsectors/route.ts',
  'C:/ekraf-backend/app/api/master-data/levels/route.ts',
  'C:/ekraf-backend/app/api/products/[id]/route.ts',
  'C:/ekraf-backend/app/api/users/profile/route.ts',
  'C:/ekraf-backend/app/api/users/[id]/route.ts',
  'C:/ekraf-backend/app/api/subsectors/[id]/route.ts',
  'C:/ekraf-backend/app/api/users/[id]/products/route.ts',
  'C:/ekraf-backend/app/api/master-data/subsectors/route.ts',
  'C:/ekraf-backend/app/api/products/route.ts',
  'C:/ekraf-backend/app/api/master-data/business-categories/route.ts',
  'C:/ekraf-backend/app/api/business-categories/route.ts',
  'C:/ekraf-backend/app/api/business-categories/[id]/route.ts',
  'C:/ekraf-backend/app/api/auth/register/umkm/route.ts',
  'C:/ekraf-backend/app/api/articles/route.ts',
  'C:/ekraf-backend/app/api/articles/[id]/route.ts',
  'C:/ekraf-backend/app/api/swagger/route.ts'
];

async function testEndpoint(filePath) {
  const apiPath = filePath
    .replace('C:/ekraf-backend/app/api', '')
    .replace(/\\/g, '/') // Replace backslashes with forward slashes
    .replace('/route.ts', '')
    .replace(/\\[(\\w+)\\]/g, (match, p1) => {
      // Replace dynamic segments with placeholder values
      if (p1 === 'id' || p1 === 'linkId') return '1'; // Use '1' for ID placeholders
      if (p1 === 'level') return 'admin'; // Use 'admin' for level placeholder
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
      console.log(`  Attempting ${method} request...`);
      try {
        let response;
        let data = {}; // Default empty data for POST/PUT/DELETE

        // Add sample data for specific endpoints if known
        if (url.includes('/api/auth/register/umkm') && method === 'POST') {
          data = {
            name: 'Test User',
            username: `testuser_${Date.now()}`,
            email: `test_${Date.now()}@example.com`,
            password: 'password123',
            gender: 'Laki-laki',
            phone_number: '08123456789',
          };
        } else if (url.includes('/api/articles') && method === 'POST') {
          data = {
            title: `Test Article ${Date.now()}`,
            content: 'This is a test article content.',
            author_id: 1, // Assuming a valid author_id exists
            artikel_kategori_id: 1, // Assuming a valid category ID exists
          };
        } else if (url.includes('/api/products') && method === 'POST') {
          data = {
            name: `Test Product ${Date.now()}`,
            owner_name: 'Test Owner',
            description: 'Test product description',
            price: 100.00,
            stock: 10,
            phone_number: '08123456789',
            business_category_id: 1, // Assuming a valid business_category_id
          };
        } else if (url.includes('/api/business-categories') && method === 'POST') {
          data = {
            name: `Test Category ${Date.now()}`,
            sub_sector_id: 1, // Assuming a valid sub_sector_id
          };
        } else if (url.includes('/api/subsectors') && method === 'POST') {
          data = {
            title: `Test Subsector ${Date.now()}`,
          };
        } else if (method === 'PUT') {
          // Generic PUT data
          data = { name: `Updated Name ${Date.now()}` };
        }

        switch (method) {
          case 'GET':
            response = await axios.get(url);
            break;
          case 'POST':
            response = await axios.post(url, data);
            break;
          case 'PUT':
            response = await axios.put(url, data);
            break;
          case 'DELETE':
            response = await axios.delete(url);
            break;
        }
        console.log(`  ${method} ${url} - Status: ${response.status}`);
        // console.log('  Response Data:', response.data); // Uncomment for detailed response
      } catch (error) {
        console.error(`  ${method} ${url} - Error: ${error.message}`);
        if (error.response) {
          console.error('    Status:', error.response.status);
          console.error('    Data:', error.response.data);
        }
      }
    }
  } catch (fileError) {
    console.error(`  Error reading file ${filePath}: ${fileError.message}`);
  }
}

async function runAllTests() {
  for (const filePath of routeFiles) {
    await testEndpoint(filePath);
  }
  console.log('\nAll endpoint tests completed.');
}

runAllTests();

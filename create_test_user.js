/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('Creating test user...');
    
    // Hash password for test user
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    // Create test user
    const testUser = await prisma.users.create({
      data: {
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        level_id: 3, // umkm level
        business_name: 'Test Business',
        business_status: 'BARU',
        business_category_id: 1, // kuliner
        verifiedAt: new Date(), // Mark as verified
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    console.log('✅ Test user created successfully:');
    console.log('- Username: testuser');
    console.log('- Email: test@example.com');
    console.log('- Password: password123');
    console.log('- Level: umkm (3)');
    console.log('- Verified: Yes');
    
    // Also create a user like the one from production data
    const hashedPasswordProd = await bcrypt.hash('dewani123', 12);
    
    const prodUser = await prisma.users.create({
      data: {
        name: 'Dewani',
        username: 'dewani',
        email: 'dewani@example.com',
        password: hashedPasswordProd,
        level_id: 3, // umkm level
        business_name: 'Dewani Business',
        business_status: 'SUDAH_LAMA',
        business_category_id: 1, // kuliner
        verifiedAt: new Date(), // Mark as verified
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    console.log('✅ Production-like user created successfully:');
    console.log('- Username: dewani');
    console.log('- Email: dewani@example.com');
    console.log('- Password: dewani123');
    console.log('- Level: umkm (3)');
    console.log('- Verified: Yes');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();

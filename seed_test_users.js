/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedTestUsers() {
  console.log('🔑 Creating test users for API testing...');
  
  try {
    // Check if levels exist
    const levels = await prisma.levels.findMany();
    console.log('Found levels:', levels.map(l => `${l.id}: ${l.name}`));
    
    // Create test users with proper password hashing
    const testUsers = [
      {
        name: 'Dewani',
        username: 'dewani',
        email: 'dewani@example.com',
        password: await bcrypt.hash('dewani123', 10),
        level_id: 3, // UMKM user
        gender: 'Perempuan',
        phone_number: '08123456789',
        business_name: 'Dewani Creative',
        business_status: 'SUDAH_LAMA',
        business_category_id: 1,
        verifiedAt: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Admin User',
        username: 'admin',
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        level_id: 2, // Admin
        gender: 'Laki_laki',
        phone_number: '08123456790',
        business_name: null,
        business_status: null,
        business_category_id: null,
        verifiedAt: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Super Admin',
        username: 'superadmin',
        email: 'superadmin@example.com',
        password: await bcrypt.hash('superadmin123', 10),
        level_id: 1, // SuperAdmin
        gender: 'Laki_laki',
        phone_number: '08123456791',
        business_name: null,
        business_status: null,
        business_category_id: null,
        verifiedAt: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
    
    // Insert or update users
    for (const user of testUsers) {
      try {
        const existingUser = await prisma.users.findFirst({
          where: { username: user.username }
        });
        
        if (existingUser) {
          // Update existing user
          await prisma.users.update({
            where: { id: existingUser.id },
            data: {
              name: user.name,
              email: user.email,
              password: user.password,
              level_id: user.level_id,
              gender: user.gender,
              phone_number: user.phone_number,
              business_name: user.business_name,
              business_status: user.business_status,
              business_category_id: user.business_category_id,
              verifiedAt: user.verifiedAt,
              updated_at: new Date()
            }
          });
          console.log(`✅ Updated user: ${user.username}`);
        } else {
          // Create new user
          await prisma.users.create({
            data: user
          });
          console.log(`✅ Created user: ${user.username}`);
        }
      } catch (error) {
        console.error(`❌ Error processing user ${user.username}:`, error.message);
      }
    }
    
    // Verify all users
    console.log('\n📋 Verifying test users...');
    const allUsers = await prisma.users.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        level_id: true,
        verifiedAt: true,
        levels: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        level_id: 'asc'
      }
    });
    
    allUsers.forEach(user => {
      console.log(`- ${user.username} (Level: ${user.levels.name}, Verified: ${user.verifiedAt ? 'Yes' : 'No'})`);
    });
    
    console.log('\n🎉 Test users ready for API testing!');
    
  } catch (error) {
    console.error('❌ Error creating test users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedTestUsers();

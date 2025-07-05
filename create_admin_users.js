const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    // Hash password for admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Create admin user
    await prisma.users.create({
      data: {
        name: 'Admin User',
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        level_id: 2, // admin level
        verifiedAt: new Date(), // Mark as verified
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    console.log('✅ Admin user created successfully:');
    console.log('- Username: admin');
    console.log('- Email: admin@example.com');
    console.log('- Password: admin123');
    console.log('- Level: admin (2)');
    console.log('- Verified: Yes');
    
    // Also create a superadmin user for complete testing
    const hashedPasswordSuperAdmin = await bcrypt.hash('superadmin123', 12);
    
    await prisma.users.create({
      data: {
        name: 'Super Admin',
        username: 'superadmin',
        email: 'superadmin@example.com',
        password: hashedPasswordSuperAdmin,
        level_id: 1, // superadmin level
        verifiedAt: new Date(), // Mark as verified
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    console.log('✅ Super Admin user created successfully:');
    console.log('- Username: superadmin');
    console.log('- Email: superadmin@example.com');
    console.log('- Password: superadmin123');
    console.log('- Level: superadmin (1)');
    console.log('- Verified: Yes');
    
  } catch (error) {
    console.error('❌ Error creating admin users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();

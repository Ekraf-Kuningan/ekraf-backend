/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Checking users in database...');
    
    const users = await prisma.users.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        level_id: true,
        verifiedAt: true,
        created_at: true,
        levels: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Level: ${user.levels.name}, Verified: ${user.verifiedAt ? 'Yes' : 'No'}`);
    });

    // Check if user from production data exists
    const prodUser = await prisma.users.findFirst({
      where: {
        username: 'dewani'
      }
    });

    if (prodUser) {
      console.log('\nProduction user "dewani" found:');
      console.log('- ID:', prodUser.id);
      console.log('- Username:', prodUser.username);
      console.log('- Email:', prodUser.email);
      console.log('- Level ID:', prodUser.level_id);
      console.log('- Verified:', prodUser.verifiedAt ? 'Yes' : 'No');
    } else {
      console.log('\nProduction user "dewani" not found');
    }

    // Check test user
    const testUser = await prisma.users.findFirst({
      where: {
        username: 'testuser'
      }
    });

    if (testUser) {
      console.log('\nTest user "testuser" found:');
      console.log('- ID:', testUser.id);
      console.log('- Username:', testUser.username);
      console.log('- Email:', testUser.email);
      console.log('- Level ID:', testUser.level_id);
      console.log('- Verified:', testUser.verifiedAt ? 'Yes' : 'No');
    } else {
      console.log('\nTest user "testuser" not found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();

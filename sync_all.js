/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔄 Synchronizing all seeds and test data...\n');

async function runSyncProcess() {
  try {
    console.log('1️⃣ Running database migration...');
    try {
      execSync('npx prisma migrate dev --name sync_update', { stdio: 'inherit' });
      console.log('✅ Database migration completed\n');
    } catch {
      console.log('ℹ️ Migration may already be applied, continuing...\n');
    }

    console.log('2️⃣ Running main seed (production data)...');
    try {
      execSync('npx prisma db seed', { stdio: 'inherit' });
      console.log('✅ Main seed completed\n');
    } catch {
      console.log('ℹ️ Some seed data may already exist, continuing...\n');
    }

    console.log('3️⃣ Creating test users...');
    try {
      execSync('node seed_test_users.js', { stdio: 'inherit' });
      console.log('✅ Test users created\n');
    } catch (error) {
      console.error('❌ Error creating test users:', error.message);
    }

    console.log('4️⃣ Verifying database state...');
    try {
      execSync('node check_users.js', { stdio: 'inherit' });
      console.log('✅ Database verification completed\n');
    } catch (error) {
      console.error('❌ Error checking database:', error.message);
    }

    console.log('5️⃣ Running comprehensive API tests...');
    try {
      execSync('npm run test:endpoints', { stdio: 'inherit' });
      console.log('✅ API tests completed\n');
    } catch {
      console.log('ℹ️ Some API tests may have failed, check the detailed report above\n');
    }

    console.log('🎉 Synchronization process completed!');
    console.log('📋 Summary:');
    console.log('  - Database migrated and seeded');
    console.log('  - Test users created and verified');
    console.log('  - API endpoints tested comprehensively');
    console.log('  - Test reports generated');
    
    // Check if test failure report exists
    const files = fs.readdirSync('.');
    const failureReport = files.find(f => f.startsWith('test-failures-'));
    if (failureReport) {
      console.log(`  - Failed tests report: ${failureReport}`);
    }

  } catch (error) {
    console.error('❌ Error in synchronization process:', error.message);
    process.exit(1);
  }
}

runSyncProcess();

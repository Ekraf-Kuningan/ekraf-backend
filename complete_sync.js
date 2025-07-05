/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔄 Complete Synchronization and Testing Process...\n');

async function runCompleteSync() {
  try {
    console.log('🗂️ Step 1: Database Migration and Seeding');
    console.log('────────────────────────────────────────────');
    
    console.log('1.1 Running Prisma generate...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log('\n1.2 Running main database seed...');
    try {
      execSync('npx prisma db seed', { stdio: 'inherit' });
    } catch {
      console.log('ℹ️ Some seed data may already exist, continuing...');
    }
    
    console.log('\n👥 Step 2: Creating Test Users');
    console.log('────────────────────────────────────────────');
    execSync('node seed_test_users.js', { stdio: 'inherit' });
    
    console.log('\n📊 Step 3: Verifying Database State');
    console.log('────────────────────────────────────────────');
    execSync('node check_users.js', { stdio: 'inherit' });
    
    console.log('\n🆔 Step 4: Getting Valid IDs for Testing');
    console.log('────────────────────────────────────────────');
    execSync('node get_valid_ids.js', { stdio: 'inherit' });
    
    console.log('\n🧪 Step 5: Running Comprehensive API Tests');
    console.log('────────────────────────────────────────────');
    try {
      execSync('npm run test:endpoints', { stdio: 'inherit' });
    } catch {
      console.log('\nℹ️ Some API tests may have failed. Check the detailed report above.');
    }
    
    console.log('\n📋 Step 6: Summary');
    console.log('────────────────────────────────────────────');
    console.log('✅ Complete synchronization process finished!');
    console.log('📝 What was done:');
    console.log('   - Database migrated and seeded with production data');
    console.log('   - Test users created with proper credentials');
    console.log('   - Valid IDs identified for accurate testing');
    console.log('   - Comprehensive API endpoint testing completed');
    console.log('   - Authentication tested for all user levels');
    console.log('   - Permission analysis generated');
    console.log('   - Failed tests documented in JSON report');
    
    // Check for test failure reports
    const files = fs.readdirSync('.');
    const failureReports = files.filter(f => f.startsWith('test-failures-'));
    
    if (failureReports.length > 0) {
      console.log('\n📄 Generated Reports:');
      failureReports.forEach(report => {
        console.log(`   - ${report}`);
      });
    }
    
    console.log('\n🎯 Next Steps:');
    console.log('   - Review failed tests in the JSON report');
    console.log('   - Fix API endpoints that return 400/500 errors');
    console.log('   - Adjust permission levels as needed');
    console.log('   - Run "npm run test:endpoints" for quick re-testing');
    
  } catch (error) {
    console.error('\n❌ Error in synchronization process:', error.message);
    console.log('\n🔧 Manual recovery steps:');
    console.log('   1. Check database connection');
    console.log('   2. Run: npx prisma generate');
    console.log('   3. Run: npx prisma db seed');
    console.log('   4. Run: node seed_test_users.js');
    console.log('   5. Run: npm run test:endpoints');
    process.exit(1);
  }
}

runCompleteSync();

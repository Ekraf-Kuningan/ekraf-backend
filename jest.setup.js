import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

beforeAll(() => {
  console.log('Setting up test database...');
  try {
    const output = execSync('npm run test:setup:db', { encoding: 'utf8' });
    console.log('Database setup output:', output);
    console.log('Test database setup complete.');
  } catch (error) {
    console.error('Database setup failed:', error.message);
    if (error.stdout) console.log('STDOUT:', error.stdout);
    if (error.stderr) console.log('STDERR:', error.stderr);
    throw error;
  }
});

afterAll(async () => {
  const prisma = new PrismaClient();
  try {
    const result = await prisma.$queryRawUnsafe(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'ekraf_test';`);
    const tables = result.map(r => r.table_name).filter(name => name !== '_prisma_migrations');

    if (tables.length > 0) {
      await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');
      await prisma.$executeRawUnsafe(`DROP TABLES ${tables.join(', ')}`);
      await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
    }
  } finally {
    await prisma.$disconnect();
  }
});

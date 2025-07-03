import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

beforeAll(() => {
  console.log('Setting up test database...');
  execSync('npm run test:setup:db');
  console.log('Test database setup complete.');
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

import { PrismaClient } from './app/generated/prisma';
import { execSync } from 'child_process';

beforeAll(() => {
  execSync('npx prisma migrate deploy --schema=./prisma/schema.prisma', { env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL } });
});

afterAll(async () => {
  const prisma = new PrismaClient();
  await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS sub_sectors');
  await prisma.$disconnect();
});

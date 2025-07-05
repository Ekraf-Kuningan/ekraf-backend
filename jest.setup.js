jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: {
    users: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    products: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    business_categories: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    sub_sectors: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    levels: {
      findMany: jest.fn(),
    },
    online_store_links: {
      create: jest.fn(),
      delete: jest.fn(),
    },
    $disconnect: jest.fn().mockResolvedValue(undefined),
  },
}));
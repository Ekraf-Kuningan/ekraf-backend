import { GET } from '@/app/api/kategori-usaha/route';
import prisma from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    business_categories: {
      findMany: jest.fn(),
    },
  },
}));

describe('GET /api/kategori-usaha', () => {
  it('should return a list of business categories', async () => {
    prisma.business_categories.findMany.mockResolvedValue([
      { id: 1, name: 'Test Category' },
    ]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
  });
});

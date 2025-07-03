import { GET } from '../app/api/master-data/business-categories/route';
import prisma from '../lib/prisma';
import { NextResponse } from 'next/server';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    business_categories: {
      findMany: jest.fn(),
    },
  },
}));

describe('GET /api/master-data/business-categories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a list of business categories', async () => {
    (prisma.business_categories.findMany as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Category 1' },
      { id: 2, name: 'Category 2' },
    ]);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Business categories fetched successfully');
    expect(json.data).toHaveLength(2);
  });

  it('should return 500 if fetching business categories fails', async () => {
    (prisma.business_categories.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Failed to fetch business categories');
  });
});

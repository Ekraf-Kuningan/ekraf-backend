import { GET } from '../app/api/master-data/levels/route';
import prisma from '../lib/prisma';
import { NextResponse } from 'next/server';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    levels: {
      findMany: jest.fn(),
    },
  },
}));

describe('GET /api/master-data/levels', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a list of user levels', async () => {
    (prisma.levels.findMany as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Admin' },
      { id: 2, name: 'User' },
    ]);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('User levels fetched successfully');
    expect(json.data).toHaveLength(2);
  });

  it('should return 500 if fetching user levels fails', async () => {
    (prisma.levels.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Failed to fetch user levels');
  });
});

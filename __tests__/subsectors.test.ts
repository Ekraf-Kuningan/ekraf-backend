import { GET } from '../app/api/master-data/subsectors/route';
import prisma from '../lib/prisma';

jest.mock('../lib/prisma', () => ({
  sub_sectors: {
    findMany: jest.fn(),
  },
}));

describe('GET /api/master-data/subsectors', () => {
  it('should return a list of subsectors', async () => {
    const mockSubsectors = [
      { id: BigInt(1), title: 'Kuliner', slug: 'kuliner', created_at: new Date(), updated_at: new Date() },
      { id: BigInt(2), title: 'Fashion', slug: 'fashion', created_at: new Date(), updated_at: new Date() },
    ];

    (prisma.sub_sectors.findMany as jest.Mock).mockResolvedValue(mockSubsectors);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Subsectors fetched successfully');
    expect(json.data).toEqual(JSON.parse(JSON.stringify(mockSubsectors.map(s => ({...s, id: s.id.toString()})))));
  });

  it('should return a 500 error if fetching fails', async () => {
    (prisma.sub_sectors.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Failed to fetch subsectors');
  });
});

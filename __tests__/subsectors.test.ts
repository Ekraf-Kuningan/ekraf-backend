import { GET } from '../app/api/master-data/subsectors/route';
import prisma from '../lib/prisma';

describe('GET /api/master-data/subsectors', () => {
  beforeEach(async () => {
    await prisma.sub_sectors.createMany({
      data: [
        { title: 'Kuliner', slug: 'kuliner' },
        { title: 'Fashion', slug: 'fashion' },
      ],
    });
  });

  afterEach(async () => {
    await prisma.sub_sectors.deleteMany();
  });

  it('should return a list of subsectors', async () => {
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Subsectors fetched successfully');
    expect(json.data.length).toBe(2);
  });

  it('should return a 500 error if fetching fails', async () => {
    jest.spyOn(prisma.sub_sectors, 'findMany').mockRejectedValue(new Error('Database error'));

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Failed to fetch subsectors');
  });
});

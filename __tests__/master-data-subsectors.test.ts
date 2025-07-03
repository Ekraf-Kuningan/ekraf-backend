import { GET } from '../app/api/master-data/subsectors/route';
import prisma from '../lib/prisma';

// Mock the dependencies
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    sub_sectors: {
      findMany: jest.fn(),
    },
  },
}));

// Mock console.error to avoid noise in test output
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('GET /api/master-data/subsectors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSubsectors = [
    { id: 1, title: 'Agribisnis', slug: 'agribisnis' },
    { id: 2, title: 'Kerajinan', slug: 'kerajinan' },
    { id: 3, title: 'Kuliner', slug: 'kuliner' },
  ];

  it('should successfully fetch subsectors', async () => {
    (prisma.sub_sectors.findMany as jest.Mock).mockResolvedValue(mockSubsectors);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Subsectors fetched successfully');
    expect(json.data).toEqual([
      { id: 1, title: 'Agribisnis', slug: 'agribisnis' },
      { id: 2, title: 'Kerajinan', slug: 'kerajinan' },
      { id: 3, title: 'Kuliner', slug: 'kuliner' },
    ]);

    expect(prisma.sub_sectors.findMany).toHaveBeenCalledWith({
      orderBy: {
        title: 'asc',
      },
    });
  });

  it('should return empty array when no subsectors exist', async () => {
    (prisma.sub_sectors.findMany as jest.Mock).mockResolvedValue([]);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Subsectors fetched successfully');
    expect(json.data).toEqual([]);
  });

  it('should convert id to string in response', async () => {
    const numericIdSubsectors = [
      { id: 123, title: 'Test Subsector', slug: 'test-subsector' },
      { id: 456, title: 'Another Subsector', slug: 'another-subsector' },
    ];

    (prisma.sub_sectors.findMany as jest.Mock).mockResolvedValue(numericIdSubsectors);

    const response = await GET();
    const json = await response.json();

    expect(json.data).toEqual([
      { id: 123, title: 'Test Subsector', slug: 'test-subsector' },
      { id: 456, title: 'Another Subsector', slug: 'another-subsector' },
    ]);
  });

  it('should order subsectors by title in ascending order', async () => {
    // Return unordered data to verify ordering is done by database query
    const unorderedSubsectors = [
      { id: 3, title: 'Kuliner', slug: 'kuliner' },
      { id: 1, title: 'Agribisnis', slug: 'agribisnis' },
      { id: 2, title: 'Kerajinan', slug: 'kerajinan' },
    ];

    (prisma.sub_sectors.findMany as jest.Mock).mockResolvedValue(unorderedSubsectors);

    await GET();

    expect(prisma.sub_sectors.findMany).toHaveBeenCalledWith({
      orderBy: {
        title: 'asc',
      },
    });
  });

  it('should return 500 when database operation fails', async () => {
    const dbError = new Error('Database connection failed');
    (prisma.sub_sectors.findMany as jest.Mock).mockRejectedValue(dbError);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Failed to fetch subsectors');
    expect(json.error).toBe('Database connection failed');
    expect(console.error).toHaveBeenCalledWith('Error fetching subsectors:', dbError);
  });

  it('should handle unknown error types', async () => {
    const unknownError = 'Unknown error string';
    (prisma.sub_sectors.findMany as jest.Mock).mockRejectedValue(unknownError);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Failed to fetch subsectors');
    expect(json.error).toBe('Unknown error');
  });

  it('should handle subsectors with special characters in title', async () => {
    const specialCharSubsectors = [
      { id: 1, title: 'Fashion & Lifestyle', slug: 'fashion-lifestyle' },
      { id: 2, title: 'IT & Digital', slug: 'it-digital' },
      { id: 3, title: 'F&B (Food & Beverage)', slug: 'fb-food-beverage' },
    ];

    (prisma.sub_sectors.findMany as jest.Mock).mockResolvedValue(specialCharSubsectors);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toEqual([
      { id: 1, title: 'Fashion & Lifestyle', slug: 'fashion-lifestyle' },
      { id: 2, title: 'IT & Digital', slug: 'it-digital' },
      { id: 3, title: 'F&B (Food & Beverage)', slug: 'fb-food-beverage' },
    ]);
  });

  it('should handle large number of subsectors', async () => {
    const largeSubsectorList = Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      title: `Subsector ${i + 1}`,
      slug: `subsector-${i + 1}`,
    }));

    (prisma.sub_sectors.findMany as jest.Mock).mockResolvedValue(largeSubsectorList);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toHaveLength(1000);
    expect(json.data[0]).toEqual({
      id: 1,
      title: 'Subsector 1',
      slug: 'subsector-1',
    });
    expect(json.data[999]).toEqual({
      id: 1000,
      title: 'Subsector 1000',
      slug: 'subsector-1000',
    });
  });

  it('should preserve all subsector properties', async () => {
    const subsectorWithExtraProps = [
      {
        id: 1,
        title: 'Test Subsector',
        slug: 'test-subsector',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      },
    ];

    (prisma.sub_sectors.findMany as jest.Mock).mockResolvedValue(subsectorWithExtraProps);

    const response = await GET();
    const json = await response.json();

    expect(json.data[0]).toEqual({
      id: 1,
      title: 'Test Subsector',
      slug: 'test-subsector',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    });
  });
});

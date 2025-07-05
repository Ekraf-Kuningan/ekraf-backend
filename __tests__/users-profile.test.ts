import { GET } from '../app/api/users/profile/route';
import prisma from '../lib/prisma';
import { authorizeRequest } from '../lib/auth/authorizeRequest';
import { NextRequest } from 'next/server';

// Mock the dependencies
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    users: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../lib/auth/authorizeRequest', () => ({
  authorizeRequest: jest.fn(),
}));

describe('GET /api/users/profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    id: 1,
    level_id: 3,
  };

  const mockUserProfile = {
    id: 1,
    name: 'John Doe',
    username: 'johndoe',
    email: 'john@example.com',
    phone_number: '08123456789',
    gender: 'Laki_laki',
    business_name: 'Toko John',
    business_status: 'BARU',
    verifiedAt: new Date('2024-01-01T12:00:00.000Z'),
    levels: {
      id: 3,
      name: 'umkm',
    },
    business_categories: {
      id: 1,
      name: 'Kuliner',
    },
  };

  const expectedUserProfile = {
    id: 1,
    name: 'John Doe',
    username: 'johndoe',
    email: 'john@example.com',
    phone_number: '08123456789',
    gender: 'Laki_laki',
    business_name: 'Toko John',
    business_status: 'BARU',
    verifiedAt: '2024-01-01T12:00:00.000Z',
    levels: {
      id: 3,
      name: 'umkm',
    },
    business_categories: {
      id: 1,
      name: 'Kuliner',
    },
  };

  const createMockRequest = () => {
    return {
      headers: {
        get: jest.fn().mockReturnValue('Bearer valid_token'),
      },
    } as unknown as NextRequest;
  };

  it('should successfully fetch user profile when authenticated', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([mockUser, null]);
    (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUserProfile);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Profile fetched successfully');
    expect(json.data).toEqual(expectedUserProfile);

    expect(authorizeRequest).toHaveBeenCalledWith(request, [1, 2, 3]);
    expect(prisma.users.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone_number: true,
        gender: true,
        business_name: true,
        business_status: true,
        verifiedAt: true,
        levels: {
          select: {
            id: true,
            name: true
          }
        },
        business_categories: {
          select: {
            id: true,
            name: true,
            image: true,
            description: true,
            sub_sectors: {
              select: {
                id: true,
                title: true,
                slug: true
              }
            }
          }
        }
      },
    });
  });

  it('should return 401 when not authenticated', async () => {
    const errorResponse = {
      json: jest.fn().mockResolvedValue({ message: 'Unauthorized' }),
      status: 401,
    };
    (authorizeRequest as jest.Mock).mockResolvedValue([null, errorResponse]);

    const request = createMockRequest();
    const response = await GET(request);

    expect(response).toBe(errorResponse);
  });

  it('should return 404 when user profile not found', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([mockUser, null]);
    (prisma.users.findUnique as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.message).toBe('Profile not found');
  });

  it('should return 500 when database operation fails', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([mockUser, null]);
    const dbError = new Error('Database connection failed');
    (prisma.users.findUnique as jest.Mock).mockRejectedValue(dbError);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Failed to fetch profile');
    expect(json.error).toEqual({});
  });

  it('should work for superadmin level', async () => {
    const superadminUser = { id: 1, level_id: 1 };
    (authorizeRequest as jest.Mock).mockResolvedValue([superadminUser, null]);
    (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUserProfile);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Profile fetched successfully');
  });

  it('should work for admin level', async () => {
    const adminUser = { id: 1, level_id: 2 };
    (authorizeRequest as jest.Mock).mockResolvedValue([adminUser, null]);
    (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUserProfile);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Profile fetched successfully');
  });

  it('should handle user with null business information', async () => {
    const profileWithNullBusiness = {
      ...mockUserProfile,
      business_name: null,
      business_status: null,
      business_categories: null,
    };

    (authorizeRequest as jest.Mock).mockResolvedValue([mockUser, null]);
    (prisma.users.findUnique as jest.Mock).mockResolvedValue(profileWithNullBusiness);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.business_name).toBeNull();
    expect(json.data.business_status).toBeNull();
    expect(json.data.business_categories).toBeNull();
  });

  it('should handle user with null verifiedAt', async () => {
    const profileWithNullVerified = {
      ...mockUserProfile,
      verifiedAt: null,
    };

    (authorizeRequest as jest.Mock).mockResolvedValue([mockUser, null]);
    (prisma.users.findUnique as jest.Mock).mockResolvedValue(profileWithNullVerified);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.verifiedAt).toBeNull();
  });

  it('should only select specified fields', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([mockUser, null]);
    (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUserProfile);

    const request = createMockRequest();
    await GET(request);

    expect(prisma.users.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone_number: true,
        gender: true,
        business_name: true,
        business_status: true,
        verifiedAt: true,
        levels: {
          select: {
            id: true,
            name: true
          }
        },
        business_categories: {
          select: {
            id: true,
            name: true,
            image: true,
            description: true,
            sub_sectors: {
              select: {
                id: true,
                title: true,
                slug: true
              }
            }
          }
        }
      },
    });
  });

  it('should handle different user IDs correctly', async () => {
    const userWithDifferentId = { id: 999, level_id: 3 };
    (authorizeRequest as jest.Mock).mockResolvedValue([userWithDifferentId, null]);
    (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUserProfile);

    const request = createMockRequest();
    await GET(request);

    expect(prisma.users.findUnique).toHaveBeenCalledWith({
      where: { id: 999 },
      select: expect.any(Object),
    });
  });
});

import { GET } from '../app/api/users/route';
import prisma from '../lib/prisma';
import { authorizeRequest } from '../lib/auth/authorizeRequest';
import { NextRequest } from 'next/server';

// Mock the dependencies
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    users: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../lib/auth/authorizeRequest', () => ({
  authorizeRequest: jest.fn(),
}));

describe('GET /api/users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUsers = [
    {
      id: 1,
      name: 'John Doe',
      username: 'johndoe',
      email: 'john@example.com',
      phone_number: '08123456789',
      gender: 'Laki_laki',
      business_name: 'Toko John',
      verifiedAt: new Date('2024-01-01T12:00:00.000Z'),
      levels: {
        name: 'admin',
      },
    },
    {
      id: 2,
      name: 'Jane Smith',
      username: 'janesmith',
      email: 'jane@example.com',
      phone_number: '08987654321',
      gender: 'Perempuan',
      business_name: 'Warung Jane',
      verifiedAt: new Date('2024-01-02T12:00:00.000Z'),
      levels: {
        name: 'umkm',
      },
    },
  ];

  const expectedUsers = [
    {
      id: 1,
      name: 'John Doe',
      username: 'johndoe',
      email: 'john@example.com',
      phone_number: '08123456789',
      gender: 'Laki_laki',
      business_name: 'Toko John',
      verifiedAt: '2024-01-01T12:00:00.000Z',
      levels: {
        name: 'admin',
      },
    },
    {
      id: 2,
      name: 'Jane Smith',
      username: 'janesmith',
      email: 'jane@example.com',
      phone_number: '08987654321',
      gender: 'Perempuan',
      business_name: 'Warung Jane',
      verifiedAt: '2024-01-02T12:00:00.000Z',
      levels: {
        name: 'umkm',
      },
    },
  ];

  const createMockRequest = () => {
    return {
      headers: {
        get: jest.fn().mockReturnValue('Bearer valid_token'),
      },
    } as unknown as NextRequest;
  };

  it('should successfully fetch users when authorized as level 1', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([null, null]);
    (prisma.users.findMany as jest.Mock).mockResolvedValue(mockUsers);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Users fetched successfully');
    expect(json.data).toEqual(expectedUsers);

    expect(authorizeRequest).toHaveBeenCalledWith(request, [1, 2]);
    expect(prisma.users.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone_number: true,
        gender: true,
        business_name: true,
        verifiedAt: true,
        levels: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  });

  it('should successfully fetch users when authorized as level 2', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([null, null]);
    (prisma.users.findMany as jest.Mock).mockResolvedValue(mockUsers);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Users fetched successfully');
    expect(json.data).toEqual(expectedUsers);
  });

  it('should return empty array when no users exist', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([null, null]);
    (prisma.users.findMany as jest.Mock).mockResolvedValue([]);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Users fetched successfully');
    expect(json.data).toEqual([]);
  });

  it('should return 401 when not authorized', async () => {
    const errorResponse = {
      json: jest.fn().mockResolvedValue({ message: 'Akses ditolak.' }),
      status: 401,
    };
    (authorizeRequest as jest.Mock).mockResolvedValue([null, errorResponse]);

    const request = createMockRequest();
    const response = await GET(request);

    expect(response).toBe(errorResponse);
  });

  it('should return 401 when user level is not 1 or 2', async () => {
    const errorResponse = {
      json: jest.fn().mockResolvedValue({ message: 'Akses ditolak.' }),
      status: 401,
    };
    (authorizeRequest as jest.Mock).mockResolvedValue([null, errorResponse]);

    const request = createMockRequest();
    const response = await GET(request);

    expect(response).toBe(errorResponse);
  });

  it('should return 500 when database operation fails', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([null, null]);
    const dbError = new Error('Database connection failed');
    (prisma.users.findMany as jest.Mock).mockRejectedValue(dbError);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Failed to fetch users');
    expect(json.error).toEqual({});
  });

  it('should order users by name in ascending order', async () => {
    const unorderedUsers = [
      { ...mockUsers[1] }, // Jane Smith
      { ...mockUsers[0] }, // John Doe
    ];
    
    (authorizeRequest as jest.Mock).mockResolvedValue([null, null]);
    (prisma.users.findMany as jest.Mock).mockResolvedValue(unorderedUsers);

    const request = createMockRequest();
    await GET(request);

    expect(prisma.users.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: {
          name: 'asc',
        },
      })
    );
  });

  it('should only select specific user fields', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([null, null]);
    (prisma.users.findMany as jest.Mock).mockResolvedValue(mockUsers);

    const request = createMockRequest();
    await GET(request);

    expect(prisma.users.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          phone_number: true,
          gender: true,
          business_name: true,
          verifiedAt: true,
          levels: {
            select: {
              name: true,
            },
          },
        },
      })
    );
  });

  it('should handle users with null business_name', async () => {
    const usersWithNullBusiness = [
      {
        ...mockUsers[0],
        business_name: null,
      },
    ];

    (authorizeRequest as jest.Mock).mockResolvedValue([null, null]);
    (prisma.users.findMany as jest.Mock).mockResolvedValue(usersWithNullBusiness);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data[0].business_name).toBeNull();
  });

  it('should handle users with null verifiedAt', async () => {
    const usersWithNullVerified = [
      {
        ...mockUsers[0],
        verifiedAt: null,
      },
    ];

    (authorizeRequest as jest.Mock).mockResolvedValue([null, null]);
    (prisma.users.findMany as jest.Mock).mockResolvedValue(usersWithNullVerified);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data[0].verifiedAt).toBeNull();
  });
});

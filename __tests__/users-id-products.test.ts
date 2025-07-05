import { GET } from '../app/api/users/[id]/products/route';
import prisma from '../lib/prisma';
import { authorizeRequest } from '../lib/auth/authorizeRequest';
import { NextRequest } from 'next/server';

// Mock the dependencies
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    products: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../lib/auth/authorizeRequest', () => ({
  authorizeRequest: jest.fn(),
}));

describe('GET /api/users/[id]/products', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUmkmUser = {
    id: 1,
    level_id: 3,
  };

  const mockAdminUser = {
    id: 2,
    level_id: 2,
  };

  const mockSuperadminUser = {
    id: 3,
    level_id: 1,
  };

  const mockProducts = [
    {
      id: 1,
      name: 'Product 1',
      description: 'Description of product 1',
      user_id: 1,
      uploaded_at: new Date('2024-01-02T12:00:00.000Z'),
    },
    {
      id: 2,
      name: 'Product 2',
      description: 'Description of product 2',
      user_id: 1,
      uploaded_at: new Date('2024-01-01T12:00:00.000Z'),
    },
  ];

  const expectedProducts = [
    {
      id: 1,
      name: 'Product 1',
      description: 'Description of product 1',
      user_id: 1,
      uploaded_at: '2024-01-02T12:00:00.000Z',
    },
    {
      id: 2,
      name: 'Product 2',
      description: 'Description of product 2',
      user_id: 1,
      uploaded_at: '2024-01-01T12:00:00.000Z',
    },
  ];

  const createMockRequest = () => {
    return {
      headers: {
        get: jest.fn().mockReturnValue('Bearer valid_token'),
      },
    } as unknown as NextRequest;
  };

  const createMockParams = (id: number) => {
    return Promise.resolve({ id });
  };

  it('should successfully fetch user products when user accesses their own products', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([mockUmkmUser, null]);
    (prisma.products.findMany as jest.Mock).mockResolvedValue(mockProducts);

    const request = createMockRequest();
    const params = createMockParams(1);

    const response = await GET(request, { params });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Products for user 1 fetched successfully');
    expect(json.data).toEqual(expectedProducts);

    expect(authorizeRequest).toHaveBeenCalledWith(request, [1, 2, 3]);
    expect(prisma.products.findMany).toHaveBeenCalledWith({
      where: { user_id: 1 },
      include: {
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
        },
        sub_sectors: {
          select: {
            id: true,
            title: true,
            slug: true,
            image: true,
            description: true
          }
        },
        online_store_links: true
      },
      orderBy: {
        uploaded_at: 'desc',
      },
    });
  });

  it('should allow admin to access any user products', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([mockAdminUser, null]);
    (prisma.products.findMany as jest.Mock).mockResolvedValue(mockProducts);

    const request = createMockRequest();
    const params = createMockParams(1); // Admin accessing user 1's products

    const response = await GET(request, { params });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Products for user 1 fetched successfully');
    expect(json.data).toEqual(expectedProducts);
  });

  it('should allow superadmin to access any user products', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([mockSuperadminUser, null]);
    (prisma.products.findMany as jest.Mock).mockResolvedValue(mockProducts);

    const request = createMockRequest();
    const params = createMockParams(1); // Superadmin accessing user 1's products

    const response = await GET(request, { params });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Products for user 1 fetched successfully');
    expect(json.data).toEqual(expectedProducts);
  });

  it('should return empty array when user has no products', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([mockUmkmUser, null]);
    (prisma.products.findMany as jest.Mock).mockResolvedValue([]);

    const request = createMockRequest();
    const params = createMockParams(1);

    const response = await GET(request, { params });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Products for user 1 fetched successfully');
    expect(json.data).toEqual([]);
  });

  it('should return 401 when not authenticated', async () => {
    const errorResponse = {
      json: jest.fn().mockResolvedValue({ message: 'Unauthorized' }),
      status: 401,
    };
    (authorizeRequest as jest.Mock).mockResolvedValue([null, errorResponse]);

    const request = createMockRequest();
    const params = createMockParams(1);

    const response = await GET(request, { params });

    expect(response).toBe(errorResponse);
  });

  it('should return 403 when umkm user tries to access another user products', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([mockUmkmUser, null]);

    const request = createMockRequest();
    const params = createMockParams(2); // User 1 trying to access user 2's products

    const response = await GET(request, { params });
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.message).toBe('Forbidden: You can only access your own products.');
  });

  it('should return 500 when database operation fails', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([mockUmkmUser, null]);
    const dbError = new Error('Database connection failed');
    (prisma.products.findMany as jest.Mock).mockRejectedValue(dbError);

    const request = createMockRequest();
    const params = createMockParams(1);

    const response = await GET(request, { params });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Failed to fetch products');
    expect(json.error).toEqual({});
  });

  it('should order products by uploaded_at descending', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([mockUmkmUser, null]);
    (prisma.products.findMany as jest.Mock).mockResolvedValue(mockProducts);

    const request = createMockRequest();
    const params = createMockParams(1);

    await GET(request, { params });

    expect(prisma.products.findMany).toHaveBeenCalledWith({
      where: { user_id: 1 },
      include: {
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
        },
        sub_sectors: {
          select: {
            id: true,
            title: true,
            slug: true,
            image: true,
            description: true
          }
        },
        online_store_links: true
      },
      orderBy: {
        uploaded_at: 'desc',
      },
    });
  });

  it('should handle string user ID by converting to number', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([mockUmkmUser, null]);
    (prisma.products.findMany as jest.Mock).mockResolvedValue(mockProducts);

    const request = createMockRequest();
    const params = Promise.resolve({ id: '1' as unknown as number }); // Simulate string ID

    const response = await GET(request, { params });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.products.findMany).toHaveBeenCalledWith({
      where: { user_id: 1 },
      include: {
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
        },
        sub_sectors: {
          select: {
            id: true,
            title: true,
            slug: true,
            image: true,
            description: true
          }
        },
        online_store_links: true
      },
      orderBy: {
        uploaded_at: 'desc',
      },
    });
  });

  it('should handle user with undefined level_id', async () => {
    const userWithUndefinedLevel = {
      id: 1,
      level_id: undefined,
    };
    (authorizeRequest as jest.Mock).mockResolvedValue([userWithUndefinedLevel, null]);

    const request = createMockRequest();
    const params = createMockParams(2); // Trying to access different user's products

    const response = await GET(request, { params });
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.message).toBe('Forbidden: You can only access your own products.');
  });

  it('should handle different admin accessing different user products', async () => {
    const adminUser = { id: 5, level_id: 2 }; // Admin with ID 5
    (authorizeRequest as jest.Mock).mockResolvedValue([adminUser, null]);
    (prisma.products.findMany as jest.Mock).mockResolvedValue(mockProducts);

    const request = createMockRequest();
    const params = createMockParams(1); // Admin accessing user 1's products

    const response = await GET(request, { params });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Products for user 1 fetched successfully');
    expect(prisma.products.findMany).toHaveBeenCalledWith({
      where: { user_id: 1 },
      include: {
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
        },
        sub_sectors: {
          select: {
            id: true,
            title: true,
            slug: true,
            image: true,
            description: true
          }
        },
        online_store_links: true
      },
      orderBy: {
        uploaded_at: 'desc',
      },
    });
  });

  it('should handle large number of products', async () => {
    const largeProductList = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: `Product ${i + 1}`,
      description: `Description ${i + 1}`,
      user_id: 1,
      uploaded_at: new Date(),
    }));

    (authorizeRequest as jest.Mock).mockResolvedValue([mockUmkmUser, null]);
    (prisma.products.findMany as jest.Mock).mockResolvedValue(largeProductList);

    const request = createMockRequest();
    const params = createMockParams(1);

    const response = await GET(request, { params });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toHaveLength(50);
  });

  it('should validate authorization levels correctly', async () => {
    // Test level 1 (superadmin)
    (authorizeRequest as jest.Mock).mockResolvedValue([{ id: 99, level_id: 1 }, null]);
    (prisma.products.findMany as jest.Mock).mockResolvedValue([]);

    let request = createMockRequest();
    let params = createMockParams(1);
    let response = await GET(request, { params });
    expect(response.status).toBe(200);

    // Test level 2 (admin)
    (authorizeRequest as jest.Mock).mockResolvedValue([{ id: 99, level_id: 2 }, null]);
    request = createMockRequest();
    params = createMockParams(1);
    response = await GET(request, { params });
    expect(response.status).toBe(200);

    // Test level 3 (umkm) accessing different user
    (authorizeRequest as jest.Mock).mockResolvedValue([{ id: 99, level_id: 3 }, null]);
    request = createMockRequest();
    params = createMockParams(1);
    response = await GET(request, { params });
    const json = await response.json();
    expect(response.status).toBe(403);
    expect(json.message).toBe('Forbidden: You can only access your own products.');
  });
});

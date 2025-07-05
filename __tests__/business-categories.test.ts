import { GET, POST } from '@/app/api/business-categories/route';
import prisma from '@/lib/prisma';
import { authorizeRequest } from '@/lib/auth/authorizeRequest';
import { NextRequest } from 'next/server';
import { Prisma } from '@/app/generated/prisma';

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    business_categories: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('@/app/generated/prisma', () => ({
  Prisma: {
    PrismaClientKnownRequestError: class extends Error {
      code: string;
      clientVersion: string;
      meta: Record<string, unknown>;
      constructor(message: string, options: { code: string; clientVersion: string; meta?: Record<string, unknown> }) {
        super(message);
        this.code = options.code;
        this.clientVersion = options.clientVersion;
        this.meta = options.meta || {};
      }
    },
  },
}));

jest.mock('@/lib/auth/authorizeRequest', () => ({
  authorizeRequest: jest.fn(),
}));

describe('GET /api/business-categories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a list of business categories with subsector relationships', async () => {
    const mockCategories = [
      {
        id: 1,
        name: 'Test Category',
        image: 'test.jpg',
        sub_sector_id: 1,
        description: 'Test description',
        sub_sectors: {
          id: 1,
          title: 'Test Subsector',
          slug: 'test-subsector'
        }
      }
    ];

    (prisma.business_categories.findMany as jest.Mock).mockResolvedValue(mockCategories);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Business categories retrieved successfully');
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data).toEqual(mockCategories);

    expect(prisma.business_categories.findMany).toHaveBeenCalledWith({
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
        image: true,
        sub_sector_id: true,
        description: true,
        sub_sectors: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      }
    });
  });

  it('should handle database errors gracefully', async () => {
    (prisma.business_categories.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe('Failed to retrieve business categories');
  });
});

describe('POST /api/business-categories', () => {
  const mockRequest = (body: Record<string, unknown>) => ({
    json: jest.fn().mockResolvedValue(body),
  }) as unknown as NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new business category successfully', async () => {
    const requestBody = {
      name: 'New Category',
      image: 'new-category.jpg',
      sub_sector_id: 1,
      description: 'New category description'
    };

    const mockCreatedCategory = {
      id: 1,
      ...requestBody
    };

    (authorizeRequest as jest.Mock).mockResolvedValue([{ id: 1 }, null]);
    (prisma.business_categories.create as jest.Mock).mockResolvedValue(mockCreatedCategory);

    const request = mockRequest(requestBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.message).toBe('Business category created successfully');
    expect(data.data).toEqual(mockCreatedCategory);

    expect(prisma.business_categories.create).toHaveBeenCalledWith({
      data: {
        name: requestBody.name,
        image: requestBody.image,
        sub_sector_id: requestBody.sub_sector_id,
        description: requestBody.description
      }
    });
  });

  it('should return 401 when not authorized', async () => {
    const requestBody = {
      name: 'New Category',
      sub_sector_id: 1
    };

    const mockErrorResponse = new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
    (authorizeRequest as jest.Mock).mockResolvedValue([null, mockErrorResponse]);

    const request = mockRequest(requestBody);
    const response = await POST(request);

    expect(response).toBe(mockErrorResponse);
  });

  it('should validate required fields', async () => {
    const requestBody = {
      name: 'AB', // Too short
      // Missing sub_sector_id
    };

    (authorizeRequest as jest.Mock).mockResolvedValue([{ id: 1 }, null]);

    const request = mockRequest(requestBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Invalid data');
    expect(data.errors).toBeDefined();
  });

  it('should handle duplicate name error', async () => {
    const requestBody = {
      name: 'Existing Category',
      sub_sector_id: 1
    };

    (authorizeRequest as jest.Mock).mockResolvedValue([{ id: 1 }, null]);
    
    const duplicateError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '2.x.x'
    });
    (prisma.business_categories.create as jest.Mock).mockRejectedValue(duplicateError);

    const request = mockRequest(requestBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.message).toBe('Business category name already exists.');
  });

  it('should handle other database errors', async () => {
    const requestBody = {
      name: 'New Category',
      sub_sector_id: 1
    };

    (authorizeRequest as jest.Mock).mockResolvedValue([{ id: 1 }, null]);
    (prisma.business_categories.create as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = mockRequest(requestBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe('Failed to create business category');
  });
});

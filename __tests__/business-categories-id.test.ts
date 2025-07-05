import { GET, PUT, DELETE } from '@/app/api/business-categories/[id]/route';
import prisma from '@/lib/prisma';
import { authorizeRequest } from '@/lib/auth/authorizeRequest';
import { NextRequest } from 'next/server';
import { Prisma } from '@/app/generated/prisma';
import { BusinessCategorySchema } from '@/lib/zod';

jest.mock('@/lib/zod', () => ({
  BusinessCategorySchema: {
    safeParse: jest.fn(),
  },
}));

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    business_categories: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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

describe('GET /api/business-categories/{id}', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a business category by ID with enhanced relationships', async () => {
    const mockCategory = {
      id: 1,
      name: 'Test Category',
      image: 'test.jpg',
      sub_sector_id: 1,
      description: 'Test description',
      sub_sectors: {
        id: 1,
        title: 'Test Subsector',
        slug: 'test-subsector',
        image: 'subsector.jpg',
        description: 'Subsector description'
      },
      _count: {
        products: 5,
        users: 3,
        temporary_users: 2
      }
    };

    (prisma.business_categories.findUnique as jest.Mock).mockResolvedValue(mockCategory);

    const request = new NextRequest('http://localhost/api/business-categories/1');
    const response = await GET(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Data retrieved successfully');
    expect(json.data.id).toBe(1);
    expect(json.data.sub_sectors).toBeDefined();
    expect(json.data._count).toBeDefined();
    expect(json.data._count.products).toBe(5);
    expect(json.data._count.users).toBe(3);
    expect(json.data._count.temporary_users).toBe(2);
    expect(prisma.business_categories.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        sub_sectors: {
          select: {
            id: true,
            title: true,
            slug: true,
            image: true,
            description: true
          }
        },
        _count: {
          select: {
            products: true,
            users: true,
            temporary_users: true
          }
        }
      }
    });
  });

  it('should return 400 for invalid ID format', async () => {
    const request = new NextRequest('http://localhost/api/business-categories/abc');
    const response = await GET(request, { params: Promise.resolve({ id: NaN }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Invalid ID format');
  });

  it('should return 404 if business category not found', async () => {
    (prisma.business_categories.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/business-categories/999');
    const response = await GET(request, { params: Promise.resolve({ id: 999 }) });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.message).toBe('Business category not found');
  });

  it('should return 500 if fetching business category fails', async () => {
    (prisma.business_categories.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/business-categories/1');
    const response = await GET(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Failed to retrieve data');
  });
});

describe('PUT /api/business-categories/{id}', () => {
  let mockCategoryData: { 
    name: string; 
    image: string; 
    sub_sector_id: number; 
    description: string; 
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockCategoryData = {
      name: 'Updated Category',
      image: 'updated-image.jpg',
      sub_sector_id: 2,
      description: 'Updated description'
    };
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (BusinessCategorySchema.safeParse as jest.Mock).mockImplementation((data) => {
      const errors: Record<string, string[]> = {};

      if (!data || !data.name) {
        errors.name = ["Category name must have at least 3 characters."];
      } else if (data.name.length < 3) {
        errors.name = ["Category name must have at least 3 characters."];
      } else if (data.name.length > 255) {
        errors.name = ["Category name must not exceed 255 characters."];
      }

      if (data.image && data.image.length > 255) {
        errors.image = ["Image URL must not exceed 255 characters."];
      }

      if (!data.sub_sector_id || data.sub_sector_id <= 0) {
        errors.sub_sector_id = ["Subsector must be selected."];
      }

      if (Object.keys(errors).length > 0) {
        return {
          success: false,
          error: { flatten: () => ({ fieldErrors: errors }) },
        };
      }
      return { success: true, data: mockCategoryData };
    });
  });

  it('should update a business category by ID', async () => {
    const mockUpdatedCategory = {
      id: 1,
      ...mockCategoryData,
      created_at: new Date(),
      updated_at: new Date()
    };

    (prisma.business_categories.update as jest.Mock).mockResolvedValue(mockUpdatedCategory);

    const request = new NextRequest('http://localhost/api/business-categories/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockCategoryData),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Business category updated successfully');
    expect(json.data.name).toBe('Updated Category');
    expect(prisma.business_categories.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        name: mockCategoryData.name,
        image: mockCategoryData.image,
        sub_sector_id: mockCategoryData.sub_sector_id,
        description: mockCategoryData.description
      }
    });
  });

  it('should return 400 for invalid ID format', async () => {
    const request = new NextRequest('http://localhost/api/business-categories/abc', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockCategoryData),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: NaN }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Invalid ID format');
  });

  it('should return 400 if validation fails', async () => {
    (BusinessCategorySchema.safeParse as jest.Mock).mockImplementation((data) => {
      if (!data || !data.name || data.name.length < 3) {
        return {
          success: false,
          error: { flatten: () => ({ fieldErrors: { name: ['Category name must have at least 3 characters.'] } }) },
        };
      }
      return { success: true, data: mockCategoryData };
    });

    const request = new NextRequest('http://localhost/api/business-categories/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'a' }),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Invalid data');
    expect(json.errors.name).toContain('Category name must have at least 3 characters.');
  });

  it('should return 404 if business category not found (P2025)', async () => {
    (prisma.business_categories.update as jest.Mock).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError(
        'Record to update not found.',
        {
          code: 'P2025',
          clientVersion: '2.x.x',
          meta: { cause: 'Record not found' },
        }
      )
    );

    const request = new NextRequest('http://localhost/api/business-categories/999', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockCategoryData),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 999 }) });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.message).toBe('Business category not found');
  });

  it('should return 409 if business category name already exists (P2002)', async () => {
    (prisma.business_categories.update as jest.Mock).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`name`)',
        {
          code: 'P2002',
          clientVersion: '2.x.x',
          meta: { target: ['name'] },
        }
      )
    );

    const request = new NextRequest('http://localhost/api/business-categories/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockCategoryData),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.message).toBe('Business category name already exists');
  });

  it('should return 500 if update fails due to server error', async () => {
    (prisma.business_categories.update as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/business-categories/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockCategoryData),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Failed to update business category');
  });

  it('should return authorization error if user is not authorized', async () => {
    const mockErrorResponse = new Response(
      JSON.stringify({ message: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );

    (authorizeRequest as jest.Mock).mockResolvedValue([false, mockErrorResponse]);

    const request = new NextRequest('http://localhost/api/business-categories/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockCategoryData),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 1 }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toBe('Unauthorized');
  });
});

describe('DELETE /api/business-categories/{id}', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
  });

  it('should delete a business category by ID', async () => {
    (prisma.business_categories.delete as jest.Mock).mockResolvedValue({ id: 1 });

    const request = new NextRequest('http://localhost/api/business-categories/1', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Business category deleted successfully');
    expect(prisma.business_categories.delete).toHaveBeenCalledWith({
      where: { id: 1 }
    });
  });

  it('should return 400 for invalid ID format', async () => {
    const request = new NextRequest('http://localhost/api/business-categories/abc', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: NaN }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Invalid ID format');
  });

  it('should return 404 if business category not found (P2025)', async () => {
    (prisma.business_categories.delete as jest.Mock).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError(
        'Record to delete does not exist.',
        {
          code: 'P2025',
          clientVersion: '2.x.x',
          meta: { cause: 'Record not found' },
        }
      )
    );

    const request = new NextRequest('http://localhost/api/business-categories/999', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 999 }) });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.message).toBe('Business category not found');
  });

  it('should return 500 if deletion fails due to server error', async () => {
    (prisma.business_categories.delete as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/business-categories/1', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Failed to delete business category');
  });

  it('should return authorization error if user is not authorized', async () => {
    const mockErrorResponse = new Response(
      JSON.stringify({ message: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );

    (authorizeRequest as jest.Mock).mockResolvedValue([false, mockErrorResponse]);

    const request = new NextRequest('http://localhost/api/business-categories/1', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 1 }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toBe('Unauthorized');
  });
});

import { GET, PUT, DELETE } from '../app/api/kategori-usaha/[id]/route';
import prisma from '../lib/prisma';
import { authorizeRequest } from '../lib/auth/authorizeRequest';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { KategoriUsahaSchema } from '../lib/zod';

jest.mock('../lib/zod', () => ({
  KategoriUsahaSchema: {
    safeParse: jest.fn(),
  },
}));

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    business_categories: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
  Prisma: {
    PrismaClientKnownRequestError: class extends Error {
      code: string;
      clientVersion: string;
      meta: unknown;
      constructor(message: string, options: { code: string; clientVersion: string; meta?: unknown }) {
        super(message);
        this.code = options.code;
        this.clientVersion = options.clientVersion;
        this.meta = options.meta;
      }
    },
  },
}));

jest.mock('../lib/auth/authorizeRequest', () => ({
  authorizeRequest: jest.fn(),
}));

describe('GET /api/kategori-usaha/{id}', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a business category by ID', async () => {
    (prisma.business_categories.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'Test Category',
      image: null,
    });

    const request = new NextRequest('http://localhost/api/kategori-usaha/1');
    const response = await GET(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Data berhasil diambil');
    expect(json.data.id).toBe(1);
  });

  it('should return 400 for invalid ID format', async () => {
    const request = new NextRequest('http://localhost/api/kategori-usaha/abc');
    const response = await GET(request, { params: Promise.resolve({ id: NaN }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Format ID tidak valid');
  });

  it('should return 404 if business category not found', async () => {
    (prisma.business_categories.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/kategori-usaha/999');
    const response = await GET(request, { params: Promise.resolve({ id: 999 }) });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.message).toBe('Kategori usaha tidak ditemukan');
  });

  it('should return 500 if fetching business category fails', async () => {
    (prisma.business_categories.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/kategori-usaha/1');
    const response = await GET(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Gagal mengambil data');
  });
});

describe('PUT /api/kategori-usaha/{id}', () => {
  let mockCategoryData: { name: string; image: string };
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockCategoryData = {
      name: 'Updated Category',
      image: 'updated-image.jpg',
    };
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (KategoriUsahaSchema.safeParse as jest.Mock).mockImplementation((data) => {
      const errors: Record<string, string[]> = {};

      if (!data || !data.name) {
        errors.name = ["Nama kategori harus memiliki minimal 3 karakter."];
      } else if (data.name.length < 3) {
        errors.name = ["Nama kategori harus memiliki minimal 3 karakter."];
      } else if (data.name.length > 255) {
        errors.name = ["Nama kategori tidak boleh lebih dari 255 karakter."];
      }

      if (data.image && data.image.length > 255) {
        errors.image = ["Image URL tidak boleh lebih dari 255 karakter."];
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
    (prisma.business_categories.update as jest.Mock).mockResolvedValue({
      id: 1,
      ...mockCategoryData,
    });

    const request = new NextRequest('http://localhost/api/kategori-usaha/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockCategoryData),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Kategori usaha berhasil diperbarui');
    expect(json.data.name).toBe('Updated Category');
  });

  it('should return 400 for invalid ID format', async () => {
    const request = new NextRequest('http://localhost/api/kategori-usaha/abc', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockCategoryData),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: NaN }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Format ID tidak valid');
  });

  it('should return 400 if validation fails', async () => {
    (KategoriUsahaSchema.safeParse as jest.Mock).mockImplementation((data) => {
      if (!data || !data.name || data.name.length < 3) {
        return {
          success: false,
          error: { flatten: () => ({ fieldErrors: { name: ['Too short'] } }) },
        };
      }
      return { success: true, data: mockCategoryData };
    });

    const request = new NextRequest('http://localhost/api/kategori-usaha/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'a' }),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Data tidak valid');
    expect(json.errors.name).toContain('Too short');
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

    const request = new NextRequest('http://localhost/api/kategori-usaha/999', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockCategoryData),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 999 }) });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.message).toBe('Kategori usaha tidak ditemukan.');
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

    const request = new NextRequest('http://localhost/api/kategori-usaha/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Existing Category' }),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.message).toBe('Nama kategori usaha sudah ada.');
  });

  it('should return 500 if updating business category fails for other reasons', async () => {
    (prisma.business_categories.update as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/kategori-usaha/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockCategoryData),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Gagal memperbarui kategori usaha');
  });

  it('should return authorization error if request is not authorized', async () => {
    const mockErrorResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    (authorizeRequest as jest.Mock).mockResolvedValue([false, mockErrorResponse]);

    const request = new NextRequest('http://localhost/api/kategori-usaha/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockCategoryData),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 1 }) });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: 'Unauthorized' });
  });
});

describe('DELETE /api/kategori-usaha/{id}', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete a business category by ID', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.business_categories.delete as jest.Mock).mockResolvedValue({});

    const request = new NextRequest('http://localhost/api/kategori-usaha/1', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Kategori usaha berhasil dihapus.');
  });

  it('should return 400 for invalid ID format', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    const request = new NextRequest('http://localhost/api/kategori-usaha/abc', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: NaN }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Format ID tidak valid');
  });

  it('should return 404 if business category not found (P2025)', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.business_categories.delete as jest.Mock).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError(
        'Record to delete not found.',
        {
          code: 'P2025',
          clientVersion: '2.x.x',
          meta: { cause: 'Record not found' },
        }
      )
    );

    const request = new NextRequest('http://localhost/api/kategori-usaha/999', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 999 }) });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.message).toBe('Kategori usaha tidak ditemukan.');
  });

  it('should return 500 if deleting business category fails', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.business_categories.delete as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/kategori-usaha/1', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Gagal menghapus kategori usaha');
  });

  it('should return authorization error if request is not authorized', async () => {
    const mockErrorResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    (authorizeRequest as jest.Mock).mockResolvedValue([false, mockErrorResponse]);

    const request = new NextRequest('http://localhost/api/kategori-usaha/1', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 1 }) });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: 'Unauthorized' });
  });
});

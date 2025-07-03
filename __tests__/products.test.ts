import { GET, POST } from '../app/api/products/route';
import prisma from '../lib/prisma';
import { authorizeRequest } from '../lib/auth/authorizeRequest';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { productSchema } from '../lib/zod';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    products: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
  },
  Prisma: {
    PrismaClientKnownRequestError: class extends Error {
      code: string;
      clientVersion: string;
      meta: any;
      constructor(message: string, options: { code: string; clientVersion: string; meta?: any }) {
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

jest.mock('../lib/zod', () => ({
  productSchema: {
    safeParse: jest.fn(),
  },
}));

describe('GET /api/products', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a list of products with pagination', async () => {
    (prisma.products.findMany as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Product 1', business_category: { name: 'Category A' }, users: { name: 'User A' } },
      { id: 2, name: 'Product 2', business_category: { name: 'Category B' }, users: { name: 'User B' } },
    ]);
    (prisma.products.count as jest.Mock).mockResolvedValue(2);

    const request = new NextRequest('http://localhost/api/products?page=1&limit=2');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Products fetched successfully');
    expect(json.data).toHaveLength(2);
    expect(json.totalPages).toBe(1);
    expect(json.currentPage).toBe(1);
  });

  it('should filter products by search query', async () => {
    (prisma.products.findMany as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Product A', business_category: { name: 'Category A' }, users: { name: 'User A' } },
    ]);
    (prisma.products.count as jest.Mock).mockResolvedValue(1);

    const request = new NextRequest('http://localhost/api/products?q=Product A');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(prisma.products.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { name: { contains: 'Product A' } },
    }));
  });

  it('should filter products by category ID', async () => {
    (prisma.products.findMany as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Product A', business_category: { name: 'Category A' }, users: { name: 'User A' } },
    ]);
    (prisma.products.count as jest.Mock).mockResolvedValue(1);

    const request = new NextRequest('http://localhost/api/products?kategori=123');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(prisma.products.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { business_category_id: 123 },
    }));
  });

  it('should return 500 if fetching products fails', async () => {
    (prisma.products.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/products');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Failed to fetch products');
  });
});

describe('POST /api/products', () => {
  const mockProductData = {
    name: 'New Product',
    owner_name: 'Owner',
    description: 'Description',
    price: 100,
    stock: 10,
    phone_number: '1234567890',
    business_category_id: 1,
    image: 'image.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (productSchema.safeParse as jest.Mock).mockReturnValue({
      success: true,
      data: mockProductData,
    });
  });

  it('should create a new product successfully', async () => {
    (prisma.products.create as jest.Mock).mockResolvedValue({
      id: 1,
      ...mockProductData,
      user_id: 1,
      uploaded_at: new Date(),
    });

    const request = new NextRequest('http://localhost/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockProductData),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.message).toBe('Produk berhasil dibuat');
    expect(json.data.name).toBe('New Product');
  });

  it('should return 400 if request body is not valid JSON', async () => {
    const request = new NextRequest('http://localhost/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json',
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Request body tidak valid (bukan JSON).');
  });

  it('should return 400 if validation fails', async () => {
    (productSchema.safeParse as jest.Mock).mockReturnValue({
      success: false,
      error: { flatten: () => ({ fieldErrors: { name: ['Required'] } }) },
    });

    const request = new NextRequest('http://localhost/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Data tidak valid.');
    expect(json.errors.name).toContain('Required');
  });

  it('should return 409 if product with similar details already exists (P2002)', async () => {
    const mockError = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: '2.x.x',
        meta: { target: ['name'] },
      }
    );
    (prisma.products.create as jest.Mock).mockRejectedValue(mockError);

    const request = new NextRequest('http://localhost/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockProductData),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.message).toBe('Gagal: Produk dengan nama atau detail serupa sudah ada.');
  });

  it('should return 400 if category or user ID is invalid (P2003)', async () => {
    const mockError = new Prisma.PrismaClientKnownRequestError(
      'Foreign key constraint failed',
      {
        code: 'P2003',
        clientVersion: '2.x.x',
        meta: { field_name: 'business_category_id' },
      }
    );
    (prisma.products.create as jest.Mock).mockRejectedValue(mockError);

    const request = new NextRequest('http://localhost/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockProductData),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Kategori atau User yang dipilih tidak valid.');
  });

  it('should return 500 if creating product fails for other reasons', async () => {
    (prisma.products.create as jest.Mock).mockRejectedValue(new Error('Other database error'));

    const request = new NextRequest('http://localhost/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockProductData),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Terjadi kesalahan pada server saat membuat produk.');
  });

  it('should return authorization error if request is not authorized', async () => {
    const mockErrorResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    (authorizeRequest as jest.Mock).mockResolvedValue([false, mockErrorResponse]);

    const request = new NextRequest('http://localhost/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockProductData),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: 'Unauthorized' });
  });
});

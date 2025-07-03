import { GET, PUT, DELETE } from '../app/api/products/[id]/route';
import prisma from '../lib/prisma';
import { authorizeRequest } from '../lib/auth/authorizeRequest';
import { NextRequest, NextResponse } from 'next/server';
import { updateProductSchema } from '../lib/zod';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    products: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    online_store_links: {
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock('../lib/auth/authorizeRequest', () => ({
  authorizeRequest: jest.fn(),
}));

jest.mock('../lib/zod', () => ({
  updateProductSchema: {
    safeParse: jest.fn(),
  },
}));

describe('GET /api/products/{id}', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a product by ID', async () => {
    (prisma.products.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'Test Product',
      business_category: { name: 'Category A' },
      users: { name: 'User A', email: 'user@example.com' },
      online_store_links: [],
    });

    const request = new NextRequest('http://localhost/api/products/1');
    const response = await GET(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Product fetched successfully');
    expect(json.data.id).toBe(1);
  });

  it('should return 400 for invalid ID format', async () => {
    const request = new NextRequest('http://localhost/api/products/abc');
    const response = await GET(request, { params: Promise.resolve({ id: NaN }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Format ID tidak valid');
  });

  it('should return 404 if product not found', async () => {
    (prisma.products.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/products/999');
    const response = await GET(request, { params: Promise.resolve({ id: 999 }) });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.message).toBe('Produk tidak ditemukan');
  });

  it('should return 500 if fetching product fails', async () => {
    (prisma.products.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/products/1');
    const response = await GET(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Gagal mengambil data produk');
  });
});

describe('PUT /api/products/{id}', () => {
  const mockProductData = {
    name: 'Updated Product',
    description: 'Updated Description',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (updateProductSchema.safeParse as jest.Mock).mockReturnValue({
      success: true,
      data: mockProductData,
    });
  });

  it('should update a product by ID (admin/superadmin)', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([
      { id: 100, level_id: 1 },
      null,
    ]);
    (prisma.products.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      user_id: 101,
    });
    (prisma.products.update as jest.Mock).mockResolvedValue({
      id: 1,
      ...mockProductData,
    });

    const request = new NextRequest('http://localhost/api/products/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockProductData),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Produk berhasil diperbarui');
    expect(json.data.name).toBe('Updated Product');
  });

  it('should update a product by ID (owner)', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([
      { id: 101, level_id: 3 },
      null,
    ]);
    (prisma.products.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      user_id: 101,
    });
    (prisma.products.update as jest.Mock).mockResolvedValue({
      id: 1,
      ...mockProductData,
    });

    const request = new NextRequest('http://localhost/api/products/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockProductData),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Produk berhasil diperbarui');
    expect(json.data.name).toBe('Updated Product');
  });

  it('should return 400 for invalid ID format', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([
      { id: 100, level_id: 1 },
      null,
    ]);
    const request = new NextRequest('http://localhost/api/products/abc', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockProductData),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: NaN }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Format ID tidak valid');
  });

  it('should return 400 for invalid data (zod validation)', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([
      { id: 100, level_id: 1 },
      null,
    ]);
    (updateProductSchema.safeParse as jest.Mock).mockReturnValue({
      success: false,
      error: { flatten: () => ({ fieldErrors: { name: ['Too short'] } }) },
    });

    const request = new NextRequest('http://localhost/api/products/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'a' }),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Data tidak valid.');
    expect(json.errors.name).toContain('Too short');
  });

  it('should return 404 if product not found', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([
      { id: 100, level_id: 1 },
      null,
    ]);
    (prisma.products.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/products/999', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockProductData),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 999 }) });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.message).toBe('Produk tidak ditemukan');
  });

  it('should return 403 if not authorized (not owner and not admin/superadmin)', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([
      { id: 102, level_id: 3 },
      null,
    ]);
    (prisma.products.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      user_id: 101,
    });

    const request = new NextRequest('http://localhost/api/products/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockProductData),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.message).toBe('Akses ditolak: Anda hanya dapat menyunting produk milik sendiri.');
  });

  it('should return 401 if user not authenticated', async () => {
    const mockErrorResponse = NextResponse.json({ message: 'User tidak terautentikasi' }, { status: 401 });
    (authorizeRequest as jest.Mock).mockResolvedValue([null, mockErrorResponse]);

    const request = new NextRequest('http://localhost/api/products/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockProductData),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 1 }) });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: 'User tidak terautentikasi' });
  });

  it('should return 400 if no data to update', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([
      { id: 100, level_id: 1 },
      null,
    ]);
    (prisma.products.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      user_id: 101,
    });
    (updateProductSchema.safeParse as jest.Mock).mockReturnValue({
      success: true,
      data: {},
    });

    const request = new NextRequest('http://localhost/api/products/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Tidak ada data untuk diperbarui.');
  });

  it('should return 500 if updating product fails', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([
      { id: 100, level_id: 1 },
      null,
    ]);
    (prisma.products.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      user_id: 101,
    });
    (prisma.products.update as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/products/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockProductData),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Gagal memperbarui produk');
  });
});

describe('DELETE /api/products/{id}', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete a product by ID (admin/superadmin)', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([
      { id: 100, level_id: 1 },
      null,
    ]);
    (prisma.products.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      user_id: 101,
    });
    (prisma.online_store_links.deleteMany as jest.Mock).mockResolvedValue({});
    (prisma.products.delete as jest.Mock).mockResolvedValue({});

    const request = new NextRequest('http://localhost/api/products/1', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Produk berhasil dihapus');
  });

  it('should delete a product by ID (owner)', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([
      { id: 101, level_id: 3 },
      null,
    ]);
    (prisma.products.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      user_id: 101,
    });
    (prisma.online_store_links.deleteMany as jest.Mock).mockResolvedValue({});
    (prisma.products.delete as jest.Mock).mockResolvedValue({});

    const request = new NextRequest('http://localhost/api/products/1', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Produk berhasil dihapus');
  });

  it('should return 400 for invalid ID format', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([
      { id: 100, level_id: 1 },
      null,
    ]);
    const request = new NextRequest('http://localhost/api/products/abc', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: NaN }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Format ID tidak valid');
  });

  it('should return 404 if product not found', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([
      { id: 100, level_id: 1 },
      null,
    ]);
    (prisma.products.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/products/999', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 999 }) });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.message).toBe('Produk tidak ditemukan');
  });

  it('should return 403 if not authorized (not owner and not admin/superadmin)', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([
      { id: 102, level_id: 3 },
      null,
    ]);
    (prisma.products.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      user_id: 101,
    });

    const request = new NextRequest('http://localhost/api/products/1', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.message).toBe('Akses ditolak: Anda hanya dapat menghapus produk milik sendiri.');
  });

  it('should return 401 if user not authenticated', async () => {
    const mockErrorResponse = NextResponse.json({ message: 'User tidak terautentikasi' }, { status: 401 });
    (authorizeRequest as jest.Mock).mockResolvedValue([null, mockErrorResponse]);

    const request = new NextRequest('http://localhost/api/products/1', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 1 }) });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: 'User tidak terautentikasi' });
  });

  it('should return 500 if deleting product fails', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([
      { id: 100, level_id: 1 },
      null,
    ]);
    (prisma.products.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      user_id: 101,
    });
    (prisma.products.delete as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/products/1', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Gagal menghapus produk');
  });
});

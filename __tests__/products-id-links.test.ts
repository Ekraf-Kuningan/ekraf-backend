import { GET, POST } from '../app/api/products/[id]/links/route';
import prisma from '../lib/prisma';
import { authorizeRequest } from '../lib/auth/authorizeRequest';
import { NextRequest, NextResponse } from 'next/server';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    online_store_links: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('../lib/auth/authorizeRequest', () => ({
  authorizeRequest: jest.fn(),
}));

describe('GET /api/products/{id}/links', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a list of online store links for a product', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.online_store_links.findMany as jest.Mock).mockResolvedValue([
      { id: 1, product_id: 1, platform_name: 'Tokopedia', url: 'http://tokopedia.com/product1' },
      { id: 2, product_id: 1, platform_name: 'Shopee', url: 'http://shopee.com/product1' },
    ]);

    const request = new NextRequest('http://localhost/api/products/1/links');
    const response = await GET(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Links fetched successfully');
    expect(json.data).toHaveLength(2);
  });

  it('should return 400 for invalid product ID', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    const request = new NextRequest('http://localhost/api/products/abc/links');
    const response = await GET(request, { params: Promise.resolve({ id: NaN }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Invalid Product ID');
  });

  it('should return 500 if fetching links fails', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.online_store_links.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/products/1/links');
    const response = await GET(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Failed to fetch links');
  });

  it('should return authorization error if request is not authorized', async () => {
    const mockErrorResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    (authorizeRequest as jest.Mock).mockResolvedValue([false, mockErrorResponse]);

    const request = new NextRequest('http://localhost/api/products/1/links');
    const response = await GET(request, { params: Promise.resolve({ id: 1 }) });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: 'Unauthorized' });
  });
});

describe('POST /api/products/{id}/links', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new online store link successfully', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.online_store_links.create as jest.Mock).mockResolvedValue({
      id: 1,
      product_id: 1,
      platform_name: 'New Platform',
      url: 'http://newplatform.com/product1',
    });

    const request = new NextRequest('http://localhost/api/products/1/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform_name: 'New Platform',
        url: 'http://newplatform.com/product1',
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.message).toBe('Link created successfully');
    expect(json.data.platform_name).toBe('New Platform');
  });

  it('should return 400 for invalid product ID', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    const request = new NextRequest('http://localhost/api/products/abc/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform_name: 'New Platform',
        url: 'http://newplatform.com/product1',
      }),
    });
    const response = await POST(request, { params: Promise.resolve({ id: NaN }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Invalid Product ID');
  });

  it('should return 400 if required fields are missing', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    const request = new NextRequest('http://localhost/api/products/1/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform_name: 'New Platform',
        // Missing URL
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Required fields missing');
  });

  it('should return 500 if creating link fails', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.online_store_links.create as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/products/1/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform_name: 'New Platform',
        url: 'http://newplatform.com/product1',
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Failed to create link');
  });

  it('should return authorization error if request is not authorized', async () => {
    const mockErrorResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    (authorizeRequest as jest.Mock).mockResolvedValue([false, mockErrorResponse]);

    const request = new NextRequest('http://localhost/api/products/1/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform_name: 'Unauthorized Platform',
        url: 'http://unauthorized.com/product1',
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: 1 }) });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: 'Unauthorized' });
  });
});

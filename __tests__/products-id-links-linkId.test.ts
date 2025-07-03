import { PUT, DELETE } from '../app/api/products/[id]/links/[linkId]/route';
import prisma from '../lib/prisma';
import { authorizeRequest } from '../lib/auth/authorizeRequest';
import { NextRequest, NextResponse } from 'next/server';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    online_store_links: {
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('../lib/auth/authorizeRequest', () => ({
  authorizeRequest: jest.fn(),
}));

describe('PUT /api/products/{id}/links/{linkId}', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update an online store link successfully', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.online_store_links.update as jest.Mock).mockResolvedValue({
      id: 1,
      product_id: 1,
      platform_name: 'Updated Platform',
      url: 'http://updated.com/product1',
    });

    const request = new NextRequest('http://localhost/api/products/1/links/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform_name: 'Updated Platform',
        url: 'http://updated.com/product1',
      }),
    });

    const response = await PUT(request, { params: Promise.resolve({ id: 1, linkId: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Link updated successfully');
    expect(json.data.platform_name).toBe('Updated Platform');
  });

  it('should return 400 for invalid link ID', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    const request = new NextRequest('http://localhost/api/products/1/links/abc', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform_name: 'Updated Platform',
        url: 'http://updated.com/product1',
      }),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 1, linkId: NaN }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Invalid Product ID or Link ID');
  });

  it('should return 500 if updating link fails', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.online_store_links.update as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/products/1/links/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform_name: 'Updated Platform',
        url: 'http://updated.com/product1',
      }),
    });

    const response = await PUT(request, { params: Promise.resolve({ id: 1, linkId: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Failed to update link');
  });

  it('should return authorization error if request is not authorized', async () => {
    const mockErrorResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    (authorizeRequest as jest.Mock).mockResolvedValue([false, mockErrorResponse]);

    const request = new NextRequest('http://localhost/api/products/1/links/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform_name: 'Unauthorized Platform',
        url: 'http://unauthorized.com/product1',
      }),
    });

    const response = await PUT(request, { params: Promise.resolve({ id: 1, linkId: 1 }) });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: 'Unauthorized' });
  });
});

describe('DELETE /api/products/{id}/links/{linkId}', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete an online store link successfully', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.online_store_links.delete as jest.Mock).mockResolvedValue({});

    const request = new NextRequest('http://localhost/api/products/1/links/1', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 1, linkId: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Link deleted successfully');
  });

  it('should return 400 for invalid link ID', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    const request = new NextRequest('http://localhost/api/products/1/links/abc', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 1, linkId: NaN }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Invalid Product ID or Link ID');
  });

  it('should return 500 if deleting link fails', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.online_store_links.delete as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/products/1/links/1', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 1, linkId: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Failed to delete link');
  });

  it('should return authorization error if request is not authorized', async () => {
    const mockErrorResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    (authorizeRequest as jest.Mock).mockResolvedValue([false, mockErrorResponse]);

    const request = new NextRequest('http://localhost/api/products/1/links/1', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 1, linkId: 1 }) });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: 'Unauthorized' });
  });
});

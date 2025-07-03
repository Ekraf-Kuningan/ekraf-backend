import { GET, PUT, DELETE } from '../app/api/articles/[id]/route';
import prisma from '../lib/prisma';
import { authorizeRequest } from '../lib/auth/authorizeRequest';
import { NextRequest, NextResponse } from 'next/server';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    artikels: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('../lib/auth/authorizeRequest', () => ({
  authorizeRequest: jest.fn(),
}));

describe('GET /api/articles/{id}', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return an article by ID', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.artikels.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      title: 'Test Article',
      content: 'Test Content',
      users: { name: 'Author Name', email: 'author@example.com' },
    });

    const request = new NextRequest('http://localhost/api/articles/1');
    const response = await GET(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Article fetched successfully');
    expect(json.data.id).toBe(1);
  });

  it('should return 404 if article not found', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.artikels.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/articles/999');
    const response = await GET(request, { params: Promise.resolve({ id: 999 }) });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.message).toContain('Article with ID 999 not found');
  });

  it('should return 500 if fetching article fails', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.artikels.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/articles/1');
    const response = await GET(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Failed to fetch article');
  });

  it('should return authorization error if request is not authorized', async () => {
    const mockErrorResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    (authorizeRequest as jest.Mock).mockResolvedValue([false, mockErrorResponse]);

    const request = new NextRequest('http://localhost/api/articles/1');
    const response = await GET(request, { params: Promise.resolve({ id: 1 }) });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: 'Unauthorized' });
  });
});

describe('PUT /api/articles/{id}', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update an article by ID', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.artikels.update as jest.Mock).mockResolvedValue({
      id: 1,
      title: 'Updated Title',
      content: 'Updated Content',
    });

    const request = new NextRequest('http://localhost/api/articles/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Updated Title',
        content: 'Updated Content',
      }),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Article updated successfully');
    expect(json.data.title).toBe('Updated Title');
  });

  it('should return 500 if updating article fails', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.artikels.update as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/articles/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Updated Title',
        content: 'Updated Content',
      }),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toContain('Failed to update article with ID 1');
  });

  it('should return authorization error if request is not authorized', async () => {
    const mockErrorResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    (authorizeRequest as jest.Mock).mockResolvedValue([false, mockErrorResponse]);

    const request = new NextRequest('http://localhost/api/articles/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Updated Title',
        content: 'Updated Content',
      }),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 1 }) });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: 'Unauthorized' });
  });
});

describe('DELETE /api/articles/{id}', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete an article by ID', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.artikels.delete as jest.Mock).mockResolvedValue({});

    const request = new NextRequest('http://localhost/api/articles/1', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toContain('Article with ID 1 deleted successfully');
  });

  it('should return 500 if deleting article fails', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.artikels.delete as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/articles/1', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toContain('Failed to delete article with ID 1');
  });

  it('should return authorization error if request is not authorized', async () => {
    const mockErrorResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    (authorizeRequest as jest.Mock).mockResolvedValue([false, mockErrorResponse]);

    const request = new NextRequest('http://localhost/api/articles/1', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 1 }) });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: 'Unauthorized' });
  });
});

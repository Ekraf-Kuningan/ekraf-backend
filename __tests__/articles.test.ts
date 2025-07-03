import { GET, POST } from '../app/api/articles/route';
import prisma from '../lib/prisma';
import { authorizeRequest } from '../lib/auth/authorizeRequest';
import { NextRequest, NextResponse } from 'next/server';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    artikels: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('../lib/auth/authorizeRequest', () => ({
  authorizeRequest: jest.fn(),
}));

describe('GET /api/articles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a list of articles with pagination', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.artikels.findMany as jest.Mock).mockResolvedValue([
      { id: 1, title: 'Article 1', content: 'Content 1', author_id: 1, artikel_kategori_id: 1, slug: 'article-1', users: { name: 'Author 1', email: 'author1@example.com' } },
      { id: 2, title: 'Article 2', content: 'Content 2', author_id: 1, artikel_kategori_id: 1, slug: 'article-2', users: { name: 'Author 1', email: 'author1@example.com' } },
    ]);
    (prisma.artikels.count as jest.Mock).mockResolvedValue(2);

    const request = new NextRequest('http://localhost/api/articles?page=1&limit=2');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Articles fetched successfully');
    expect(json.data).toHaveLength(2);
    expect(json.totalPages).toBe(1);
    expect(json.currentPage).toBe(1);
  });

  it('should return 400 for invalid page or limit', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    const request = new NextRequest('http://localhost/api/articles?page=0&limit=1');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Page and limit must be positive integers');
  });

  it('should return 500 if fetching articles fails', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.artikels.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/articles?page=1&limit=10');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Failed to fetch articles');
  });

  it('should return authorization error if request is not authorized', async () => {
    const mockErrorResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    (authorizeRequest as jest.Mock).mockResolvedValue([false, mockErrorResponse]);

    const request = new NextRequest('http://localhost/api/articles');
    const response = await GET(request);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: 'Unauthorized' });
  });
});

describe('POST /api/articles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new article successfully', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.artikels.create as jest.Mock).mockResolvedValue({
      id: 1,
      title: 'New Article',
      content: 'New Content',
      author_id: 1,
      artikel_kategori_id: 1,
      slug: 'new-article',
    });

    const request = new NextRequest('http://localhost/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'New Article',
        content: 'New Content',
        author_id: 1,
        artikel_kategori_id: 1,
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.message).toBe('Article created successfully');
    expect(json.data.title).toBe('New Article');
  });

  it('should return 400 if required fields are missing', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    const request = new NextRequest('http://localhost/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'New Article',
        content: 'New Content',
        // Missing author_id and artikel_kategori_id
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toContain('Required fields are missing');
  });

  it('should return 500 if creating article fails', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.artikels.create as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'New Article',
        content: 'New Content',
        author_id: 1,
        artikel_kategori_id: 1,
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Failed to create article');
  });

  it('should return authorization error if request is not authorized', async () => {
    const mockErrorResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    (authorizeRequest as jest.Mock).mockResolvedValue([false, mockErrorResponse]);

    const request = new NextRequest('http://localhost/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'New Article',
        content: 'New Content',
        author_id: 1,
        artikel_kategori_id: 1,
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: 'Unauthorized' });
  });
});

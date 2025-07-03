import { GET, POST } from '../app/api/subsectors/route';
import prisma from '../lib/prisma';
import { authorizeRequest } from '../lib/auth/authorizeRequest';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '../app/generated/prisma';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    sub_sectors: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('../app/generated/prisma', () => ({
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

jest.mock('../lib/auth/authorizeRequest', () => ({
  authorizeRequest: jest.fn(),
}));

describe('GET /api/subsectors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a list of subsectors ordered by title', async () => {
    (prisma.sub_sectors.findMany as jest.Mock).mockResolvedValue([
      { id: 1, title: 'Agribisnis', slug: 'agribisnis' },
      { id: 2, title: 'Kerajinan', slug: 'kerajinan' },
      { id: 3, title: 'Kuliner', slug: 'kuliner' },
    ]);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Subsektor berhasil diambil');
    expect(json.data).toHaveLength(3);
    expect(json.data[0]).toHaveProperty('id');
    expect(json.data[0]).toHaveProperty('title');
    expect(json.data[0]).toHaveProperty('slug');
    
    // Verify that findMany was called with correct orderBy
    expect(prisma.sub_sectors.findMany).toHaveBeenCalledWith({
      orderBy: {
        title: 'asc'
      }
    });
  });

  it('should return empty array when no subsectors exist', async () => {
    (prisma.sub_sectors.findMany as jest.Mock).mockResolvedValue([]);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Subsektor berhasil diambil');
    expect(json.data).toHaveLength(0);
    expect(Array.isArray(json.data)).toBe(true);
  });

  it('should return 500 if fetching subsectors fails', async () => {
    (prisma.sub_sectors.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Gagal mengambil data Subsector');
  });

  it('should handle database connection error', async () => {
    (prisma.sub_sectors.findMany as jest.Mock).mockRejectedValue(new Error('Connection refused'));

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Gagal mengambil data Subsector');
  });
});

describe('POST /api/subsectors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new subsector successfully with valid data', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.sub_sectors.create as jest.Mock).mockResolvedValue({
      id: 1,
      title: 'Teknologi Digital',
      slug: 'teknologi-digital',
    });

    const request = new NextRequest('http://localhost/api/subsectors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Teknologi Digital',
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.message).toBe('Subsektor berhasil dibuat');
    expect(json.data.title).toBe('Teknologi Digital');
    expect(json.data.slug).toBe('teknologi-digital');
    expect(json.data).toHaveProperty('id');
    
    // Verify that create was called with correct data including generated slug
    expect(prisma.sub_sectors.create).toHaveBeenCalledWith({
      data: {
        title: 'Teknologi Digital',
        slug: 'teknologi-digital'
      }
    });
  });

  it('should generate correct slug from title with special characters', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.sub_sectors.create as jest.Mock).mockResolvedValue({
      id: 2,
      title: 'Fashion & Lifestyle',
      slug: 'fashion-lifestyle',
    });

    const request = new NextRequest('http://localhost/api/subsectors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Fashion & Lifestyle',
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.data.slug).toBe('fashion-lifestyle');
    
    // Verify slug generation removes special chars and replaces spaces with dashes
    expect(prisma.sub_sectors.create).toHaveBeenCalledWith({
      data: {
        title: 'Fashion & Lifestyle',
        slug: 'fashion-lifestyle'
      }
    });
  });

  it('should return 400 if title is too short (less than 3 characters)', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    
    const request = new NextRequest('http://localhost/api/subsectors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'ab', // Too short
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Data tidak valid');
    expect(json.errors.title).toContain('Nama subsektor harus memiliki minimal 3 karakter.');
  });

  it('should return 400 if title is missing', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    
    const request = new NextRequest('http://localhost/api/subsectors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // Missing title
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Data tidak valid');
    expect(json.errors).toHaveProperty('title');
  });

  it('should return 400 if title is empty string', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    
    const request = new NextRequest('http://localhost/api/subsectors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '', // Empty string
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Data tidak valid');
    expect(json.errors.title).toContain('Nama subsektor harus memiliki minimal 3 karakter.');
  });

  it('should return 400 if request body is invalid JSON', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    
    const request = new NextRequest('http://localhost/api/subsectors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json', // Invalid JSON
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Data tidak valid');
    expect(json.errors.body).toContain('Invalid JSON format');
  });

  it('should return 409 if subsector title already exists (P2002)', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    const mockError = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed on the fields: (`title`)',
      {
        code: 'P2002',
        clientVersion: '2.x.x',
        meta: { target: ['title'] },
      }
    );
    (prisma.sub_sectors.create as jest.Mock).mockRejectedValue(mockError);

    const request = new NextRequest('http://localhost/api/subsectors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Existing Subsector',
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.message).toBe('Nama subsektor sudah ada.');
  });

  it('should return 500 if creating subsector fails for other database reasons', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.sub_sectors.create as jest.Mock).mockRejectedValue(new Error('Database connection error'));

    const request = new NextRequest('http://localhost/api/subsectors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Valid Subsector',
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Gagal membuat subsektor');
  });

  it('should return 401 if user is not authorized', async () => {
    const mockErrorResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    (authorizeRequest as jest.Mock).mockResolvedValue([false, mockErrorResponse]);

    const request = new NextRequest('http://localhost/api/subsectors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Unauthorized Subsector',
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.message).toBe('Unauthorized');
  });

  it('should return 403 if user has insufficient permissions', async () => {
    const mockErrorResponse = NextResponse.json({ message: 'Access denied' }, { status: 403 });
    (authorizeRequest as jest.Mock).mockResolvedValue([false, mockErrorResponse]);

    const request = new NextRequest('http://localhost/api/subsectors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Forbidden Subsector',
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.message).toBe('Access denied');
  });

  it('should verify authorization is called with correct levels [1, 2]', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.sub_sectors.create as jest.Mock).mockResolvedValue({
      id: 1,
      title: 'Test Subsector',
      slug: 'test-subsector',
    });

    const request = new NextRequest('http://localhost/api/subsectors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Subsector',
      }),
    });

    await POST(request);

    expect(authorizeRequest).toHaveBeenCalledWith(request, [1, 2]);
  });

  it('should handle very long title correctly', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    const longTitle = 'A'.repeat(100); // 100 character title
    const expectedSlug = 'a'.repeat(100).toLowerCase(); // Expected slug
    
    (prisma.sub_sectors.create as jest.Mock).mockResolvedValue({
      id: 1,
      title: longTitle,
      slug: expectedSlug,
    });

    const request = new NextRequest('http://localhost/api/subsectors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: longTitle,
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.data.title).toBe(longTitle);
    expect(json.data.slug).toBe(expectedSlug);
  });
});

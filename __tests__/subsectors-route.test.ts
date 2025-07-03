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

  it('should return a list of subsectors', async () => {
    (prisma.sub_sectors.findMany as jest.Mock).mockResolvedValue([
      { id: 1, title: 'Subsector 1', slug: 'subsector-1' },
      { id: 2, title: 'Subsector 2', slug: 'subsector-2' },
    ]);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Subsektor berhasil diambil');
    expect(json.data).toHaveLength(2);
  });

  it('should return 500 if fetching subsectors fails', async () => {
    (prisma.sub_sectors.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

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

  it('should create a new subsector successfully', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.sub_sectors.create as jest.Mock).mockResolvedValue({
      id: 1,
      title: 'New Subsector',
      slug: 'new-subsector',
    });

    const request = new NextRequest('http://localhost/api/subsectors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'New Subsector',
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.message).toBe('Subsektor berhasil dibuat');
    expect(json.data.title).toBe('New Subsector');
  });

  it('should return 400 if required fields are missing or invalid', async () => {
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

  it('should return 409 if subsector title already exists', async () => {
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

  it('should return 500 if creating subsector fails for other reasons', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.sub_sectors.create as jest.Mock).mockRejectedValue(new Error('Other database error'));

    const request = new NextRequest('http://localhost/api/subsectors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Another Subsector',
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Gagal membuat subsektor');
  });

  it('should return authorization error if request is not authorized', async () => {
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

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: 'Unauthorized' });
  });
});

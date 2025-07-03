import { GET, PUT, DELETE } from '../app/api/subsectors/[id]/route';
import prisma from '../lib/prisma';
import { authorizeRequest } from '../lib/auth/authorizeRequest';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    sub_sectors: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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

describe('GET /api/subsectors/{id}', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a subsector by ID', async () => {
    (prisma.sub_sectors.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      title: 'Test Subsector',
      slug: 'test-subsector',
    });

    const request = new NextRequest('http://localhost/api/subsectors/1');
    const response = await GET(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Data berhasil diambil');
    expect(json.data.id).toBe(1);
  });

  it('should return 400 for invalid ID format', async () => {
    const request = new NextRequest('http://localhost/api/subsectors/abc');
    const response = await GET(request, { params: Promise.resolve({ id: NaN }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Format ID tidak valid');
  });

  it('should return 404 if subsector not found', async () => {
    (prisma.sub_sectors.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/subsectors/999');
    const response = await GET(request, { params: Promise.resolve({ id: 999 }) });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.message).toBe('Subsector tidak ditemukan');
  });

  it('should return 500 if fetching subsector fails', async () => {
    (prisma.sub_sectors.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/subsectors/1');
    const response = await GET(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Gagal mengambil data');
  });
});

describe('PUT /api/subsectors/{id}', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update a subsector by ID', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.sub_sectors.update as jest.Mock).mockResolvedValue({
      id: 1,
      title: 'Updated Subsector',
      slug: 'updated-subsector',
    });

    const request = new NextRequest('http://localhost/api/subsectors/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Updated Subsector',
      }),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Subsector berhasil diperbarui');
    expect(json.data.title).toBe('Updated Subsector');
  });

  it('should return 400 for invalid ID format', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    const request = new NextRequest('http://localhost/api/subsectors/abc', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Updated Subsector',
      }),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: NaN }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Format ID tidak valid');
  });

  it('should return 400 if required fields are missing or invalid', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    const request = new NextRequest('http://localhost/api/subsectors/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'ab', // Too short
      }),
    });

    const response = await PUT(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Data tidak valid');
    expect(json.errors.title).toContain('Nama subsektor harus memiliki minimal 3 karakter.');
  });

  it('should return 404 if subsector not found (P2025)', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    const mockError = new Prisma.PrismaClientKnownRequestError(
      'Record to update not found.',
      {
        code: 'P2025',
        clientVersion: '2.x.x',
        meta: { cause: 'Record not found' },
      }
    );
    (prisma.sub_sectors.update as jest.Mock).mockRejectedValue(mockError);

    const request = new NextRequest('http://localhost/api/subsectors/999', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Updated Subsector',
      }),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 999 }) });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.message).toBe('Subsector tidak ditemukan.');
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
    (prisma.sub_sectors.update as jest.Mock).mockRejectedValue(mockError);

    const request = new NextRequest('http://localhost/api/subsectors/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Existing Subsector',
      }),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.message).toBe('Nama subsektor sudah ada.');
  });

  it('should return 500 if updating subsector fails for other reasons', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.sub_sectors.update as jest.Mock).mockRejectedValue(new Error('Other database error'));

    const request = new NextRequest('http://localhost/api/subsectors/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Another Subsector',
      }),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Gagal memperbarui subsektor');
  });

  it('should return authorization error if request is not authorized', async () => {
    const mockErrorResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    (authorizeRequest as jest.Mock).mockResolvedValue([false, mockErrorResponse]);

    const request = new NextRequest('http://localhost/api/subsectors/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Unauthorized Subsector',
      }),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 1 }) });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: 'Unauthorized' });
  });
});

describe('DELETE /api/subsectors/{id}', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete a subsector by ID', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.sub_sectors.delete as jest.Mock).mockResolvedValue({});

    const request = new NextRequest('http://localhost/api/subsectors/1', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Subsector berhasil dihapus.');
  });

  it('should return 404 if subsector not found (P2025)', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    const mockError = new Prisma.PrismaClientKnownRequestError(
      'Record to delete not found.',
      {
        code: 'P2025',
        clientVersion: '2.x.x',
        meta: { cause: 'Record not found' },
      }
    );
    (prisma.sub_sectors.delete as jest.Mock).mockRejectedValue(mockError);

    const request = new NextRequest('http://localhost/api/subsectors/999', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 999 }) });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.message).toBe('Subsector tidak ditemukan.');
  });

  it('should return 500 if deleting subsector fails', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.sub_sectors.delete as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/subsectors/1', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Gagal menghapus subsektor');
  });

  it('should return authorization error if request is not authorized', async () => {
    const mockErrorResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    (authorizeRequest as jest.Mock).mockResolvedValue([false, mockErrorResponse]);

    const request = new NextRequest('http://localhost/api/subsectors/1', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 1 }) });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: 'Unauthorized' });
  });
});

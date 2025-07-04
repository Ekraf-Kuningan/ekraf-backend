import { GET } from '../app/api/auth/verify/route';
import { prisma } from '../lib/prisma';
import { NextRequest } from 'next/server';

// Mock the dependencies
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  prisma: {
    temporary_users: {
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    users: {
      create: jest.fn(),
    },
    $disconnect: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock console.error to avoid noise in test output
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('GET /api/auth/verify', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTempUser = {
    id: 1,
    name: 'John Doe',
    username: 'johndoe',
    email: 'john@example.com',
    password: 'password123',
    gender: 'Laki_laki',
    phone_number: '08123456789',
    level_id: 3,
    verificationToken: 'valid_token',
    createdAt: new Date(),
  };

  const createMockRequest = (token?: string) => {
    const url = token ? `http://localhost:3000/api/auth/verify?token=${token}` : 'http://localhost:3000/api/auth/verify';
    return {
      url,
    } as NextRequest;
  };

  it('should successfully verify user with valid token', async () => {
    // Set createdAt to current time minus 2 minutes (within 5-minute expiry)
    const recentTime = new Date(Date.now() - 2 * 60 * 1000);
    const tempUserWithRecentTime = { ...mockTempUser, createdAt: recentTime };
    
    (prisma.temporary_users.findFirst as jest.Mock).mockResolvedValue(tempUserWithRecentTime);
    (prisma.users.create as jest.Mock).mockResolvedValue({
      ...tempUserWithRecentTime,
      verifiedAt: expect.any(Date),
    });
    (prisma.temporary_users.delete as jest.Mock).mockResolvedValue(tempUserWithRecentTime);

    const request = createMockRequest('valid_token');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/html');
    
    const html = await response.text();
    expect(html).toContain('Pendaftaran Berhasil!');
    expect(html).toContain('Email Anda telah berhasil diverifikasi');

    expect(prisma.users.create).toHaveBeenCalledWith({
      data: {
        name: tempUserWithRecentTime.name,
        username: tempUserWithRecentTime.username,
        email: tempUserWithRecentTime.email,
        password: tempUserWithRecentTime.password,
        gender: tempUserWithRecentTime.gender,
        phone_number: tempUserWithRecentTime.phone_number,
        level_id: tempUserWithRecentTime.level_id,
        verifiedAt: expect.any(Date),
      },
    });

    expect(prisma.temporary_users.delete).toHaveBeenCalledWith({
      where: { id: tempUserWithRecentTime.id },
    });
  });

  it('should return 400 when token is missing', async () => {
    const request = createMockRequest();
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Token verifikasi tidak ditemukan.');
  });

  it('should return 400 when token is invalid', async () => {
    (prisma.temporary_users.findFirst as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('invalid_token');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Token tidak valid atau telah digunakan.');
  });

  it('should return 400 and delete expired token', async () => {
    // Set createdAt to 10 minutes ago (expired)
    const expiredTime = new Date(Date.now() - 10 * 60 * 1000);
    const expiredTempUser = { ...mockTempUser, createdAt: expiredTime };
    
    (prisma.temporary_users.findFirst as jest.Mock).mockResolvedValue(expiredTempUser);
    (prisma.temporary_users.delete as jest.Mock).mockResolvedValue(expiredTempUser);

    const request = createMockRequest('expired_token');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Token telah kedaluwarsa.');
    
    expect(prisma.temporary_users.delete).toHaveBeenCalledWith({
      where: { id: expiredTempUser.id },
    });
  });

  it('should handle unique constraint violation error', async () => {
    const recentTime = new Date(Date.now() - 2 * 60 * 1000);
    const tempUserWithRecentTime = { ...mockTempUser, createdAt: recentTime };
    
    (prisma.temporary_users.findFirst as jest.Mock).mockResolvedValue(tempUserWithRecentTime);
    const uniqueConstraintError = new Error('Unique constraint failed on the fields: (`email`)');
    (prisma.users.create as jest.Mock).mockRejectedValue(uniqueConstraintError);

    const request = createMockRequest('valid_token');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.message).toBe('Pengguna dengan email atau username ini sudah diverifikasi.');
  });

  it('should handle general database errors', async () => {
    (prisma.temporary_users.findFirst as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

    const request = createMockRequest('valid_token');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Terjadi kesalahan pada server'); // Generic error message
  });

  it('should handle unknown errors', async () => {
    (prisma.temporary_users.findFirst as jest.Mock).mockRejectedValue('Unknown error');

    const request = createMockRequest('valid_token');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Terjadi kesalahan pada server');
  });

  it('should call prisma.$disconnect in finally block on success', async () => {
    const recentTime = new Date(Date.now() - 2 * 60 * 1000);
    const tempUserWithRecentTime = { ...mockTempUser, createdAt: recentTime };
    
    (prisma.temporary_users.findFirst as jest.Mock).mockResolvedValue(tempUserWithRecentTime);
    (prisma.users.create as jest.Mock).mockResolvedValue({});
    (prisma.temporary_users.delete as jest.Mock).mockResolvedValue({});

    const request = createMockRequest('valid_token');
    await GET(request);

    expect(prisma.$disconnect).toHaveBeenCalled();
  });

  it('should call prisma.$disconnect in finally block on error', async () => {
    (prisma.temporary_users.findFirst as jest.Mock).mockRejectedValue(new Error('Test error'));

    const request = createMockRequest('valid_token');
    await GET(request);

    expect(prisma.$disconnect).toHaveBeenCalled();
  });

  it('should verify token search query correctly', async () => {
    (prisma.temporary_users.findFirst as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('test_token_123');
    await GET(request);

    expect(prisma.temporary_users.findFirst).toHaveBeenCalledWith({
      where: {
        verificationToken: 'test_token_123',
      },
    });
  });
});

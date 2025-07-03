import { POST } from '../app/api/auth/reset-password/route';
import { prisma } from '../lib/prisma';
import { NextRequest } from 'next/server';

// Mock the dependencies
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  prisma: {
    users: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $disconnect: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password_123'),
}));

// Mock console.error to avoid noise in test output
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    id: 1,
    name: 'John Doe',
    username: 'johndoe',
    email: 'john@example.com',
    password: 'oldpassword',
    resetPasswordToken: 'valid_reset_token',
    resetPasswordTokenExpiry: new Date(Date.now() + 3600000), // 1 hour from now
  };

  const createMockRequest = (body: Record<string, unknown>) => {
    return {
      json: jest.fn().mockResolvedValue(body),
    } as unknown as NextRequest;
  };

  it('should successfully reset password with valid token', async () => {
    (prisma.users.findFirst as jest.Mock).mockResolvedValue(mockUser);
    (prisma.users.update as jest.Mock).mockResolvedValue({
      ...mockUser,
      password: 'newpassword123',
      resetPasswordToken: null,
      resetPasswordTokenExpiry: null,
    });

    const request = createMockRequest({
      token: 'valid_reset_token',
      password: 'newpassword123',
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Password Anda telah berhasil direset.');
    expect(json.success).toBe(true);

    expect(prisma.users.findFirst).toHaveBeenCalledWith({
      where: {
        resetPasswordToken: 'valid_reset_token',
        resetPasswordTokenExpiry: {
          gt: expect.any(Date),
        },
      },
    });

    expect(prisma.users.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        password: 'hashed_password_123', // Expect hashed password
        resetPasswordToken: null,
        resetPasswordTokenExpiry: null,
      },
    });
  });

  it('should return 400 when token is missing', async () => {
    const request = createMockRequest({
      password: 'newpassword123',
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Token dan password baru wajib diisi');
  });

  it('should return 400 when password is missing', async () => {
    const request = createMockRequest({
      token: 'valid_reset_token',
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Token dan password baru wajib diisi');
  });

  it('should return 400 when both token and password are missing', async () => {
    const request = createMockRequest({});

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Token dan password baru wajib diisi');
  });

  it('should return 400 when token is invalid', async () => {
    (prisma.users.findFirst as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest({
      token: 'invalid_token',
      password: 'newpassword123',
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Token tidak valid atau sudah kedaluwarsa.');
  });

  it('should return 400 when token is expired', async () => {
    (prisma.users.findFirst as jest.Mock).mockResolvedValue(null); // Expired token won't match the query

    const request = createMockRequest({
      token: 'expired_token',
      password: 'newpassword123',
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Token tidak valid atau sudah kedaluwarsa.');
  });

  it('should handle invalid JSON request body', async () => {
    const request = {
      json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
    } as unknown as NextRequest;

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Terjadi kesalahan pada server');
  });

  it('should handle database error during findFirst', async () => {
    (prisma.users.findFirst as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

    const request = createMockRequest({
      token: 'valid_reset_token',
      password: 'newpassword123',
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Terjadi kesalahan pada server');
  });

  it('should handle database error during update', async () => {
    (prisma.users.findFirst as jest.Mock).mockResolvedValue(mockUser);
    (prisma.users.update as jest.Mock).mockRejectedValue(new Error('Update failed'));

    const request = createMockRequest({
      token: 'valid_reset_token',
      password: 'newpassword123',
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Terjadi kesalahan pada server');
  });

  it('should call prisma.$disconnect in finally block on success', async () => {
    (prisma.users.findFirst as jest.Mock).mockResolvedValue(mockUser);
    (prisma.users.update as jest.Mock).mockResolvedValue({});

    const request = createMockRequest({
      token: 'valid_reset_token',
      password: 'newpassword123',
    });

    await POST(request);

    expect(prisma.$disconnect).toHaveBeenCalled();
  });

  it('should call prisma.$disconnect in finally block on error', async () => {
    (prisma.users.findFirst as jest.Mock).mockRejectedValue(new Error('Test error'));

    const request = createMockRequest({
      token: 'valid_reset_token',
      password: 'newpassword123',
    });

    await POST(request);

    expect(prisma.$disconnect).toHaveBeenCalled();
  });

  it('should handle empty string values as missing', async () => {
    const request = createMockRequest({
      token: '',
      password: '',
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Token dan password baru wajib diisi');
  });

  it('should accept any valid string password', async () => {
    (prisma.users.findFirst as jest.Mock).mockResolvedValue(mockUser);
    (prisma.users.update as jest.Mock).mockResolvedValue({});

    const testPasswords = [
      'simple',
      'Complex123!@#',
      'very-long-password-with-many-characters-123456789',
      '123456',
    ];

    for (const password of testPasswords) {
      const request = createMockRequest({
        token: 'valid_reset_token',
        password,
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          password: 'hashed_password_123', // Expect hashed password
          resetPasswordToken: null,
          resetPasswordTokenExpiry: null,
        },
      });
    }
  });
});

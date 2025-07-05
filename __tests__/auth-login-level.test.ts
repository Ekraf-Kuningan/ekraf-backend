jest.mock('process', () => ({
  ...jest.requireActual('process'),
  env: {
    ...jest.requireActual('process').env,
    JWT_SECRET: 'test_jwt_secret',
  },
}));

import { POST } from '../app/api/auth/login/[level]/route';
import { prisma } from '../lib/prisma';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Mock the dependencies
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  prisma: {
    users: {
      findFirst: jest.fn(),
    },
    $disconnect: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

// Mock console.error to avoid noise in test output
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('POST /api/auth/login/[level]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set default bcrypt behavior
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  const mockUser = {
    id: 1,
    name: 'John Doe',
    username: 'johndoe',
    email: 'john@example.com',
    password: 'password123',
    level_id: 2,
    levels: {
      name: 'admin',
    },
  };

  const createMockRequest = (body: Record<string, unknown>) => {
    return {
      json: jest.fn().mockResolvedValue(body),
    } as unknown as NextRequest;
  };

  const createMockParams = (level: string) => {
    return Promise.resolve({ level });
  };

  it('should successfully login with valid credentials for admin level', async () => {
    (prisma.users.findFirst as jest.Mock).mockResolvedValue(mockUser);
    (jwt.sign as jest.Mock).mockReturnValue('mock_jwt_token');

    const request = createMockRequest({
      usernameOrEmail: 'johndoe',
      password: 'password123',
    });
    const params = createMockParams('admin');

    const response = await POST(request, { params });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Login berhasil');
    expect(json.token).toBe('mock_jwt_token');
    expect(json.user).toEqual({
      id: 1,
      name: 'John Doe',
      username: 'johndoe',
      level_id: 2,
      level: 'admin',
      email: 'john@example.com',
    });
  });

  it('should successfully login with email instead of username', async () => {
    (prisma.users.findFirst as jest.Mock).mockResolvedValue(mockUser);
    (jwt.sign as jest.Mock).mockReturnValue('mock_jwt_token');

    const request = createMockRequest({
      usernameOrEmail: 'john@example.com',
      password: 'password123',
    });
    const params = createMockParams('admin');

    const response = await POST(request, { params });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Login berhasil');
    expect(prisma.users.findFirst).toHaveBeenCalledWith({
      where: {
        AND: [
          {
            OR: [
              { username: 'john@example.com' },
              { email: 'john@example.com' },
            ],
          },
          {
            level_id: 2,
          },
        ],
      },
      include: {
        levels: {
          select: {
            name: true,
          },
        },
      },
    });
  });

  it('should successfully login for umkm level', async () => {
    const umkmUser = { ...mockUser, level_id: 3, levels: { name: 'umkm' } };
    (prisma.users.findFirst as jest.Mock).mockResolvedValue(umkmUser);
    (jwt.sign as jest.Mock).mockReturnValue('mock_jwt_token');

    const request = createMockRequest({
      usernameOrEmail: 'johndoe',
      password: 'password123',
    });
    const params = createMockParams('umkm');

    const response = await POST(request, { params });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.user.level_id).toBe(3);
    expect(json.user.level).toBe('umkm');
  });

  it('should successfully login for superadmin level', async () => {
    const superadminUser = { ...mockUser, level_id: 1, levels: { name: 'superadmin' } };
    (prisma.users.findFirst as jest.Mock).mockResolvedValue(superadminUser);
    (jwt.sign as jest.Mock).mockReturnValue('mock_jwt_token');

    const request = createMockRequest({
      usernameOrEmail: 'johndoe',
      password: 'password123',
    });
    const params = createMockParams('superadmin');

    const response = await POST(request, { params });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.user.level_id).toBe(1);
    expect(json.user.level).toBe('superadmin');
  });

  it('should return 404 for invalid level', async () => {
    const request = createMockRequest({
      usernameOrEmail: 'johndoe',
      password: 'password123',
    });
    const params = createMockParams('invalid_level');

    const response = await POST(request, { params });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.message).toBe("Tipe login 'invalid_level' tidak valid.");
  });

  it('should return 400 when username/email is missing', async () => {
    const request = createMockRequest({
      password: 'password123',
    });
    const params = createMockParams('admin');

    const response = await POST(request, { params });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Username/Email dan password diperlukan');
  });

  it('should return 400 when password is missing', async () => {
    const request = createMockRequest({
      usernameOrEmail: 'johndoe',
    });
    const params = createMockParams('admin');

    const response = await POST(request, { params });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Username/Email dan password diperlukan');
  });

  it('should return 400 when request body is invalid JSON', async () => {
    const request = {
      json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
    } as unknown as NextRequest;
    const params = createMockParams('admin');

    const response = await POST(request, { params });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Request body tidak valid atau bukan JSON.');
  });

  it('should return 401 when user not found', async () => {
    (prisma.users.findFirst as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest({
      usernameOrEmail: 'nonexistent',
      password: 'password123',
    });
    const params = createMockParams('admin');

    const response = await POST(request, { params });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.message).toBe('Kredensial salah untuk level admin');
  });

  it('should return 401 when password is incorrect', async () => {
    (prisma.users.findFirst as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false); // Mock wrong password

    const request = createMockRequest({
      usernameOrEmail: 'johndoe',
      password: 'wrongpassword',
    });
    const params = createMockParams('admin');

    const response = await POST(request, { params });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.message).toBe('Kredensial salah untuk level admin');
  });

  it('should return 500 when database operation fails', async () => {
    (prisma.users.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = createMockRequest({
      usernameOrEmail: 'johndoe',
      password: 'password123',
    });
    const params = createMockParams('admin');

    const response = await POST(request, { params });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Terjadi kesalahan pada server');
  });

  it('should generate JWT token with correct payload', async () => {
    (prisma.users.findFirst as jest.Mock).mockResolvedValue(mockUser);
    (jwt.sign as jest.Mock).mockReturnValue('mock_jwt_token');

    const request = createMockRequest({
      usernameOrEmail: 'johndoe',
      password: 'password123',
    });
    const params = createMockParams('admin');

    await POST(request, { params });

    expect(jwt.sign).toHaveBeenCalledWith(
      {
        id: 1,
        username: 'johndoe',
        level_id: 2,
        level: 'admin',
        email: 'john@example.com',
      },
      process.env.JWT_SECRET,
      { expiresIn: '365d' }
    );
  });

  it('should call prisma.$disconnect in finally block', async () => {
    (prisma.users.findFirst as jest.Mock).mockResolvedValue(mockUser);
    (jwt.sign as jest.Mock).mockReturnValue('mock_jwt_token');

    const request = createMockRequest({
      usernameOrEmail: 'johndoe',
      password: 'password123',
    });
    const params = createMockParams('admin');

    await POST(request, { params });

    expect(prisma.$disconnect).toHaveBeenCalled();
  });
});
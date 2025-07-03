import { POST } from '../app/api/auth/forgot-password/route';
import prisma from '../lib/prisma';
import { sendEmail } from '../lib/mailer';
import { NextRequest, NextResponse } from 'next/server';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  prisma: {
    users: {
      findFirst: jest.fn(),
    },
    $disconnect: jest.fn().mockResolvedValue(undefined),
  },
  default: {
    users: {
      findFirst: jest.fn(),
    },
    $disconnect: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../lib/mailer', () => ({
  sendEmail: jest.fn(),
}));

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if email is missing', async () => {
    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Email wajib diisi');
  });

  it('should return 200 and not send email if user not found', async () => {
    (prisma.users.findFirst as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent@example.com' }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Jika email Anda terdaftar, Anda akan menerima link reset password.');
    expect(json.success).toBe(true);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('should return 200 and send email if user found', async () => {
    const mockUser = { id: 1, email: 'test@example.com' };
    (prisma.users.findFirst as jest.Mock).mockResolvedValue(mockUser);
    (sendEmail as jest.Mock).mockResolvedValue(true);

    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Jika email Anda terdaftar, Anda akan menerima link reset password.');
    expect(json.success).toBe(true);
    expect(sendEmail).toHaveBeenCalledWith({
      email: mockUser.email,
      emailType: 'RESET',
      userId: Number(mockUser.id),
    });
  });

  it('should return 500 if an error occurs during the process', async () => {
    (prisma.users.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Terjadi kesalahan pada server');
  });
});

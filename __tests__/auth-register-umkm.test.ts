import { POST } from '../app/api/auth/register/umkm/route';
import { prisma, temporary_users_gender, temporary_users_business_status } from '../lib/prisma';
import { sendEmail } from '../lib/mailer';
import { NextRequest } from 'next/server';

// Mock the dependencies
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  prisma: {
    users: {
      findFirst: jest.fn(),
    },
    temporary_users: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    $disconnect: jest.fn().mockResolvedValue(undefined),
  },
  temporary_users_gender: {
    Laki_laki: 'Laki_laki',
    Perempuan: 'Perempuan',
  },
  temporary_users_business_status: {
    BARU: 'BARU',
    SUDAH_LAMA: 'SUDAH_LAMA',
  },
}));

jest.mock('../lib/mailer', () => ({
  sendEmail: jest.fn(),
}));

// Mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('mock_verification_token'),
  }),
}));

describe('POST /api/auth/register/umkm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockValidRequest = {
    name: 'John Doe',
    username: 'johndoe',
    email: 'john@example.com',
    password: 'password123',
    gender: 'Laki-laki',
    phone_number: '08123456789',
  };

  const mockValidRequestWithBusiness = {
    ...mockValidRequest,
    business_name: 'Toko John',
    business_status: 'BARU',
    business_category_id: '1',
  };

  const createMockRequest = (body: Record<string, unknown>) => {
    return {
      json: jest.fn().mockResolvedValue(body),
    } as unknown as NextRequest;
  };

  it('should successfully register a new UMKM user with minimal data', async () => {
    (prisma.users.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.temporary_users.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.temporary_users.create as jest.Mock).mockResolvedValue({
      id: 1,
      ...mockValidRequest,
      level_id: 3,
      verificationToken: 'mock_verification_token',
      verificationTokenExpiry: expect.any(Date),
    });
    (sendEmail as jest.Mock).mockResolvedValue({ success: true });

    const request = createMockRequest(mockValidRequest);
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.message).toBe('User berhasil dibuat. Silakan cek email Anda untuk verifikasi.');
    expect(json.success).toBe(true);
    expect(sendEmail).toHaveBeenCalledWith({
      email: mockValidRequest.email,
      emailType: 'VERIFY',
      userId: 1,
    });
  });

  it('should successfully register a new UMKM user with business data', async () => {
    (prisma.users.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.temporary_users.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.temporary_users.create as jest.Mock).mockResolvedValue({
      id: 1,
      ...mockValidRequestWithBusiness,
      level_id: 3,
      verificationToken: 'mock_verification_token',
      verificationTokenExpiry: expect.any(Date),
    });
    (sendEmail as jest.Mock).mockResolvedValue({ success: true });

    const request = createMockRequest(mockValidRequestWithBusiness);
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.message).toBe('User berhasil dibuat. Silakan cek email Anda untuk verifikasi.');
    expect(json.success).toBe(true);
    expect(prisma.temporary_users.create).toHaveBeenCalledWith({
      data: {
        name: mockValidRequestWithBusiness.name,
        username: mockValidRequestWithBusiness.username,
        email: mockValidRequestWithBusiness.email,
        password: mockValidRequestWithBusiness.password,
        gender: temporary_users_gender.Laki_laki,
        phone_number: mockValidRequestWithBusiness.phone_number,
        level_id: 3,
        verificationToken: 'mock_verification_token',
        verificationTokenExpiry: expect.any(Date),
        business_name: mockValidRequestWithBusiness.business_name,
        business_status: temporary_users_business_status.BARU,
        business_category_id: 1,
      },
    });
  });

  it('should return 400 when required fields are missing', async () => {
    const invalidRequest = { ...mockValidRequest };
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (invalidRequest as Partial<typeof mockValidRequest>).name;

    const request = createMockRequest(invalidRequest);
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Semua field wajib diisi kecuali data usaha');
  });

  it('should return 400 when gender is invalid', async () => {
    const invalidRequest = { ...mockValidRequest, gender: 'InvalidGender' };

    const request = createMockRequest(invalidRequest);
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe("Jenis kelamin tidak valid. Harap gunakan 'Laki-laki' atau 'Perempuan'.");
  });

  it('should return 400 when business_status is invalid', async () => {
    const invalidRequest = { ...mockValidRequest, business_status: 'INVALID_STATUS' };

    const request = createMockRequest(invalidRequest);
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe("Status usaha tidak valid. Harap gunakan 'BARU' atau 'SUDAH_LAMA'.");
  });

  it('should return 409 when username already exists in users table', async () => {
    (prisma.users.findFirst as jest.Mock).mockResolvedValue({
      id: 1,
      username: mockValidRequest.username,
      email: 'other@example.com',
    });

    const request = createMockRequest(mockValidRequest);
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.message).toBe('Username atau Email sudah terdaftar');
  });

  it('should return 409 when email already exists in users table', async () => {
    (prisma.users.findFirst as jest.Mock).mockResolvedValue({
      id: 1,
      username: 'otheruser',
      email: mockValidRequest.email,
    });

    const request = createMockRequest(mockValidRequest);
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.message).toBe('Username atau Email sudah terdaftar');
  });

  it('should return 409 when username already exists in temporary_users table', async () => {
    (prisma.users.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.temporary_users.findFirst as jest.Mock).mockResolvedValue({
      id: 1,
      username: mockValidRequest.username,
      email: 'other@example.com',
    });

    const request = createMockRequest(mockValidRequest);
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.message).toBe('Username atau Email sudah digunakan dan menunggu verifikasi.');
  });

  it('should return 409 when email already exists in temporary_users table', async () => {
    (prisma.users.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.temporary_users.findFirst as jest.Mock).mockResolvedValue({
      id: 1,
      username: 'otheruser',
      email: mockValidRequest.email,
    });

    const request = createMockRequest(mockValidRequest);
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.message).toBe('Username atau Email sudah digunakan dan menunggu verifikasi.');
  });

  it('should handle Perempuan gender correctly', async () => {
    const femaleRequest = { ...mockValidRequest, gender: 'Perempuan' };
    
    (prisma.users.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.temporary_users.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.temporary_users.create as jest.Mock).mockResolvedValue({
      id: 1,
      ...femaleRequest,
      level_id: 3,
      verificationToken: 'mock_verification_token',
      verificationTokenExpiry: expect.any(Date),
    });
    (sendEmail as jest.Mock).mockResolvedValue({ success: true });

    const request = createMockRequest(femaleRequest);
    const response = await POST(request);
    await response.json();

    expect(response.status).toBe(201);
    expect(prisma.temporary_users.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        gender: temporary_users_gender.Perempuan,
      }),
    });
  });

  it('should handle SUDAH_LAMA business status correctly', async () => {
    const businessRequest = { ...mockValidRequest, business_status: 'SUDAH_LAMA' };
    
    (prisma.users.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.temporary_users.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.temporary_users.create as jest.Mock).mockResolvedValue({
      id: 1,
      ...businessRequest,
      level_id: 3,
      verificationToken: 'mock_verification_token',
      verificationTokenExpiry: expect.any(Date),
    });
    (sendEmail as jest.Mock).mockResolvedValue({ success: true });

    const request = createMockRequest(businessRequest);
    const response = await POST(request);
    await response.json();

    expect(response.status).toBe(201);
    expect(prisma.temporary_users.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        business_status: temporary_users_business_status.SUDAH_LAMA,
      }),
    });
  });

  it('should return 500 when database operation fails', async () => {
    (prisma.users.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = createMockRequest(mockValidRequest);
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Terjadi kesalahan pada server');
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

  it('should call prisma.$disconnect in finally block', async () => {
    (prisma.users.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.temporary_users.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.temporary_users.create as jest.Mock).mockResolvedValue({
      id: 1,
      ...mockValidRequest,
      level_id: 3,
    });
    (sendEmail as jest.Mock).mockResolvedValue({ success: true });

    const request = createMockRequest(mockValidRequest);
    await POST(request);

    expect(prisma.$disconnect).toHaveBeenCalled();
  });
});

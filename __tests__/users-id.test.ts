import { GET, PUT, DELETE } from '../app/api/users/[id]/route';
import prisma from '../lib/prisma';
import { authorizeRequest } from '../lib/auth/authorizeRequest';
import { NextRequest, NextResponse } from 'next/server';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    users: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('../lib/auth/authorizeRequest', () => ({
  authorizeRequest: jest.fn(),
}));

describe('GET /api/users/{id}', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a user by ID', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.users.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
    });

    const request = new NextRequest('http://localhost/api/users/1');
    const response = await GET(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('User fetched successfully');
    expect(json.data.id).toBe(1);
  });

  it('should return 400 for invalid ID format', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    const request = new NextRequest('http://localhost/api/users/abc');
    const response = await GET(request, { params: Promise.resolve({ id: NaN }) }); // Pass NaN to simulate invalid ID
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Invalid ID format');
  });

  it('should return 404 if user not found', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.users.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/users/999');
    const response = await GET(request, { params: Promise.resolve({ id: 999 }) });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.message).toBe('User not found');
  });

  it('should return 500 if fetching user fails', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.users.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/users/1');
    const response = await GET(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Failed to fetch user');
  });

  it('should return authorization error if request is not authorized', async () => {
    const mockErrorResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    (authorizeRequest as jest.Mock).mockResolvedValue([false, mockErrorResponse]);

    const request = new NextRequest('http://localhost/api/users/1');
    const response = await GET(request, { params: Promise.resolve({ id: 1 }) });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: 'Unauthorized' });
  });
});

describe('PUT /api/users/{id}', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update a user by ID', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.users.update as jest.Mock).mockResolvedValue({
      id: 1,
      username: 'updateduser',
      email: 'updated@example.com',
    });

    const request = new NextRequest('http://localhost/api/users/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'updateduser',
        email: 'updated@example.com',
      }),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('User updated successfully');
    expect(json.data.username).toBe('updateduser');
  });

  it('should return 400 for invalid ID', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    const request = new NextRequest('http://localhost/api/users/abc', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'updateduser',
      }),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: NaN }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Invalid ID');
  });

  it('should return 500 if updating user fails', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.users.update as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/users/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'updateduser',
      }),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Failed to update user');
  });

  it('should return authorization error if request is not authorized', async () => {
    const mockErrorResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    (authorizeRequest as jest.Mock).mockResolvedValue([false, mockErrorResponse]);

    const request = new NextRequest('http://localhost/api/users/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'updateduser',
      }),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 1 }) });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: 'Unauthorized' });
  });
});

describe('DELETE /api/users/{id}', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete a user by ID', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.users.delete as jest.Mock).mockResolvedValue({});

    const request = new NextRequest('http://localhost/api/users/1', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('User deleted successfully');
  });

  it('should return 500 if deleting user fails', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([true, null]);
    (prisma.users.delete as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/users/1', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 1 }) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Failed to delete user');
  });

  it('should return authorization error if request is not authorized', async () => {
    const mockErrorResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    (authorizeRequest as jest.Mock).mockResolvedValue([false, mockErrorResponse]);

    const request = new NextRequest('http://localhost/api/users/1', { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: 1 }) });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: 'Unauthorized' });
  });
});

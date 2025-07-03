import { GET } from '../app/api/users/[id]/articles/route';
import prisma from '../lib/prisma';
import { authorizeRequest } from '../lib/auth/authorizeRequest';
import { NextRequest } from 'next/server';

// Mock the dependencies
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    artikels: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../lib/auth/authorizeRequest', () => ({
  authorizeRequest: jest.fn(),
}));

describe('GET /api/users/[id]/articles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    id: 1,
    level_id: 3,
  };

  const mockArticles = [
    {
      id: 1,
      title: 'First Article',
      content: 'Content of first article',
      author_id: 1,
      created_at: new Date('2024-01-02T12:00:00.000Z'),
    },
    {
      id: 2,
      title: 'Second Article',
      content: 'Content of second article',
      author_id: 1,
      created_at: new Date('2024-01-01T12:00:00.000Z'),
    },
  ];

  const expectedArticles = [
    {
      id: 1,
      title: 'First Article',
      content: 'Content of first article',
      author_id: 1,
      created_at: '2024-01-02T12:00:00.000Z',
    },
    {
      id: 2,
      title: 'Second Article',
      content: 'Content of second article',
      author_id: 1,
      created_at: '2024-01-01T12:00:00.000Z',
    },
  ];

  const createMockRequest = () => {
    return {
      headers: {
        get: jest.fn().mockReturnValue('Bearer valid_token'),
      },
    } as unknown as NextRequest;
  };

  const createMockParams = (id: number) => {
    return Promise.resolve({ id });
  };

  it('should successfully fetch user articles when user accesses their own articles', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([mockUser, null]);
    (prisma.artikels.findMany as jest.Mock).mockResolvedValue(mockArticles);

    const request = createMockRequest();
    const params = createMockParams(1);

    const response = await GET(request, { params });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Articles for user 1 fetched successfully');
    expect(json.data).toEqual(expectedArticles);

    expect(authorizeRequest).toHaveBeenCalledWith(request, [1, 2, 3]);
    expect(prisma.artikels.findMany).toHaveBeenCalledWith({
      where: { author_id: 1 },
      orderBy: {
        created_at: 'desc',
      },
    });
  });

  it('should return empty array when user has no articles', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([mockUser, null]);
    (prisma.artikels.findMany as jest.Mock).mockResolvedValue([]);

    const request = createMockRequest();
    const params = createMockParams(1);

    const response = await GET(request, { params });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Articles for user 1 fetched successfully');
    expect(json.data).toEqual([]);
  });

  it('should return 401 when not authenticated', async () => {
    const errorResponse = {
      json: jest.fn().mockResolvedValue({ message: 'Unauthorized' }),
      status: 401,
    };
    (authorizeRequest as jest.Mock).mockResolvedValue([null, errorResponse]);

    const request = createMockRequest();
    const params = createMockParams(1);

    const response = await GET(request, { params });

    expect(response).toBe(errorResponse);
  });

  it('should return 403 when user tries to access another user articles', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([mockUser, null]);

    const request = createMockRequest();
    const params = createMockParams(2); // Different user ID

    const response = await GET(request, { params });
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.message).toBe('Forbidden: You can only access your own articles.');
  });

  it('should return 500 when database operation fails', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([mockUser, null]);
    const dbError = new Error('Database connection failed');
    (prisma.artikels.findMany as jest.Mock).mockRejectedValue(dbError);

    const request = createMockRequest();
    const params = createMockParams(1);

    const response = await GET(request, { params });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Failed to fetch articles');
    expect(json.error).toEqual({});
  });

  it('should order articles by created_at descending', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([mockUser, null]);
    (prisma.artikels.findMany as jest.Mock).mockResolvedValue(mockArticles);

    const request = createMockRequest();
    const params = createMockParams(1);

    await GET(request, { params });

    expect(prisma.artikels.findMany).toHaveBeenCalledWith({
      where: { author_id: 1 },
      orderBy: {
        created_at: 'desc',
      },
    });
  });

  it('should handle string user ID by converting to number', async () => {
    (authorizeRequest as jest.Mock).mockResolvedValue([mockUser, null]);
    (prisma.artikels.findMany as jest.Mock).mockResolvedValue(mockArticles);

    const request = createMockRequest();
    const params = Promise.resolve({ id: '1' as unknown as number }); // Simulate string ID

    const response = await GET(request, { params });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.artikels.findMany).toHaveBeenCalledWith({
      where: { author_id: 1 },
      orderBy: {
        created_at: 'desc',
      },
    });
  });

  it('should work correctly with different user IDs', async () => {
    const differentUser = { id: 5, level_id: 3 };
    (authorizeRequest as jest.Mock).mockResolvedValue([differentUser, null]);
    (prisma.artikels.findMany as jest.Mock).mockResolvedValue([]);

    const request = createMockRequest();
    const params = createMockParams(5);

    const response = await GET(request, { params });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Articles for user 5 fetched successfully');
    expect(prisma.artikels.findMany).toHaveBeenCalledWith({
      where: { author_id: 5 },
      orderBy: {
        created_at: 'desc',
      },
    });
  });

  it('should handle large number of articles', async () => {
    const largeArticleList = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      title: `Article ${i + 1}`,
      content: `Content ${i + 1}`,
      author_id: 1,
      created_at: new Date(),
    }));

    (authorizeRequest as jest.Mock).mockResolvedValue([mockUser, null]);
    (prisma.artikels.findMany as jest.Mock).mockResolvedValue(largeArticleList);

    const request = createMockRequest();
    const params = createMockParams(1);

    const response = await GET(request, { params });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toHaveLength(100);
  });

  it('should handle articles with various date formats', async () => {
    const articlesWithDifferentDates = [
      {
        id: 1,
        title: 'Recent Article',
        content: 'Recent content',
        author_id: 1,
        created_at: new Date('2024-12-01T12:00:00.000Z'),
      },
      {
        id: 2,
        title: 'Old Article',
        content: 'Old content',
        author_id: 1,
        created_at: new Date('2023-01-01T12:00:00.000Z'),
      },
    ];

    const expectedArticlesWithDifferentDates = [
      {
        id: 1,
        title: 'Recent Article',
        content: 'Recent content',
        author_id: 1,
        created_at: '2024-12-01T12:00:00.000Z',
      },
      {
        id: 2,
        title: 'Old Article',
        content: 'Old content',
        author_id: 1,
        created_at: '2023-01-01T12:00:00.000Z',
      },
    ];

    (authorizeRequest as jest.Mock).mockResolvedValue([mockUser, null]);
    (prisma.artikels.findMany as jest.Mock).mockResolvedValue(articlesWithDifferentDates);

    const request = createMockRequest();
    const params = createMockParams(1);

    const response = await GET(request, { params });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toEqual(expectedArticlesWithDifferentDates);
  });
});

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'API Ekraf Kuningan',
    version: '1.0.0',
    description: 'Comprehensive API documentation for Ekraf Kuningan application. Provides endpoints for user authentication, product management, article management, and administrative functions.',
    license: {
      name: 'MIT',
      url: 'https://spdx.org/licenses/MIT.html',
    },
    contact: {
      name: 'Tim Ekraf Kuningan',
      url: 'https://kuningankab.go.id',
      email: 'info@kuningankab.go.id',
    },
  },
  servers: [
    {
      url: 'http://localhost:4097',
      description: 'Development Server',
    },
    {
      url: 'https://ekraf.asepharyana.tech',
      description: 'Production Server',
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token untuk autentikasi. Format: Bearer <token>',
      },
    },
    schemas: {
      // ===== ERROR RESPONSES =====
      ErrorResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Error message describing what went wrong',
            example: 'Validation failed',
          },
          error: {
            type: 'string',
            description: 'Error type or code',
            example: 'BAD_REQUEST',
          },
          errors: {
            type: 'object',
            description: 'Detailed validation errors',
            additionalProperties: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            example: {
              email: ['Email is required'],
              password: ['Password must be at least 6 characters']
            }
          },
          statusCode: {
            type: 'integer',
            description: 'HTTP status code',
            example: 400,
          }
        },
        required: ['message'],
      },

      SuccessResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Success message',
            example: 'Operation completed successfully',
          },
          success: {
            type: 'boolean',
            description: 'Indicates successful operation',
            example: true,
          },
          data: {
            type: 'object',
            description: 'Response data (varies by endpoint)',
          },
          statusCode: {
            type: 'integer',
            description: 'HTTP status code',
            example: 200,
          }
        },
        required: ['message'],
      },

      // ===== AUTHENTICATION SCHEMAS =====
      LoginRequest: {
        type: 'object',
        required: ['usernameOrEmail', 'password'],
        properties: {
          usernameOrEmail: {
            type: 'string',
            description: 'Username or email address',
            example: 'dewani',
          },
          password: {
            type: 'string',
            format: 'password',
            description: 'User password',
            example: 'dewani123',
          },
        },
      },

      LoginResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Login berhasil',
          },
          token: {
            type: 'string',
            description: 'JWT authentication token',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          user: {
            $ref: '#/components/schemas/User',
          },
        },
        required: ['message', 'token', 'user'],
      },

      RegisterUMKMRequest: {
        type: 'object',
        required: ['name', 'username', 'email', 'password', 'gender', 'phone_number', 'business_name', 'business_status', 'business_category_id'],
        properties: {
          name: {
            type: 'string',
            maxLength: 255,
            description: 'Full name of the user',
            example: 'Dewani',
          },
          username: {
            type: 'string',
            maxLength: 45,
            description: 'Unique username for login',
            example: 'dewani',
          },
          email: {
            type: 'string',
            format: 'email',
            maxLength: 255,
            description: 'Email address',
            example: 'dewani@example.com',
          },
          password: {
            type: 'string',
            format: 'password',
            minLength: 6,
            description: 'Password (minimum 6 characters)',
            example: 'dewani123',
          },
          gender: {
            type: 'string',
            enum: ['Laki-laki', 'Perempuan'],
            description: 'Gender of the user',
            example: 'Perempuan',
          },
          phone_number: {
            type: 'string',
            maxLength: 20,
            description: 'Phone number',
            example: '081234567890',
          },
          business_name: {
            type: 'string',
            maxLength: 100,
            description: 'Name of the business',
            example: 'Dewani Creative',
          },
          business_status: {
            type: 'string',
            enum: ['BARU', 'SUDAH_LAMA'],
            description: 'Status of the business',
            example: 'BARU',
          },
          business_category_id: {
            type: 'integer',
            description: 'ID of business category',
            example: 1,
          },
        },
      },

      RegisterResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'User berhasil didaftarkan. Silakan cek email untuk verifikasi.',
          },
          user: {
            $ref: '#/components/schemas/TemporaryUser',
          },
        },
        required: ['message', 'user'],
      },

      ForgotPasswordRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'Email address for password reset',
            example: 'dewani@example.com',
          },
        },
      },

      ForgotPasswordResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Link reset password telah dikirim ke email Anda',
          },
        },
        required: ['message'],
      },

      ResetPasswordRequest: {
        type: 'object',
        required: ['token', 'password'],
        properties: {
          token: {
            type: 'string',
            description: 'Reset password token from email',
            example: 'reset-token-123',
          },
          password: {
            type: 'string',
            format: 'password',
            minLength: 6,
            description: 'New password',
            example: 'newpassword123',
          },
        },
      },

      ResetPasswordResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Password berhasil direset',
          },
        },
        required: ['message'],
      },

      VerifyEmailRequest: {
        type: 'object',
        required: ['token'],
        properties: {
          token: {
            type: 'string',
            description: 'Email verification token',
            example: 'verify-token-123',
          },
        },
      },

      VerifyEmailResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Email berhasil diverifikasi',
          },
          user: {
            $ref: '#/components/schemas/User',
          },
        },
        required: ['message', 'user'],
      },

      // ===== USER SCHEMAS =====
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique user ID (BigInt as string)',
            example: '2',
          },
          name: {
            type: 'string',
            maxLength: 255,
            description: 'Full name',
            example: 'Dewani',
          },
          username: {
            type: 'string',
            maxLength: 45,
            nullable: true,
            description: 'Username for login',
            example: 'dewani',
          },
          email: {
            type: 'string',
            format: 'email',
            maxLength: 255,
            description: 'Email address',
            example: 'dewani@example.com',
          },
          email_verified_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Email verification timestamp',
            example: '2025-07-05T10:00:00Z',
          },
          gender: {
            type: 'string',
            enum: ['Laki-laki', 'Perempuan'],
            nullable: true,
            description: 'Gender',
            example: 'Perempuan',
          },
          phone_number: {
            type: 'string',
            maxLength: 20,
            nullable: true,
            description: 'Phone number',
            example: '081234567890',
          },
          image: {
            type: 'string',
            maxLength: 255,
            nullable: true,
            description: 'Profile image URL',
            example: 'https://example.com/profile.jpg',
          },
          business_name: {
            type: 'string',
            maxLength: 100,
            nullable: true,
            description: 'Business name',
            example: 'Dewani Creative',
          },
          business_status: {
            type: 'string',
            enum: ['BARU', 'SUDAH_LAMA'],
            nullable: true,
            description: 'Business status',
            example: 'BARU',
          },
          level_id: {
            type: 'string',
            description: 'User level ID (1=SuperAdmin, 2=Admin, 3=UMKM)',
            example: '3',
          },
          business_category_id: {
            type: 'integer',
            nullable: true,
            description: 'Business category ID',
            example: 1,
          },
          two_factor_enabled: {
            type: 'boolean',
            description: 'Two-factor authentication enabled',
            example: false,
          },
          verifiedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Account verification timestamp',
            example: '2025-07-05T10:00:00Z',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Account creation timestamp',
            example: '2025-07-05T10:00:00Z',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Last update timestamp',
            example: '2025-07-05T10:00:00Z',
          },
          levels: {
            $ref: '#/components/schemas/Level',
          },
          business_categories: {
            allOf: [
              { $ref: '#/components/schemas/BusinessCategory' }
            ],
            nullable: true,
          },
        },
        required: ['id', 'name', 'email', 'level_id'],
      },
      UserProfile: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique user ID',
            example: '2',
          },
          name: {
            type: 'string',
            example: 'Dewani',
          },
          username: {
            type: 'string',
            nullable: true,
            example: 'dewani',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'dewani@example.com',
          },
          gender: {
            type: 'string',
            enum: ['Laki-laki', 'Perempuan'],
            nullable: true,
            example: 'Perempuan',
          },
          phone_number: {
            type: 'string',
            nullable: true,
            example: '081234567890',
          },
          image: {
            type: 'string',
            nullable: true,
            example: 'https://example.com/profile.jpg',
          },
          business_name: {
            type: 'string',
            nullable: true,
            example: 'Dewani Creative',
          },
          business_status: {
            type: 'string',
            enum: ['BARU', 'SUDAH_LAMA'],
            nullable: true,
            example: 'BARU',
          },
          level_id: {
            type: 'string',
            example: '3',
          },
          business_category_id: {
            type: 'integer',
            nullable: true,
            example: 1,
          },
          levels: {
            $ref: '#/components/schemas/Level',
          },
          business_categories: {
            allOf: [
              { $ref: '#/components/schemas/BusinessCategory' }
            ],
            nullable: true,
          },
        },
        required: ['id', 'name', 'email', 'level_id'],
      },

      UserListResponse: {
        type: 'object',
        properties: {
          users: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/User',
            },
          },
          total: {
            type: 'integer',
            description: 'Total number of users',
            example: 100,
          },
          page: {
            type: 'integer',
            description: 'Current page number',
            example: 1,
          },
          limit: {
            type: 'integer',
            description: 'Number of items per page',
            example: 10,
          },
        },
        required: ['users'],
      },

      // ===== PRODUCT SCHEMAS =====
      Product: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Unique product ID',
            example: 1,
          },
          name: {
            type: 'string',
            maxLength: 50,
            description: 'Product name',
            example: 'Kerajinan Batik',
          },
          owner_name: {
            type: 'string',
            maxLength: 35,
            nullable: true,
            description: 'Product owner name',
            example: 'John Doe',
          },
          description: {
            type: 'string',
            maxLength: 500,
            description: 'Product description',
            example: 'Kerajinan batik berkualitas tinggi dengan motif tradisional',
          },
          price: {
            type: 'number',
            format: 'float',
            description: 'Product price',
            example: 150000,
          },
          stock: {
            type: 'integer',
            description: 'Product stock quantity',
            example: 10,
          },
          image: {
            type: 'string',
            maxLength: 255,
            description: 'Product image URL',
            example: 'https://example.com/product.jpg',
          },
          phone_number: {
            type: 'string',
            maxLength: 12,
            description: 'Seller phone number',
            example: '081234567890',
          },
          status: {
            type: 'string',
            enum: ['disetujui', 'pending', 'ditolak', 'tidak_aktif'],
            description: 'Product approval status',
            default: 'pending',
            example: 'pending',
          },
          status_produk: {
            type: 'string',
            enum: ['disetujui', 'pending', 'ditolak', 'tidak_aktif'],
            description: 'Product status',
            default: 'pending',
            example: 'pending',
          },
          uploaded_at: {
            type: 'string',
            format: 'date-time',
            description: 'Upload timestamp',
            example: '2025-07-05T10:00:00Z',
          },
          user_id: {
            type: 'string',
            nullable: true,
            description: 'Owner user ID',
            example: '2',
          },
          business_category_id: {
            type: 'integer',
            nullable: true,
            description: 'Business category ID',
            example: 1,
          },
          sub_sector_id: {
            type: 'string',
            nullable: true,
            description: 'Sub sector ID',
            example: '1',
          },
          business_categories: {
            allOf: [
              { $ref: '#/components/schemas/BusinessCategory' }
            ],
            nullable: true,
          },
          users: {
            allOf: [
              { $ref: '#/components/schemas/User' }
            ],
            nullable: true,
          },
          sub_sectors: {
            allOf: [
              { $ref: '#/components/schemas/SubSector' }
            ],
            nullable: true,
          },
          online_store_links: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/OnlineStoreLink',
            },
            description: 'Online store links',
          },
        },
        required: ['name', 'description', 'price', 'stock', 'image', 'phone_number'],
      },

      ProductCreateRequest: {
        type: 'object',
        required: ['name', 'description', 'price', 'stock', 'image', 'phone_number'],
        properties: {
          name: {
            type: 'string',
            maxLength: 50,
            description: 'Product name',
            example: 'Kerajinan Batik',
          },
          owner_name: {
            type: 'string',
            maxLength: 35,
            description: 'Product owner name',
            example: 'John Doe',
          },
          description: {
            type: 'string',
            maxLength: 500,
            description: 'Product description',
            example: 'Kerajinan batik berkualitas tinggi',
          },
          price: {
            type: 'number',
            format: 'float',
            description: 'Product price',
            example: 150000,
          },
          stock: {
            type: 'integer',
            description: 'Product stock quantity',
            example: 10,
          },
          image: {
            type: 'string',
            maxLength: 255,
            description: 'Product image URL',
            example: 'https://example.com/product.jpg',
          },
          phone_number: {
            type: 'string',
            maxLength: 12,
            description: 'Seller phone number',
            example: '081234567890',
          },
          business_category_id: {
            type: 'integer',
            description: 'Business category ID',
            example: 1,
          },
          sub_sector_id: {
            type: 'string',
            description: 'Sub sector ID',
            example: '1',
          },
        },
      },

      ProductListResponse: {
        type: 'object',
        properties: {
          products: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Product',
            },
          },
          total: {
            type: 'integer',
            description: 'Total number of products',
            example: 50,
          },
          page: {
            type: 'integer',
            description: 'Current page number',
            example: 1,
          },
          limit: {
            type: 'integer',
            description: 'Number of items per page',
            example: 10,
          },
        },
        required: ['products'],
      },

      // ===== ARTICLE SCHEMAS =====
      Article: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique article ID',
            example: '1',
          },
          author_id: {
            type: 'string',
            description: 'Author user ID',
            example: '1',
          },
          artikel_kategori_id: {
            type: 'string',
            description: 'Article category ID',
            example: '1',
          },
          title: {
            type: 'string',
            maxLength: 255,
            description: 'Article title',
            example: 'Tips Berbisnis UMKM',
          },
          slug: {
            type: 'string',
            maxLength: 255,
            description: 'Article slug for URL',
            example: 'tips-berbisnis-umkm',
          },
          thumbnail: {
            type: 'string',
            maxLength: 255,
            description: 'Article thumbnail URL',
            example: 'https://example.com/thumbnail.jpg',
          },
          content: {
            type: 'string',
            description: 'Article content',
            example: 'Isi artikel yang panjang tentang tips berbisnis UMKM...',
          },
          is_featured: {
            type: 'boolean',
            description: 'Featured article flag',
            default: false,
            example: false,
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Creation timestamp',
            example: '2025-07-05T10:00:00Z',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Update timestamp',
            example: '2025-07-05T10:00:00Z',
          },
          users: {
            allOf: [
              { $ref: '#/components/schemas/User' }
            ],
            description: 'Article author',
          },
        },
        required: ['author_id', 'artikel_kategori_id', 'title', 'slug', 'thumbnail', 'content'],
      },

      ArticleCreateRequest: {
        type: 'object',
        required: ['artikel_kategori_id', 'title', 'thumbnail', 'content'],
        properties: {
          artikel_kategori_id: {
            type: 'string',
            description: 'Article category ID',
            example: '1',
          },
          title: {
            type: 'string',
            maxLength: 255,
            description: 'Article title',
            example: 'Tips Berbisnis UMKM',
          },
          thumbnail: {
            type: 'string',
            maxLength: 255,
            description: 'Article thumbnail URL',
            example: 'https://example.com/thumbnail.jpg',
          },
          content: {
            type: 'string',
            description: 'Article content',
            example: 'Isi artikel yang panjang...',
          },
          is_featured: {
            type: 'boolean',
            description: 'Featured article flag',
            default: false,
            example: false,
          },
        },
      },

      ArticleListResponse: {
        type: 'object',
        properties: {
          articles: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Article',
            },
          },
          total: {
            type: 'integer',
            description: 'Total number of articles',
            example: 25,
          },
          page: {
            type: 'integer',
            description: 'Current page number',
            example: 1,
          },
          limit: {
            type: 'integer',
            description: 'Number of items per page',
            example: 10,
          },
        },
        required: ['articles'],
      },

      // ===== BUSINESS CATEGORY SCHEMAS =====
      BusinessCategory: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Unique business category ID',
            example: 1,
          },
          name: {
            type: 'string',
            maxLength: 50,
            description: 'Business category name',
            example: 'Makanan dan Minuman',
          },
          image: {
            type: 'string',
            maxLength: 255,
            nullable: true,
            description: 'Business category image URL',
            example: 'https://example.com/category.jpg',
          },
          sub_sector_id: {
            type: 'string',
            description: 'Sub sector ID',
            example: '1',
          },
          description: {
            type: 'string',
            nullable: true,
            description: 'Business category description',
            example: 'Kategori untuk usaha makanan dan minuman',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Creation timestamp',
            example: '2025-07-05T10:00:00Z',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Update timestamp',
            example: '2025-07-05T10:00:00Z',
          },
          sub_sectors: {
            $ref: '#/components/schemas/SubSector',
          },
        },
        required: ['id', 'name', 'sub_sector_id'],
      },

      BusinessCategoryListResponse: {
        type: 'object',
        properties: {
          business_categories: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/BusinessCategory',
            },
          },
          total: {
            type: 'integer',
            description: 'Total number of business categories',
            example: 15,
          },
        },
        required: ['business_categories'],
      },

      // ===== SUB SECTOR SCHEMAS =====
      SubSector: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique sub sector ID',
            example: '1',
          },
          title: {
            type: 'string',
            maxLength: 255,
            description: 'Sub sector title',
            example: 'Kerajinan Tangan',
          },
          slug: {
            type: 'string',
            maxLength: 255,
            description: 'Sub sector slug for URL',
            example: 'kerajinan-tangan',
          },
          image: {
            type: 'string',
            maxLength: 255,
            nullable: true,
            description: 'Sub sector image URL',
            example: 'https://example.com/subsector.jpg',
          },
          description: {
            type: 'string',
            nullable: true,
            description: 'Sub sector description',
            example: 'Sub sektor untuk kerajinan tangan tradisional',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Creation timestamp',
            example: '2025-07-05T10:00:00Z',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Update timestamp',
            example: '2025-07-05T10:00:00Z',
          },
        },
        required: ['id', 'title', 'slug'],
      },

      SubSectorListResponse: {
        type: 'object',
        properties: {
          sub_sectors: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/SubSector',
            },
          },
          total: {
            type: 'integer',
            description: 'Total number of sub sectors',
            example: 8,
          },
        },
        required: ['sub_sectors'],
      },

      // ===== LEVEL SCHEMAS =====
      Level: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique level ID',
            example: '1',
          },
          name: {
            type: 'string',
            maxLength: 255,
            description: 'Level name',
            example: 'SuperAdmin',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Creation timestamp',
            example: '2025-07-05T10:00:00Z',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Update timestamp',
            example: '2025-07-05T10:00:00Z',
          },
        },
        required: ['id', 'name'],
      },

      LevelListResponse: {
        type: 'object',
        properties: {
          levels: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Level',
            },
          },
          total: {
            type: 'integer',
            description: 'Total number of levels',
            example: 3,
          },
        },
        required: ['levels'],
      },

      // ===== ONLINE STORE LINK SCHEMAS =====
      OnlineStoreLink: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Unique online store link ID',
            example: 1,
          },
          product_id: {
            type: 'integer',
            description: 'Related product ID',
            example: 1,
          },
          platform_name: {
            type: 'string',
            maxLength: 50,
            nullable: true,
            description: 'Platform name',
            example: 'Shopee',
          },
          url: {
            type: 'string',
            description: 'Product URL on platform',
            example: 'https://shopee.co.id/product/123',
          },
        },
        required: ['product_id', 'url'],
      },

      OnlineStoreLinkCreateRequest: {
        type: 'object',
        required: ['url'],
        properties: {
          platform_name: {
            type: 'string',
            maxLength: 50,
            description: 'Platform name',
            example: 'Shopee',
          },
          url: {
            type: 'string',
            description: 'Product URL on platform',
            example: 'https://shopee.co.id/product/123',
          },
        },
      },

      // ===== TEMPORARY USER SCHEMAS =====
      TemporaryUser: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Unique temporary user ID',
            example: 1,
          },
          name: {
            type: 'string',
            maxLength: 35,
            description: 'Full name',
            example: 'Dewani',
          },
          username: {
            type: 'string',
            maxLength: 45,
            description: 'Username',
            example: 'dewani',
          },
          email: {
            type: 'string',
            format: 'email',
            maxLength: 100,
            description: 'Email address',
            example: 'dewani@example.com',
          },
          gender: {
            type: 'string',
            enum: ['Laki-laki', 'Perempuan'],
            description: 'Gender',
            example: 'Perempuan',
          },
          phone_number: {
            type: 'string',
            maxLength: 20,
            nullable: true,
            description: 'Phone number',
            example: '081234567890',
          },
          business_name: {
            type: 'string',
            maxLength: 100,
            nullable: true,
            description: 'Business name',
            example: 'Dewani Creative',
          },
          business_status: {
            type: 'string',
            enum: ['BARU', 'SUDAH_LAMA'],
            nullable: true,
            description: 'Business status',
            example: 'BARU',
          },
          level_id: {
            type: 'string',
            description: 'Level ID',
            example: '3',
          },
          business_category_id: {
            type: 'integer',
            nullable: true,
            description: 'Business category ID',
            example: 1,
          },
          verificationToken: {
            type: 'string',
            maxLength: 255,
            description: 'Email verification token',
            example: 'verify-token-123',
          },
          verificationTokenExpiry: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Verification token expiry',
            example: '2025-07-05T10:00:00Z',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
            example: '2025-07-05T10:00:00Z',
          },
          levels: {
            $ref: '#/components/schemas/Level',
          },
          business_categories: {
            allOf: [
              { $ref: '#/components/schemas/BusinessCategory' }
            ],
            nullable: true,
          },
        },
        required: ['id', 'name', 'username', 'email', 'gender', 'level_id', 'verificationToken'],
      },
      // ===== PAGINATION SCHEMAS =====
      PaginationMeta: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            description: 'Current page number',
            example: 1,
          },
          limit: {
            type: 'integer',
            description: 'Number of items per page',
            example: 10,
          },
          total: {
            type: 'integer',
            description: 'Total number of items',
            example: 100,
          },
          totalPages: {
            type: 'integer',
            description: 'Total number of pages',
            example: 10,
          },
          hasNext: {
            type: 'boolean',
            description: 'Has next page',
            example: true,
          },
          hasPrev: {
            type: 'boolean',
            description: 'Has previous page',
            example: false,
          },
        },
        required: ['page', 'limit', 'total'],
      },

      // ===== VALIDATION SCHEMAS =====
      ValidationError: {
        type: 'object',
        properties: {
          field: {
            type: 'string',
            description: 'Field name with validation error',
            example: 'email',
          },
          message: {
            type: 'string',
            description: 'Validation error message',
            example: 'Email format is invalid',
          },
          code: {
            type: 'string',
            description: 'Validation error code',
            example: 'invalid_email',
          },
        },
        required: ['field', 'message'],
      },

      // ===== AUTHORIZATION SCHEMAS =====
      UnauthorizedError: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Unauthorized access',
          },
          error: {
            type: 'string',
            example: 'UNAUTHORIZED',
          },
          statusCode: {
            type: 'integer',
            example: 401,
          },
        },
        required: ['message', 'error', 'statusCode'],
      },

      ForbiddenError: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Insufficient permissions',
          },
          error: {
            type: 'string',
            example: 'FORBIDDEN',
          },
          statusCode: {
            type: 'integer',
            example: 403,
          },
        },
        required: ['message', 'error', 'statusCode'],
      },

      NotFoundError: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Resource not found',
          },
          error: {
            type: 'string',
            example: 'NOT_FOUND',
          },
          statusCode: {
            type: 'integer',
            example: 404,
          },
        },
        required: ['message', 'error', 'statusCode'],
      },

      // ===== MASTER DATA SCHEMAS =====
      MasterDataResponse: {
        type: 'object',
        properties: {
          business_categories: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/BusinessCategory',
            },
          },
          levels: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Level',
            },
          },
          sub_sectors: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/SubSector',
            },
          },
        },
        required: ['business_categories', 'levels', 'sub_sectors'],
      },

      // ===== STATISTICS SCHEMAS =====
      StatisticsResponse: {
        type: 'object',
        properties: {
          total_users: {
            type: 'integer',
            description: 'Total number of users',
            example: 150,
          },
          total_products: {
            type: 'integer',
            description: 'Total number of products',
            example: 75,
          },
          total_articles: {
            type: 'integer',
            description: 'Total number of articles',
            example: 25,
          },
          total_umkm: {
            type: 'integer',
            description: 'Total number of UMKM users',
            example: 140,
          },
          total_admin: {
            type: 'integer',
            description: 'Total number of admin users',
            example: 5,
          },
          total_superadmin: {
            type: 'integer',
            description: 'Total number of superadmin users',
            example: 1,
          },
          products_by_status: {
            type: 'object',
            properties: {
              disetujui: {
                type: 'integer',
                example: 40,
              },
              pending: {
                type: 'integer',
                example: 25,
              },
              ditolak: {
                type: 'integer',
                example: 5,
              },
              tidak_aktif: {
                type: 'integer',
                example: 5,
              },
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

export default swaggerDefinition;
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'API Ekraf Kuningan', // Ganti dengan judul API Anda
    version: '1.0.0',
    description:
      'Dokumentasi API untuk aplikasi Ekraf Kuningan. Ini menyediakan endpoint untuk login, data pengguna, dan lainnya.', // Ganti dengan deskripsi API Anda
    license: {
      name: 'MIT', // Sesuaikan jika perlu
      url: 'https://spdx.org/licenses/MIT.html',
    },
    contact: {
      name: 'Tim Ekraf Kuningan', // Ganti dengan kontak Anda
      url: 'https://kuningankab.go.id',
      email: 'info@kuningankab.go.id',
    },
  },
  servers: [
    {
      url: 'http://localhost:4097/',
      description: 'Server Development',
    },
    {
      url: 'https://ekraf.asepharyana.tech/',
      description: 'Server Produksi',
    }
  ],
  components: {
    schemas: {
      // Skema Umum
      ErrorResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Pesan detail mengenai kesalahan.',
            example: 'Terjadi kesalahan pada server.',
          },
        },
      },
      // Skema untuk User (users table)
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            format: 'int64',
            description: 'ID unik pengguna.',
            example: 1,
          },
          name: {
            type: 'string',
            description: 'Nama lengkap pengguna.',
            maxLength: 255,
            example: 'EKRAF',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Alamat email pengguna.',
            maxLength: 255,
            example: 'kuningankreatifgaleri@gmail.com',
          },
          email_verified_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Waktu verifikasi email.',
          },
          username: {
            type: 'string',
            nullable: true,
            description: 'Username unik untuk login.',
            maxLength: 45,
            example: 'ekrafkng',
          },
          gender: {
            type: 'string',
            enum: ['Laki-laki', 'Perempuan'],
            nullable: true,
            description: 'Jenis kelamin pengguna.',
            example: 'Laki-laki',
          },
          phone_number: {
            type: 'string',
            nullable: true,
            description: 'Nomor handphone pengguna.',
            maxLength: 20,
            example: '081234567890',
          },
          image: {
            type: 'string',
            nullable: true,
            description: 'URL gambar profil pengguna.',
            maxLength: 255,
          },
          business_name: {
            type: 'string',
            nullable: true,
            description: 'Nama usaha pengguna.',
            maxLength: 100,
            example: 'Toko EKRAF',
          },
          business_status: {
            type: 'string',
            enum: ['BARU', 'SUDAH_LAMA'],
            nullable: true,
            description: 'Status usaha pengguna.',
            example: 'BARU',
          },
          level_id: {
            type: 'integer',
            format: 'int64',
            description: 'ID level pengguna.',
            default: 3,
            example: 3,
          },
          business_category_id: {
            type: 'integer',
            nullable: true,
            description: 'ID kategori bisnis pengguna.',
            example: 1,
          },
          verifiedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Waktu verifikasi akun.',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Waktu pembuatan akun.',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Waktu pembaruan akun.',
          },
        },
        required: ['name', 'email', 'level_id'],
      },
      // Skema untuk API Login
      LoginRequest: {
        type: 'object',
        required: ['usernameOrEmail', 'password'],
        properties: {
          usernameOrEmail: {
            type: 'string',
            description: 'Username atau email pengguna untuk login.',
            example: 'ekrafkng',
          },
          password: {
            type: 'string',
            format: 'password',
            description: 'Password pengguna.',
            example: 'passwordrahasia',
          },
        },
      },
      LoginSuccessResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Login berhasil',
          },
          token: {
            type: 'string',
            description: 'Token JWT untuk otentikasi.',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91c2VyIjoxLCJ1c2VybmFtZSI6ImVrcmFma25nIiwiaWF0IjoxNjI4NjYxNjAwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
          },
          user: {
            $ref: '#/components/schemas/User',
          },
        },
      },
      // Skema untuk API Data Saya (Protected)
      InfoPenggunaProtected: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1,
          },
          username: {
            type: 'string',
            example: 'ekrafkng',
          },
          level: {
            type: 'integer',
            example: 1,
          },
          email: {
            type: 'string',
            format: 'email',
            nullable: true,
            example: 'kuningankreatifgaleri@gmail.com',
          },
        },
      },
      DataContoh: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
          },
          deskripsi: {
            type: 'string',
          },
        },
        example: {
          id: 1,
          deskripsi: "Informasi rahasia A",
        },
      },
      ProtectedDataResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: "Halo ekrafkng! Ini adalah data Anda yang dilindungi.",
          },
          infoPengguna: {
            $ref: '#/components/schemas/InfoPenggunaProtected',
          },
          dataContohLain: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/DataContoh',
            },
          },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'ID unik produk',
            example: 1,
          },
          name: {
            type: 'string',
            description: 'Nama produk',
            maxLength: 50,
            example: 'Kerajinan Batik',
          },
          owner_name: {
            type: 'string',
            nullable: true,
            description: 'Nama pemilik produk',
            maxLength: 35,
            example: 'John Doe',
          },
          description: {
            type: 'string',
            description: 'Deskripsi produk',
            maxLength: 500,
            example: 'Kerajinan batik berkualitas tinggi',
          },
          price: {
            type: 'number',
            format: 'float',
            description: 'Harga produk',
            example: 150000,
          },
          stock: {
            type: 'integer',
            description: 'Stok produk',
            example: 10,
          },
          image: {
            type: 'string',
            description: 'URL gambar produk',
            maxLength: 255,
            example: 'https://example.com/image.jpg',
          },
          phone_number: {
            type: 'string',
            description: 'Nomor telepon penjual',
            maxLength: 12,
            example: '081234567890',
          },
          uploaded_at: {
            type: 'string',
            format: 'date-time',
            description: 'Waktu upload produk',
          },
          user_id: {
            type: 'integer',
            format: 'int64',
            nullable: true,
            description: 'ID user pemilik produk',
            example: 1,
          },
          business_category_id: {
            type: 'integer',
            nullable: true,
            description: 'ID kategori bisnis',
            example: 1,
          },
          status: {
            type: 'string',
            enum: ['disetujui', 'pending', 'ditolak', 'tidak aktif'],
            description: 'Status persetujuan produk',
            default: 'pending',
            example: 'pending',
          },
          status_produk: {
            type: 'string',
            enum: ['disetujui', 'pending', 'ditolak', 'tidak_aktif'],
            description: 'Status produk',
            default: 'pending',
            example: 'pending',
          },
          business_categories: {
            allOf: [
              { $ref: '#/components/schemas/BusinessCategory' }
            ],
            nullable: true,
            description: 'Data kategori bisnis terkait',
          },
          users: {
            allOf: [
              { $ref: '#/components/schemas/User' }
            ],
            nullable: true,
            description: 'Data user pemilik produk',
          },
          online_store_links: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/TblOlshopLink'
            },
            description: 'Daftar link toko online',
          },
        },
        required: ['name', 'description', 'price', 'stock', 'image', 'phone_number'],
      },
      Article: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            format: 'int64',
            description: 'ID unik artikel',
            example: 1,
          },
          author_id: {
            type: 'integer',
            format: 'int64',
            description: 'ID penulis artikel',
            example: 1,
          },
          artikel_kategori_id: {
            type: 'integer',
            format: 'int64',
            description: 'ID kategori artikel',
            example: 1,
          },
          title: {
            type: 'string',
            description: 'Judul artikel',
            maxLength: 255,
            example: 'Tips Berbisnis UMKM',
          },
          slug: {
            type: 'string',
            description: 'Slug artikel untuk URL',
            maxLength: 255,
            example: 'tips-berbisnis-umkm',
          },
          thumbnail: {
            type: 'string',
            description: 'URL gambar thumbnail artikel',
            maxLength: 255,
            example: 'https://example.com/thumbnail.jpg',
          },
          content: {
            type: 'string',
            description: 'Konten artikel',
            example: 'Isi artikel yang panjang...',
          },
          is_featured: {
            type: 'boolean',
            description: 'Apakah artikel ditampilkan sebagai featured',
            default: false,
            example: false,
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Waktu pembuatan artikel',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Waktu pembaruan artikel',
          },
          users: {
            allOf: [
              { $ref: '#/components/schemas/User' }
            ],
            description: 'Data penulis artikel',
          },
        },
        required: ['author_id', 'artikel_kategori_id', 'title', 'slug', 'thumbnail', 'content'],
      },
      Subsector: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            format: 'int64',
            description: 'ID unik sub sektor',
            example: 1,
          },
          title: {
            type: 'string',
            description: 'Judul sub sektor',
            maxLength: 255,
            example: 'Kerajinan Tangan',
          },
          slug: {
            type: 'string',
            description: 'Slug sub sektor untuk URL',
            maxLength: 255,
            example: 'kerajinan-tangan',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Waktu pembuatan sub sektor',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Waktu pembaruan sub sektor',
          },
        },
        required: ['title', 'slug'],
      },
      BusinessCategory: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'ID unik kategori bisnis',
            example: 1,
          },
          name: {
            type: 'string',
            description: 'Nama kategori bisnis',
            maxLength: 50,
            example: 'Makanan dan Minuman',
          },
          image: {
            type: 'string',
            nullable: true,
            description: 'URL gambar kategori bisnis',
            maxLength: 255,
            example: 'https://example.com/category.jpg',
          },
        },
        required: ['name'],
      },
      Level: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            format: 'int64',
            description: 'ID unik level user',
            example: 1,
          },
          name: {
            type: 'string',
            description: 'Nama level user',
            maxLength: 255,
            example: 'Admin',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Waktu pembuatan level',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Waktu pembaruan level',
          },
        },
        required: ['name'],
      },
      KategoriUsaha: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'ID unik kategori usaha',
            example: 1,
          },
          name: {
            type: 'string',
            description: 'Nama kategori usaha',
            minLength: 3,
            example: 'Makanan dan Minuman',
          },
          image: {
            type: 'string',
            nullable: true,
            description: 'URL gambar kategori usaha',
            example: 'https://example.com/image.jpg',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Waktu pembuatan kategori usaha',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'Waktu pembaruan kategori usaha',
          },
        },
        required: ['name'],
      },
      TblOlshopLink: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'ID unik link toko online',
            example: 1,
          },
          product_id: {
            type: 'integer',
            description: 'ID produk yang terkait',
            example: 1,
          },
          platform_name: {
            type: 'string',
            nullable: true,
            description: 'Nama platform toko online',
            maxLength: 50,
            example: 'Shopee',
          },
          url: {
            type: 'string',
            description: 'URL link ke produk di toko online',
            example: 'https://shopee.co.id/product/123',
          },
        },
        required: ['product_id', 'url'],
      },
      TemporaryUser: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'ID unik temporary user',
            example: 1,
          },
          name: {
            type: 'string',
            description: 'Nama lengkap pengguna',
            maxLength: 35,
            example: 'John Doe',
          },
          username: {
            type: 'string',
            description: 'Username unik',
            maxLength: 45,
            example: 'johndoe',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Alamat email',
            maxLength: 100,
            example: 'john@example.com',
          },
          gender: {
            type: 'string',
            enum: ['Laki-laki', 'Perempuan'],
            description: 'Jenis kelamin',
            example: 'Laki-laki',
          },
          phone_number: {
            type: 'string',
            nullable: true,
            description: 'Nomor handphone',
            maxLength: 20,
            example: '081234567890',
          },
          business_name: {
            type: 'string',
            nullable: true,
            description: 'Nama usaha',
            maxLength: 100,
            example: 'Toko ABC',
          },
          business_status: {
            type: 'string',
            enum: ['BARU', 'SUDAH_LAMA'],
            nullable: true,
            description: 'Status usaha',
            example: 'BARU',
          },
          level_id: {
            type: 'integer',
            format: 'int64',
            description: 'ID level user',
            example: 3,
          },
          business_category_id: {
            type: 'integer',
            nullable: true,
            description: 'ID kategori bisnis',
            example: 1,
          },
          verificationToken: {
            type: 'string',
            description: 'Token verifikasi email',
            maxLength: 255,
          },
          verificationTokenExpiry: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Waktu kedaluwarsa token verifikasi',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Waktu pembuatan akun temporary',
          },
        },
        required: ['name', 'username', 'email', 'password', 'gender', 'level_id', 'verificationToken'],
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: "Masukkan token JWT dengan prefix 'Bearer '. Contoh: 'Bearer abcde12345'",
      },
    },
  },
};

export default swaggerDefinition;
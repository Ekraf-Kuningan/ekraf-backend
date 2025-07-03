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
      // Skema untuk User (tbl_user)
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'ID unik pengguna.',
            example: 1,
          },
          level_id: {
            type: 'integer',
            description: 'ID level pengguna.',
            example: 1,
          },
          name: {
            type: 'string',
            nullable: true,
            description: 'Nama lengkap pengguna.',
            example: 'EKRAF',
          },
          gender: {
            type: 'string',
            enum: ['Laki-laki', 'Perempuan'],
            example: 'Laki-laki',
          },
          phone_number: {
            type: 'string',
            nullable: true,
            description: 'Nomor handphone pengguna.',
            example: '081234567890',
          },
          username: {
            type: 'string',
            description: 'Username unik untuk login.',
            example: 'ekrafkng',
          },
          email: {
            type: 'string',
            format: 'email',
            nullable: true,
            description: 'Alamat email pengguna.',
            example: 'kuningankreatifgaleri@gmail.com',
          },
          business_name: {
            type: 'string',
            nullable: true,
            description: 'Nama usaha pengguna.',
            example: 'Toko EKRAF',
          },
          business_status: {
            type: 'string',
            enum: ['BARU', 'SUDAH_LAMA'],
            nullable: true,
            description: 'Status usaha pengguna.',
            example: 'BARU',
          },
        },
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
          },
          name: {
            type: 'string',
          },
          owner_name: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          price: {
            type: 'number',
          },
          stock: {
            type: 'integer',
          },
          phone_number: {
            type: 'string',
          },
          business_category_id: {
            type: 'integer',
          },
          image: {
            type: 'string',
          },
          user_id: {
            type: 'integer',
          },
          business_categories: {
            type: 'object',
          },
          users: {
            type: 'object',
          },
          online_store_links: {
            type: 'array',
            items: {
              type: 'object',
            },
          },
        },
        required: [],
      },
      Article: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
          },
          title: {
            type: 'string',
          },
          content: {
            type: 'string',
          },
          thumbnail: {
            type: 'string',
          },
          users: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
              email: {
                type: 'string',
              },
            },
          },
        },
      },
      Subsector: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
          },
          title: {
            type: 'string',
          },
        },
      },
      BusinessCategory: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
          },
          name: {
            type: 'string',
          },
          image: {
            type: 'string',
            nullable: true,
          },
        },
      },
      Level: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
          },
          name: {
            type: 'string',
          },
        },
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
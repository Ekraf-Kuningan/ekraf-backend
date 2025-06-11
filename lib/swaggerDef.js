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
      url: 'https://kuningankab.go.id', // Ganti dengan URL Anda
      email: 'info@kuningankab.go.id', // Ganti dengan email Anda
    },
  },
  servers: [
    {
      url: 'http://localhost:3000/', // Sesuaikan dengan URL base API Anda saat development
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
          id_user: {
            type: 'integer',
            description: 'ID unik pengguna.',
            example: 1,
          },
          id_level: {
            type: 'integer',
            description: 'ID level pengguna.',
            example: 1,
          },
          nama_user: {
            type: 'string',
            nullable: true,
            description: 'Nama lengkap pengguna.',
            example: 'EKRAF',
          },
          jk: {
            type: 'string',
            enum: ['Laki-laki', 'Perempuan'], // Sesuai enum tbl_user_jk
            description: 'Jenis kelamin pengguna.',
            example: 'Laki-laki',
          },
          nohp: {
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
          // Password tidak disertakan dalam respons API biasanya
          email: {
            type: 'string',
            format: 'email',
            nullable: true,
            description: 'Alamat email pengguna.',
            example: 'kuningankreatifgaleri@gmail.com',
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
            $ref: '#/components/schemas/User', // Menggunakan referensi ke skema User
          },
        },
      },
      // Skema untuk API Data Saya (Protected)
      InfoPenggunaProtected: { // Mirip User, tapi mungkin ada sedikit perbedaan dalam konteks ini
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
    },
    securitySchemes: {
      bearerAuth: { // Nama skema keamanan, bisa apa saja
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT', // Opsional, informasi tambahan tentang format token
        description: "Masukkan token JWT dengan prefix 'Bearer '. Contoh: 'Bearer abcde12345'",
      },
    },
  },
  // security bisa didefinisikan secara global atau per-operasi
  // security: [
  //   {
  //     bearerAuth: [], // Menggunakan skema keamanan 'bearerAuth' secara global
  //   },
  // ],
};

export default swaggerDefinition;

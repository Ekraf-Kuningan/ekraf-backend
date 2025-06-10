# Backend Ekraf Kuningan

![GitHub last commit](https://img.shields.io/github/last-commit/Ekraf-Kuningan/ekraf-backend?style=for-the-badge)
![GitHub language count](https://img.shields.io/github/languages/count/Ekraf-Kuningan/ekraf-backend?style=for-the-badge)
![GitHub repo size](https://img.shields.io/github/repo-size/Ekraf-Kuningan/ekraf-backend?style=for-the-badge)

Repositori ini berisi kode sumber untuk layanan backend dari platform **Ekonomi Kreatif (Ekraf) Kabupaten Kuningan**. Backend ini bertanggung jawab untuk mengelola semua data, logika bisnis, dan menyediakan API untuk aplikasi frontend.

## 🚀 Tentang Proyek

Proyek ini bertujuan untuk menjadi pusat data dan layanan digital bagi para pelaku ekonomi kreatif di Kabupaten Kuningan. Backend ini menyediakan fungsionalitas seperti:

-   Autentikasi dan manajemen pengguna
-   Manajemen produk dan layanan kreatif
-   Pengelolaan data pelaku Ekraf
-   Dan fitur-fitur pendukung lainnya.

## 🛠️ Tumpukan Teknologi (Tech Stack)

Backend ini dibangun menggunakan teknologi modern untuk memastikan performa, skalabilitas, dan kemudahan pemeliharaan.

-   **Bahasa Pemrograman:** [**TypeScript**](https://www.typescriptlang.org/)
-   **Framework:** [**Next.js**](https://nextjs.org/) (API Routes)
-   **Database:** [**MySQL**](https://www.mysql.com/)
-   **ORM/Database Client:** [**Prisma**](https://www.prisma.io/)
-   **Kontainerisasi:** [**Docker**](https://www.docker.com/)

## ⚙️ Memulai (Getting Started)

Untuk menjalankan proyek ini di lingkungan lokal Anda, ikuti langkah-langkah berikut.

### Prasyarat

Pastikan perangkat Anda telah terinstal:
-   [Node.js](https://nodejs.org/) versi 16 atau lebih tinggi
-   [npm](https://www.npmjs.com/) atau [yarn](https://yarnpkg.com/)
-   [MySQL](https://dev.mysql.com/downloads/mysql/) server
-   [Git](https://git-scm.com/downloads)

### Instalasi

1.  **Clone repositori ini:**
    ```sh
    git clone https://github.com/Ekraf-Kuningan/ekraf-backend.git
    cd ekraf-backend
    ```

2.  **Konfigurasi Lingkungan:**
    Salin file konfigurasi contoh dan sesuaikan isinya dengan pengaturan lokal Anda.
    ```sh
    cp .env.example .env
    ```
    Buka file `.env` dan isi variabel yang diperlukan, terutama untuk koneksi database MySQL.

3.  **Instal Dependensi:**
    Instal semua dependensi proyek.
    ```sh
    npm install
    # atau
    yarn install
    ```

4.  **Migrasi Database (Opsional):**
    Jalankan migrasi database jika tersedia.
    ```sh
    npm run migrate
    # atau
    yarn migrate
    ```

5.  **Jalankan Aplikasi:**
    ```sh
    npm run dev
    # atau
    yarn dev
    ```
    Server akan berjalan secara default di `http://localhost:3000` (atau port yang Anda atur di file `.env`).


## 🔧 Konfigurasi

Semua konfigurasi aplikasi diatur melalui *environment variables* yang ada di dalam file `.env`. Berikut adalah variabel utama yang perlu diatur:

| Variabel         | Deskripsi                                        | Contoh Nilai                   |
| ---------------- | ------------------------------------------------ | ------------------------------ |
| `SERVER_PORT`    | Port yang digunakan oleh server aplikasi.        | `8080`                         |
| `DB_HOST`        | Host dari server database.                       | `localhost`                    |
| `DB_PORT`        | Port dari server database.                       | `5432`                         |
| `DB_USER`        | Nama pengguna untuk koneksi database.            | `postgres`                     |
| `DB_PASSWORD`    | Kata sandi untuk koneksi database.               | `password`                     |
| `DB_NAME`        | Nama database yang digunakan.                    | `ekraf_kuningan_db`            |
| `JWT_SECRET_KEY` | Kunci rahasia untuk menandatangani token JWT.    | `rahasia-sekali`               |

## 📄 Dokumentasi API

Dokumentasi lengkap untuk semua endpoint API tersedia dan dapat diakses melalui Postman atau Swagger.

**[➡️ Link ke Dokumentasi API (Postman/Swagger) Anda di Sini ⬅️]**

Contoh beberapa endpoint yang tersedia:

-   `POST /api/v1/login` - Login Pengguna
-   `POST /api/v1/register` - Registrasi Pengguna Baru
-   `GET /api/v1/products` - Mendapatkan semua produk
-   `GET /api/v1/products/{id}` - Mendapatkan detail produk

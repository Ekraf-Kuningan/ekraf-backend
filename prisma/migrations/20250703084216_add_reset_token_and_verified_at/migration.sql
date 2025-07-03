-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `email_verified_at` TIMESTAMP(0) NULL,
    `password` VARCHAR(255) NOT NULL,
    `remember_token` VARCHAR(100) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `username` VARCHAR(45) NULL,
    `jk` ENUM('Laki-laki', 'Perempuan') NULL,
    `nohp` VARCHAR(20) NULL,
    `image` VARCHAR(255) NULL,
    `nama_usaha` VARCHAR(100) NULL,
    `status_usaha` ENUM('BARU', 'SUDAH_LAMA') NULL,
    `id_level` INTEGER NOT NULL,
    `id_kategori_usaha` INTEGER NULL,
    `resetPasswordToken` VARCHAR(255) NULL,
    `resetPasswordTokenExpiry` DATETIME(0) NULL,
    `verifiedAt` TIMESTAMP(0) NULL,

    UNIQUE INDEX `users_email_unique`(`email`),
    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_resetPasswordToken_key`(`resetPasswordToken`),
    INDEX `users_id_level_idx`(`id_level`),
    INDEX `users_id_kategori_usaha_idx`(`id_kategori_usaha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `artikel_kategoris` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `artikel_kategoris_slug_unique`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `artikels` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `author_id` BIGINT UNSIGNED NOT NULL,
    `artikel_kategori_id` BIGINT UNSIGNED NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `thumbnail` VARCHAR(255) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `artikels_slug_unique`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `authors` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `username` VARCHAR(255) NOT NULL,
    `avatar` VARCHAR(255) NOT NULL,
    `bio` LONGTEXT NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `authors_username_unique`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `banners` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `artikel_id` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `katalogs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sub_sektor_id` BIGINT UNSIGNED NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `produk` VARCHAR(255) NOT NULL,
    `harga` DECIMAL(12, 2) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `no_hp` VARCHAR(255) NULL,
    `instagram` VARCHAR(255) NULL,
    `shopee` VARCHAR(255) NULL,
    `tokopedia` VARCHAR(255) NULL,
    `lazada` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `katalogs_slug_unique`(`slug`),
    INDEX `katalogs_sub_sektor_id_foreign`(`sub_sektor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sub_sektors` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `sub_sektors_slug_unique`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_artikel` (
    `id_artikel` INTEGER NOT NULL AUTO_INCREMENT,
    `judul` VARCHAR(150) NOT NULL,
    `gambar` VARCHAR(100) NULL,
    `deskripsi_singkat` TEXT NULL,
    `isi_lengkap` LONGTEXT NULL,
    `tanggal_upload` DATE NOT NULL,
    `id_user` BIGINT UNSIGNED NULL,

    INDEX `tbl_artikel_id_user_idx`(`id_user`),
    PRIMARY KEY (`id_artikel`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_level` (
    `id_level` INTEGER NOT NULL AUTO_INCREMENT,
    `level` VARCHAR(25) NULL,

    PRIMARY KEY (`id_level`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_olshop_link` (
    `id_link` INTEGER NOT NULL AUTO_INCREMENT,
    `id_produk` INTEGER NOT NULL,
    `nama_platform` VARCHAR(50) NULL,
    `url` TEXT NOT NULL,

    INDEX `tbl_olshop_link_id_produk_idx`(`id_produk`),
    PRIMARY KEY (`id_link`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_subsektor` (
    `id_sub` INTEGER NOT NULL AUTO_INCREMENT,
    `sub_sektor` VARCHAR(25) NULL,

    PRIMARY KEY (`id_sub`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_user_temp` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_user` VARCHAR(35) NOT NULL,
    `username` VARCHAR(45) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `jk` ENUM('Laki-laki', 'Perempuan') NOT NULL,
    `nohp` VARCHAR(20) NULL,
    `id_level` INTEGER NOT NULL,
    `verificationToken` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `resetPasswordToken` VARCHAR(255) NULL,
    `resetPasswordTokenExpiry` DATETIME(0) NULL,
    `verificationTokenExpiry` DATETIME(0) NULL,
    `nama_usaha` VARCHAR(100) NULL,
    `status_usaha` ENUM('BARU', 'SUDAH_LAMA') NULL,
    `id_kategori_usaha` INTEGER NULL,

    UNIQUE INDEX `username`(`username`),
    UNIQUE INDEX `email`(`email`),
    UNIQUE INDEX `verificationToken`(`verificationToken`),
    UNIQUE INDEX `resetPasswordToken`(`resetPasswordToken`),
    INDEX `tbl_user_temp_id_kategori_usaha_idx`(`id_kategori_usaha`),
    INDEX `tbl_user_temp_id_level_idx`(`id_level`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_kategori_usaha` (
    `id_kategori_usaha` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_kategori` VARCHAR(50) NOT NULL,
    `image` VARCHAR(255) NULL,

    UNIQUE INDEX `nama_kategori_UNIQUE`(`nama_kategori`),
    PRIMARY KEY (`id_kategori_usaha`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_product` (
    `id_produk` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_pelaku` VARCHAR(35) NULL,
    `nama_produk` VARCHAR(50) NOT NULL,
    `deskripsi` VARCHAR(500) NOT NULL,
    `harga` DOUBLE NOT NULL,
    `stok` INTEGER NOT NULL,
    `gambar` VARCHAR(255) NOT NULL,
    `nohp` VARCHAR(12) NOT NULL,
    `tgl_upload` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `id_user` BIGINT UNSIGNED NULL,
    `id_kategori_usaha` INTEGER NULL,
    `status_produk` ENUM('disetujui', 'pending', 'ditolak', 'tidak aktif') NOT NULL DEFAULT 'pending',

    INDEX `tbl_product_id_user_idx`(`id_user`),
    INDEX `tbl_product_id_kategori_usaha_idx`(`id_kategori_usaha`),
    PRIMARY KEY (`id_produk`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cache` (
    `key` VARCHAR(255) NOT NULL,
    `value` MEDIUMTEXT NOT NULL,
    `expiration` INTEGER NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cache_locks` (
    `key` VARCHAR(255) NOT NULL,
    `owner` VARCHAR(255) NOT NULL,
    `expiration` INTEGER NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `failed_jobs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(255) NOT NULL,
    `connection` TEXT NOT NULL,
    `queue` TEXT NOT NULL,
    `payload` LONGTEXT NOT NULL,
    `exception` LONGTEXT NOT NULL,
    `failed_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `failed_jobs_uuid_unique`(`uuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_batches` (
    `id` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `total_jobs` INTEGER NOT NULL,
    `pending_jobs` INTEGER NOT NULL,
    `failed_jobs` INTEGER NOT NULL,
    `failed_job_ids` LONGTEXT NOT NULL,
    `options` MEDIUMTEXT NULL,
    `cancelled_at` INTEGER NULL,
    `created_at` INTEGER NOT NULL,
    `finished_at` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jobs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `queue` VARCHAR(255) NOT NULL,
    `payload` LONGTEXT NOT NULL,
    `attempts` TINYINT UNSIGNED NOT NULL,
    `reserved_at` INTEGER UNSIGNED NULL,
    `available_at` INTEGER UNSIGNED NOT NULL,
    `created_at` INTEGER UNSIGNED NOT NULL,

    INDEX `jobs_queue_index`(`queue`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `migrations` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `migration` VARCHAR(255) NOT NULL,
    `batch` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_reset_tokens` (
    `email` VARCHAR(255) NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` VARCHAR(255) NOT NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `payload` LONGTEXT NOT NULL,
    `last_activity` INTEGER NOT NULL,

    INDEX `sessions_last_activity_index`(`last_activity`),
    INDEX `sessions_user_id_index`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `fk_users_level` FOREIGN KEY (`id_level`) REFERENCES `tbl_level`(`id_level`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `fk_users_kategori_usaha` FOREIGN KEY (`id_kategori_usaha`) REFERENCES `tbl_kategori_usaha`(`id_kategori_usaha`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `katalogs` ADD CONSTRAINT `katalogs_sub_sektor_id_foreign` FOREIGN KEY (`sub_sektor_id`) REFERENCES `sub_sektors`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `tbl_artikel` ADD CONSTRAINT `fk_artikel_user` FOREIGN KEY (`id_user`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_olshop_link` ADD CONSTRAINT `fk_produk_olshop` FOREIGN KEY (`id_produk`) REFERENCES `tbl_product`(`id_produk`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_user_temp` ADD CONSTRAINT `fk_user_temp_kategori_usaha` FOREIGN KEY (`id_kategori_usaha`) REFERENCES `tbl_kategori_usaha`(`id_kategori_usaha`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_user_temp` ADD CONSTRAINT `fk_user_temp_level` FOREIGN KEY (`id_level`) REFERENCES `tbl_level`(`id_level`) ON DELETE NO ACTION ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_product` ADD CONSTRAINT `fk_product_kategori_usaha` FOREIGN KEY (`id_kategori_usaha`) REFERENCES `tbl_kategori_usaha`(`id_kategori_usaha`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tbl_product` ADD CONSTRAINT `fk_umkm_user` FOREIGN KEY (`id_user`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

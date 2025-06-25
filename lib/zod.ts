import { z } from "zod";
// Skema Zod disesuaikan sepenuhnya ke tbl_kategori_usaha
export const productSchema = z.object({
  nama_produk: z.string()
    .min(3, { message: "Nama produk harus memiliki minimal 3 karakter." })
    .max(100, { message: "Nama produk tidak boleh lebih dari 100 karakter." }),
  nama_pelaku: z.string()
    .min(1, { message: "Nama pelaku usaha wajib diisi." }),
  deskripsi: z.string().optional(),
  harga: z.coerce
    .number({ invalid_type_error: "Harga harus berupa angka." })
    .positive({ message: "Harga harus lebih dari 0." }),
  stok: z.coerce
    .number({ invalid_type_error: "Stok harus berupa angka." })
    .int({ message: "Stok harus berupa bilangan bulat." })
    .nonnegative({ message: "Stok tidak boleh negatif." }),
  nohp: z.string()
    .regex(/^(\+62|62|0)8[1-9][0-9]{7,11}$/, { message: "Format nomor HP tidak valid." })
    .optional()
    .or(z.literal('')),
  id_kategori_usaha: z.coerce
    .number({ invalid_type_error: "Kategori tidak valid." })
    .int()
    .positive({ message: "Kategori harus dipilih." }),
  
  // --- PERUBAHAN UTAMA DI SINI ---
  gambar: z.string({ required_error: "URL gambar wajib diisi." })
    .url({ message: "Format URL gambar tidak valid." })
    .min(1, { message: "URL gambar tidak boleh kosong." }),
  status_produk: z.enum(['disetujui', 'pending', 'ditolak', 'tidak_aktif']).default('pending'),
});
export const updateProductSchema = productSchema.partial();
import { z } from "zod";
// Skema Zod disesuaikan sepenuhnya ke tbl_kategori_usaha
export const productSchema = z.object({
  name: z.string()
    .min(3, { message: "Nama produk harus memiliki minimal 3 karakter." })
    .max(100, { message: "Nama produk tidak boleh lebih dari 100 karakter." }),
  owner_name: z.string()
    .min(1, { message: "Nama pelaku usaha wajib diisi." }),
  description: z.string().optional(),
  price: z.coerce
    .number({ invalid_type_error: "Harga harus berupa angka." })
    .positive({ message: "Harga harus lebih dari 0." }),
  stock: z.coerce
    .number({ invalid_type_error: "Stok harus berupa angka." })
    .int({ message: "Stok harus berupa bilangan bulat." })
    .nonnegative({ message: "Stok tidak boleh negatif." }),
  phone_number: z.string()
    .regex(/^(\+62|62|0)8[1-9][0-9]{7,11}$/, { message: "Format nomor HP tidak valid." })
    .optional()
    .or(z.literal('')),
  business_category_id: z.coerce
    .number({ invalid_type_error: "Kategori tidak valid." })
    .int()
    .positive({ message: "Kategori harus dipilih." }),
  
  // --- PERUBAHAN UTAMA DI SINI ---
  image: z.string({ required_error: "URL gambar wajib diisi." })
    .url({ message: "Format URL gambar tidak valid." })
    .min(1, { message: "URL gambar tidak boleh kosong." }),
  status: z.enum(['disetujui', 'pending', 'ditolak', 'tidak_aktif']).default('pending'),
});
export const updateProductSchema = productSchema.partial();

export const KategoriUsahaSchema = z.object({
  name: z.string().min(3, { message: "Nama kategori harus memiliki minimal 3 karakter." }),
  image: z.string().max(255).optional().nullable()
});
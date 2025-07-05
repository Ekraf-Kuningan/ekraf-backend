import { z } from "zod";
// Zod schemas aligned with database schema
export const productSchema = z.object({
  name: z.string()
    .min(3, { message: "Product name must have at least 3 characters." })
    .max(100, { message: "Product name cannot exceed 100 characters." }),
  owner_name: z.string()
    .min(1, { message: "Owner name is required." }),
  description: z.string().optional(),
  price: z.coerce
    .number({ invalid_type_error: "Price must be a number." })
    .positive({ message: "Price must be greater than 0." }),
  stock: z.coerce
    .number({ invalid_type_error: "Stock must be a number." })
    .int({ message: "Stock must be an integer." })
    .nonnegative({ message: "Stock cannot be negative." }),
  phone_number: z.string()
    .regex(/^(\+62|62|0)8[1-9][0-9]{7,11}$/, { message: "Invalid phone number format." })
    .optional()
    .or(z.literal('')),
  business_category_id: z.coerce
    .number({ invalid_type_error: "Invalid business category." })
    .int()
    .positive({ message: "Business category must be selected." }),
  sub_sector_id: z.coerce
    .number({ invalid_type_error: "Invalid subsector." })
    .int()
    .positive({ message: "Subsector must be selected." })
    .optional(),
  
  // --- MAIN CHANGE HERE ---
  image: z.string({ required_error: "Image URL is required." })
    .url({ message: "Invalid image URL format." })
    .min(1, { message: "Image URL cannot be empty." }),
  status: z.enum(['disetujui', 'pending', 'ditolak', 'tidak_aktif']).default('pending'),
});
export const updateProductSchema = productSchema.partial();

export const BusinessCategorySchema = z.object({
  name: z.string().min(3, { message: "Category name must have at least 3 characters." }),
  image: z.string().max(255).optional().nullable(),
  sub_sector_id: z.coerce
    .number({ invalid_type_error: "Invalid subsector." })
    .int()
    .positive({ message: "Subsector must be selected." }),
  description: z.string().optional().nullable()
});
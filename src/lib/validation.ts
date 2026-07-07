import { z } from 'zod';

// ---------- Order Payload Validation ----------
export const orderPayloadSchema = z.object({
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(5),
    address: z.string().min(1),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().regex(/^\d{5,6}$/),
  }),
  items: z.array(
    z.object({
      slug: z.string().min(1),
      quantity: z.number().int().positive(),
      price: z.number().int().nonnegative().optional(),
      selectedColorId: z.string().optional(),
      selectedSize: z.string().optional(),
      designId: z.string().optional(),
      designImageUrl: z.string().url().optional(),
    })
  ).min(1),
  totalOrderValue: z.number().optional(),
});

// Export a helper for parsing with automatic error throwing
export function parseOrderPayload(data: unknown) {
  return orderPayloadSchema.parse(data);
}

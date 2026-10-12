import { z } from 'zod';

export const createLabelSchema = z.object({
  name: z.string().min(1).max(255).transform((v) => v.trim()),
  color: z.string().min(1).max(50).optional().default('charcoal'),
  isFavorite: z.boolean().optional().default(false),
});

export const updateLabelSchema = z.object({
  name: z.string().min(1).max(255).transform((v) => v.trim()).optional(),
  color: z.string().min(1).max(50).optional(),
  order: z.number().int().optional(),
  isFavorite: z.boolean().optional(),
});

export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;

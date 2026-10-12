import { z } from 'zod';

export const createSectionSchema = z.object({
  name: z.string().min(1).max(255).transform((v) => v.trim()),
});

export const updateSectionSchema = z.object({
  name: z.string().min(1).max(255).transform((v) => v.trim()).optional(),
  order: z.number().int().optional(),
  isCollapsed: z.boolean().optional(),
});

export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;

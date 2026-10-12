import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().min(1).max(255).transform((v) => v.trim()).optional(),
  timezone: z.string().min(1).max(100).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

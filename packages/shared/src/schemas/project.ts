import { z } from 'zod';

const viewStyleEnum = z.enum(['list', 'board']);

export const createProjectSchema = z.object({
  name: z.string().min(1).max(255).transform((v) => v.trim()),
  color: z.string().min(1).max(50).optional().default('charcoal'),
  parentId: z.string().uuid().nullable().optional().default(null),
  viewStyle: viewStyleEnum.optional().default('list'),
  isFavorite: z.boolean().optional().default(false),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).transform((v) => v.trim()).optional(),
  color: z.string().min(1).max(50).optional(),
  parentId: z.string().uuid().nullable().optional(),
  viewStyle: viewStyleEnum.optional(),
  isFavorite: z.boolean().optional(),
  order: z.number().int().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z.string().min(2).max(255),
  type: z.enum(['tasks', 'projects', 'all']).optional().default('all'),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;

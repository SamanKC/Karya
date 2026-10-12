/**
 * Prisma client singleton.
 *
 * NOTE: Run `npx prisma generate` before first use.
 * The Prisma client types are generated from schema.prisma and
 * require the native schema-engine binary (download from binaries.prisma.sh).
 *
 * Usage:
 *   import { prisma } from './lib/prisma.js';
 *   const user = await prisma.user.findUnique({ where: { id } });
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

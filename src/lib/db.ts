import { createPrismaClient } from './prisma-client';
const globalDb = globalThis as unknown as { prismaM3A?: ReturnType<typeof createPrismaClient> };
export const db = globalDb.prismaM3A ?? createPrismaClient();
if (process.env.NODE_ENV !== 'production') globalDb.prismaM3A = db;

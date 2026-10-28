import { PrismaClient } from '@/generated/prisma-client';
import { PrismaPg } from '@prisma/adapter-pg';

export function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required.');
  const schema = new URL(connectionString).searchParams.get('schema') ?? 'public';
  if (!/^[a-z_][a-z0-9_]*$/i.test(schema)) throw new Error('Invalid database schema.');
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString, options: `-c search_path=${schema}` }, { schema }),
  });
}

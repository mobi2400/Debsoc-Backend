import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaInstance: PrismaClient;

try {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.warn('DATABASE_URL is not defined, Prisma Client initialization may fail.');
  }

  // Configure pool
  // In serverless environments (Vercel), we limit the pool size to avoid exhausting connections
  // or use a direct connection if preferred, but adapter-pg requires a pool.
  const pool = new pg.Pool({
    connectionString,
    max: process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME ? 1 : 10
  });

  const adapter = new PrismaPg(pool);

  prismaInstance = globalForPrisma.prisma ?? new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

} catch (error) {
  console.error('Failed to initialize Prisma Client:', error);
  // If initialization fails, we can't really recover if the client requires an adapter.
  // We'll throw to make the error visible.
  throw error;
}

export const prisma = prismaInstance;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

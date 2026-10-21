import { PrismaClient } from '@prisma/client';

function getNormalizedDatabaseUrl(): string | undefined {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) return undefined;

  try {
    const parsed = new URL(rawUrl);
    // Automatically optimize for Neon PgBouncer pooler endpoints
    if (parsed.hostname.includes('-pooler')) {
      if (!parsed.searchParams.has('pgbouncer')) {
        parsed.searchParams.set('pgbouncer', 'true');
      }
      if (!parsed.searchParams.has('connect_timeout')) {
        parsed.searchParams.set('connect_timeout', '15');
      }
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const url = getNormalizedDatabaseUrl();
  const client = new PrismaClient({
    ...(url ? { datasources: { db: { url } } } : {}),
    log: [
      {
        emit: 'event',
        level: 'error',
      },
    ],
  });

  // Filter out benign Neon serverless idle connection close notifications
  client.$on('error', (e) => {
    if (e.message && e.message.includes('kind: Closed')) {
      return;
    }
    console.error('Prisma error:', e.message);
  });

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Sob rajada (ex.: muita gente confirmando pagamento ao mesmo tempo perto do
// sorteio), o limite padrão de conexões do Prisma é baixo demais e as
// transações começam a falhar com "Unable to start a transaction in the
// given time" (P2028) mesmo sem nenhum problema real no banco — é só fila.
// Aumentamos o pool aqui em vez de editar a DATABASE_URL (que é gerenciada
// pela integração Neon/Vercel).
function buildDatabaseUrl() {
  const base = process.env.DATABASE_URL;
  if (!base) return base;
  try {
    const url = new URL(base);
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "20");
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "20");
    }
    return url.toString();
  } catch {
    return base;
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ datasourceUrl: buildDatabaseUrl() });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

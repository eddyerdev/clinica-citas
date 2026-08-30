import { PrismaClient } from "@prisma/client";

/**
 * Instancia única (singleton) del cliente de Prisma.
 * Se reutiliza en todos los repositorios de infraestructura para no abrir
 * múltiples conexiones a la base de datos. Esta es la ÚNICA parte del
 * proyecto (junto con los repositorios Prisma) que sabe que existe Prisma;
 * el dominio y los casos de uso nunca importan este archivo directamente.
 */
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});
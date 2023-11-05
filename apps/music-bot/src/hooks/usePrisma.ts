import { HooksRegistry, Symbols } from './registry';
import type { PrismaClient } from '@prisma/client';

export function usePrisma() {
  const prisma = HooksRegistry.get(Symbols.kPrisma) as PrismaClient | undefined;

  if (!prisma) {
    throw new Error('Prisma has not been initialized');
  }

  return prisma;
}

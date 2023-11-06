import { PrismaClient } from '@prisma/client';
import { HooksRegistry, Symbols } from '#bot/hooks/registry';

const prisma = new PrismaClient();

await prisma.$connect();

console.log('Connected to the database');

HooksRegistry.set(Symbols.kPrisma, prisma);

export { prisma as db };

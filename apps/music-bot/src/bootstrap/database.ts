import { PrismaClient } from '@prisma/client';
import { HooksRegistry, Symbols } from '../hooks/registry';

const prisma = new PrismaClient();

await prisma.$connect();

HooksRegistry.set(Symbols.kPrisma, prisma);

export { prisma as db };

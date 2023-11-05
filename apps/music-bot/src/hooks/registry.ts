export const HooksRegistry = new Map<symbol, unknown>();

export const Symbols = {
  kClient: Symbol('Client'),
  kRedis: Symbol('Redis'),
  kPrisma: Symbol('Prisma'),
} as const;

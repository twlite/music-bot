export const HooksRegistry = new Map<symbol, unknown>();

export const Symbols = {
  kClient: Symbol("Client"),
  kRedis: Symbol("Redis"),
  kDatabase: Symbol("Database"),
} as const;

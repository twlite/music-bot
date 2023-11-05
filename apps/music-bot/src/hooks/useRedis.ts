import { HooksRegistry, Symbols } from './registry';
import type { Redis } from 'ioredis';

export function useRedis() {
  const redis = HooksRegistry.get(Symbols.kRedis) as Redis | undefined;

  if (!redis) {
    throw new Error('Redis has not been initialized');
  }

  return redis;
}

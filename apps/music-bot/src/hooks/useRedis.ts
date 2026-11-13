import { HooksRegistry, Symbols } from "./registry.js";
import type { Redis } from "ioredis";

export function useRedisAsync() {
  return new Promise<Redis>((resolve) => {
    const returnIfFound = () => {
      const redis = HooksRegistry.get(Symbols.kRedis) as Redis | undefined;

      if (redis) return resolve(redis);

      setTimeout(returnIfFound, 1000);
    };

    returnIfFound();
  });
}

export function useRedis() {
  const redis = HooksRegistry.get(Symbols.kRedis) as Redis | undefined;

  if (!redis) {
    throw new Error("Redis has not been initialized");
  }

  return redis;
}

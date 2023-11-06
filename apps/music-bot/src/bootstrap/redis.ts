import { Redis } from 'ioredis';
import { HooksRegistry, Symbols } from '#bot/hooks/registry';
import { RedisConfig } from '#bot/utils/constants';

const redis = new Redis({
  ...RedisConfig,
  lazyConnect: true,
});

await redis.connect();

console.log('Connected to Redis');

HooksRegistry.set(Symbols.kRedis, redis);

export default redis;

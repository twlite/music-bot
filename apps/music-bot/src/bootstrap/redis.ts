import { Redis } from 'ioredis';
import { HooksRegistry, Symbols } from '../hooks/registry';
import { RedisConfig } from '../utils/constants';

const redis = new Redis({
  ...RedisConfig,
  lazyConnect: true,
});

await redis.connect();

HooksRegistry.set(Symbols.kRedis, redis);

export default redis;

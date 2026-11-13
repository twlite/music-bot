import { Redis } from 'ioredis';
import { HooksRegistry, Symbols } from '@/hooks/registry';
import { config } from '@/config';

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: process.env.REDIS_PASSWORD,
  lazyConnect: true,
});

await redis.connect();

console.log('Connected to Redis');

HooksRegistry.set(Symbols.kRedis, redis);

export default redis;

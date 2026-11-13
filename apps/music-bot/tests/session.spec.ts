import { it, expect, vi, beforeEach } from 'vitest';
const { records, redis, member } = vi.hoisted(() => {
  const records = new Map<string, string>();
  const redis = {
    setex: vi.fn(async (key: string, _ttl: number, value: string) => records.set(key, value)),
    get: vi.fn(async (key: string) => records.get(key)),
    getdel: vi.fn(async (key: string) => {
      const value = records.get(key);
      records.delete(key);
      return value;
    }),
  };
  const member = {
    voice: {
      channel: { id: 'voice', permissionsFor: () => ({ has: () => true }) },
    },
  };
  return { records, redis, member };
});
vi.mock('../src/hooks/useRedis.js', () => ({
  useRedisAsync: async () => redis,
}));
vi.mock('../src/bootstrap/client.js', () => ({
  client: {
    guilds: {
      cache: new Map([
        [
          'guild',
          {
            members: {
              fetch: async () => member,
              me: { voice: { channelId: 'voice' } },
            },
          },
        ],
      ]),
    },
  },
}));
import { generateSession, exchangeSession, validateSession, authorizeAction } from '../src/player/session.js';
beforeEach(() => {
  records.clear();
});
it('exchanges once and stores only digests in Redis keys', async () => {
  const user = {
    id: 'user',
    username: 'name',
    displayName: 'Name',
    displayAvatarURL: () => 'https://example.com/avatar',
  };
  const guild = {
    id: 'guild',
    name: 'Guild',
    nameAcronym: 'G',
    iconURL: () => null,
  };
  const { token } = await generateSession(user as never, guild as never);
  expect([...records.keys()].some((key) => key.includes(token))).toBe(false);
  expect(await validateSession(token)).toBeNull();
  const session = await exchangeSession(token);
  expect(session).toBeTruthy();
  expect(await exchangeSession(token)).toBeNull();
  expect(await validateSession(session)).toMatchObject({
    id: 'user',
    guildId: 'guild',
  });
  expect(redis.setex).toHaveBeenCalledWith(expect.stringContaining('exchange::'), 60, expect.any(String));
});
it('rejects malformed tokens', async () => expect(await validateSession({ token: 'anything' })).toBeNull());
it('checks current voice membership', async () =>
  expect(await authorizeAction({ id: 'user', guildId: 'guild' } as never)).toBe(true));

import { Guild, User } from 'discord.js';
import { randomBytes } from 'node:crypto';
import ms from 'ms';
import { useRedisAsync } from '#bot/hooks/useRedis';

const generateToken = () => randomBytes(32).toString('hex');

interface SessionData {
  id: string;
  avatar: string;
  username: string;
  displayName: string;
  guildId: string;
  guildName: string;
  guildIcon: string | null;
  guildAcronym: string;
}

export async function generateSession(
  user: User,
  guild: Guild,
  timeout = '3h'
): Promise<{ data: SessionData; token: string }> {
  const redis = await useRedisAsync();
  const mkey = `magic_link::${user.id}::${guild.id}`;
  const old = await redis.get(mkey);

  if (old) {
    const res = await validateSession(old);
    if (res) return { data: res, token: old };
  }

  const dur = ms(timeout) / 1000;
  const token = generateToken();

  const data = {
    id: user.id,
    avatar: user.displayAvatarURL(),
    username: user.username,
    displayName: user.displayName,
    guildId: guild.id,
    guildName: guild.name,
    guildIcon: guild.iconURL(),
    guildAcronym: guild.nameAcronym,
  };

  await redis.setex(`session::${token}`, dur, JSON.stringify(data));
  // TODO: might need a better option for this
  await redis.setex(mkey, dur, token);

  return { data, token };
}

export async function validateSession(
  token: string
): Promise<SessionData | null> {
  const redis = await useRedisAsync();

  try {
    const old = await redis.get(`session::${token}`);
    if (old) return JSON.parse(old);
    return null;
  } catch {
    return null;
  }
}

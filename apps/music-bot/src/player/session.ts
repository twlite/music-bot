import type { Guild, User } from 'discord.js';
import { randomBytes, createHash } from 'node:crypto';
import { useRedisAsync } from '@/hooks/useRedis';
import { client } from '@/bootstrap/client';

const key = (token: string) => createHash('sha256').update(token).digest('hex');
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

export interface SessionData {
  id: string;
  avatar: string;
  username: string;
  displayName: string;
  guildId: string;
  guildName: string;
  guildIcon: string | null;
  guildAcronym: string;
}

export async function generateSession(user: User, guild: Guild) {
  const redis = await useRedisAsync();
  const token = randomBytes(32).toString('hex');
  const data: SessionData = {
    id: user.id,
    avatar: user.displayAvatarURL(),
    username: user.username,
    displayName: user.displayName,
    guildId: guild.id,
    guildName: guild.name,
    guildIcon: guild.iconURL(),
    guildAcronym: guild.nameAcronym,
  };
  await redis.setex(`exchange::${key(token)}`, 60, JSON.stringify(data));
  return { data, token };
}

async function exchangeSessionData(code: string) {
  if (typeof code !== 'string' || !/^[a-f0-9]{64}$/.test(code)) return null;
  const redis = await useRedisAsync();
  return redis.getdel(`exchange::${key(code)}`);
}

async function createAccessToken(data: string) {
  const token = randomBytes(32).toString('hex');
  await (await useRedisAsync()).setex(`dashboard::${key(token)}`, ACCESS_TOKEN_TTL_SECONDS, data);
  return token;
}

async function createSessionTokens(data: string) {
  const redis = await useRedisAsync();
  const accessToken = randomBytes(32).toString('hex');
  const refreshToken = randomBytes(32).toString('hex');

  await Promise.all([
    redis.setex(`dashboard::${key(accessToken)}`, ACCESS_TOKEN_TTL_SECONDS, data),
    redis.setex(`dashboard-refresh::${key(refreshToken)}`, REFRESH_TOKEN_TTL_SECONDS, data),
  ]);

  return { accessToken, refreshToken };
}

/** Exchange a one-time dashboard code for its short-lived access token. */
export async function exchangeSession(code: string) {
  const data = await exchangeSessionData(code);
  if (!data) return null;

  return createAccessToken(data);
}

/** Exchange a one-time dashboard code for its access and refresh tokens. */
export async function exchangeSessionTokens(code: string) {
  const data = await exchangeSessionData(code);
  if (!data) return null;

  return createSessionTokens(data);
}

export async function validateSession(token: unknown): Promise<SessionData | null> {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return null;
  const data = await (await useRedisAsync()).get(`dashboard::${key(token)}`);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/** Issue a fresh access token and extend the refresh token's inactivity window. */
export async function refreshSession(refreshToken: unknown, accessToken: unknown) {
  const redis = await useRedisAsync();
  let data: string | null = null;
  let currentRefreshToken =
    typeof refreshToken === 'string' && /^[a-f0-9]{64}$/.test(refreshToken) ? refreshToken : null;

  if (currentRefreshToken) {
    const refreshKey = `dashboard-refresh::${key(currentRefreshToken)}`;
    data = await redis.get(refreshKey);
    if (data) await redis.expire(refreshKey, REFRESH_TOKEN_TTL_SECONDS);
  }

  // Upgrade existing one-hour sessions issued before refresh tokens were added.
  let createRefreshToken = false;
  if (!data) {
    const legacySession = await validateSession(accessToken);
    if (!legacySession) return null;

    data = JSON.stringify(legacySession);
    currentRefreshToken = randomBytes(32).toString('hex');
    createRefreshToken = true;
  }

  let user: SessionData;
  try {
    user = JSON.parse(data) as SessionData;
  } catch {
    return null;
  }

  if (!(await authorizeAction(user))) return null;

  if (createRefreshToken)
    await redis.setex(`dashboard-refresh::${key(currentRefreshToken!)}`, REFRESH_TOKEN_TTL_SECONDS, data);

  const nextAccessToken = randomBytes(32).toString('hex');
  await redis.setex(`dashboard::${key(nextAccessToken)}`, ACCESS_TOKEN_TTL_SECONDS, data);

  return { accessToken: nextAccessToken, refreshToken: currentRefreshToken! };
}

/** Re-check Discord membership and voice access before every dashboard mutation. */
export async function authorizeAction(user: SessionData) {
  const guild = client.guilds.cache.get(user.guildId);
  const member = await guild?.members.fetch(user.id).catch(() => null);
  const channel = member?.voice.channel;
  const botChannel = guild?.members.me?.voice.channelId;
  return Boolean(
    channel &&
    (!botChannel || channel.id === botChannel) &&
    channel.permissionsFor(member!)?.has(['ViewChannel', 'Connect', 'Speak']),
  );
}

export function cookieToken(cookie?: string) {
  return cookieValue(cookie, 'music_session');
}

export function refreshCookieToken(cookie?: string) {
  return cookieValue(cookie, 'music_refresh');
}

function cookieValue(cookie: string | undefined, name: string) {
  return cookie
    ?.split(';')
    .map((v) => v.trim())
    .find((v) => v.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

/** Remaining server-side session lifetime, used to close idle dashboard sockets. */
export async function sessionTTL(token: string) {
  return (await useRedisAsync()).ttl(`dashboard::${key(token)}`);
}

import type { Guild, User } from "discord.js";
import { randomBytes, createHash } from "node:crypto";
import { useRedisAsync } from "#bot/hooks/useRedis";
import { client } from "#bot/bootstrap/client";

const key = (token: string) => createHash("sha256").update(token).digest("hex");
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
  const token = randomBytes(32).toString("hex");
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
export async function exchangeSession(code: string) {
  if (typeof code !== "string" || !/^[a-f0-9]{64}$/.test(code)) return null;
  const redis = await useRedisAsync();
  const data = await redis.getdel(`exchange::${key(code)}`);
  if (!data) return null;
  const token = randomBytes(32).toString("hex");
  await redis.setex(`dashboard::${key(token)}`, 3600, data);
  return token;
}
export async function validateSession(
  token: unknown,
): Promise<SessionData | null> {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) return null;
  const data = await (await useRedisAsync()).get(`dashboard::${key(token)}`);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
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
    channel.permissionsFor(member!)?.has(["ViewChannel", "Connect", "Speak"]),
  );
}
export function cookieToken(cookie?: string) {
  return cookie
    ?.split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith("music_session="))
    ?.slice(14);
}

/** Remaining server-side session lifetime, used to close idle dashboard sockets. */
export async function sessionTTL(token: string) {
  return (await useRedisAsync()).ttl(`dashboard::${key(token)}`);
}

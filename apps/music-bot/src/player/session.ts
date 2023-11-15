import { Guild, User } from 'discord.js';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';

const SECRET = randomBytes(32).toString('hex');

export async function generateSession(
  user: User,
  guild: Guild,
  timeout = '1h'
) {
  const secret = process.env.JWT_SECRET || SECRET;
  return jwt.sign(
    {
      id: user.id,
      avatar: user.displayAvatarURL(),
      username: user.username,
      displayName: user.displayName,
      guildId: guild.id,
      guildName: guild.name,
      guildIcon: guild.iconURL(),
      guildAcronym: guild.nameAcronym,
    },
    secret,
    {
      expiresIn: timeout,
    }
  );
}

export async function validateSession(token: string) {
  try {
    const secret = process.env.JWT_SECRET || SECRET;

    const res = jwt.verify(token, secret);
    if (typeof res === 'string' || !res) return null;

    return res as {
      id: string;
      avatar: string;
      username: string;
      displayName: string;
      guildId: string;
      guildName: string;
      guildIcon: string | null;
      guildAcronym: string;
    };
  } catch {
    return null;
  }
}

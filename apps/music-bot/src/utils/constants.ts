import { GatewayIntentBits } from "discord.js";
import { getDirname } from "./location.js";
import { join } from "node:path";

export const ClientIntents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildVoiceStates,
] as const;

export const RedisConfig = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
} as const;

export const PlayerEventsPath = join(
  getDirname(import.meta.url),
  "..",
  "player",
  "events",
);

export const EmbedColor = {
  Success: 0x00fa9a,
  Error: 0xff2a16,
  Warning: 0xffd700,
  Info: 0x00bfaf,
} as const;

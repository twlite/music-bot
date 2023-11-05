import { GatewayIntentBits } from 'discord.js';
import { getDirname } from './location';
import { join } from 'node:path';
import type { ExtractorLoaderOptionDict } from 'discord-player';

export const ClientIntents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildVoiceStates,
] as const;

export const RedisConfig = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
} as const;

export const CommandsPath = join(getDirname(import.meta.url), '..', 'commands');
export const EventsPath = join(getDirname(import.meta.url), '..', 'events');

export const DiscordPlayerOptions: DiscordPlayerConfig = {
  extractorConfig: {
    YouTubeExtractor: {},
    SoundCloudExtractor: {},
    AppleMusicExtractor: {},
    SpotifyExtractor: {},
    VimeoExtractor: {},
    ReverbnationExtractor: {},
    AttachmentExtractor: {},
  },
  disableSources: [],
};

type DiscordPlayerConfig = {
  extractorConfig: ExtractorLoaderOptionDict;
  disableSources: (keyof ExtractorLoaderOptionDict)[];
};

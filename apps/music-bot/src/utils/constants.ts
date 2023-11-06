import { GatewayIntentBits } from 'discord.js';
import { getDirname } from './location.js';
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
export const ValidationsPath = join(
  getDirname(import.meta.url),
  '..',
  'validators'
);
export const PlayerEventsPath = join(
  getDirname(import.meta.url),
  '..',
  'player',
  'events'
);

export const EmbedColor = {
  Success: 0x00fa9a,
  Error: 0xff2a16,
  Warning: 0xffd700,
  Info: 0x00bfaf,
} as const;

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

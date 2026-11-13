import { GatewayIntentBits } from 'discord.js';

export const ClientIntents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] as const;

export const EmbedColor = {
  Success: 0x00fa9a,
  Error: 0xff2a16,
  Warning: 0xffd700,
  Info: 0x00bfaf,
} as const;

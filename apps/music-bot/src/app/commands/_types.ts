import type { ChatInputCommandInteraction, Client } from 'discord.js';
export interface ChatInputCommandContext {
  interaction: ChatInputCommandInteraction;
  client: Client;
}

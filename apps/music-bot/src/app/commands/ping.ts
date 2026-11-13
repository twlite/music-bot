import type { ChatInputCommandContext } from './_types.js';
import type { CommandData } from 'commandkit';

export const command: CommandData = {
  name: 'ping',
  description: 'Pong!',
};

export const chatInput = async ({ interaction, client }: ChatInputCommandContext) => {
  const clientLatency = client.ws.ping.toFixed(0);

  interaction.reply(`:ping_pong: Pong! ${clientLatency}ms`);
};

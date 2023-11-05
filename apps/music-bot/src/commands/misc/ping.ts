import type { CommandData, SlashCommandProps } from 'commandkit';

export const data: CommandData = {
  name: 'ping',
  description: 'Pong!',
};

export async function run({ interaction, client }: SlashCommandProps) {
  const clientLatency = client.ws.ping.toFixed(0);

  interaction.reply(`:ping_pong: Pong! ${clientLatency}ms`);
}

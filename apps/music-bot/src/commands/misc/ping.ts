import type { ChatInputCommandContext } from "#bot/commands/types";
import type { CommandData } from "commandkit";

export const data: CommandData = {
  name: "ping",
  description: "Pong!",
};

export async function run({ interaction, client }: ChatInputCommandContext) {
  const clientLatency = client.ws.ping.toFixed(0);

  interaction.reply(`:ping_pong: Pong! ${clientLatency}ms`);
}

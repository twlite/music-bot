import type { ChatInputCommandContext } from "#bot/commands/types";
import { EmbedGenerator } from "#bot/utils/EmbedGenerator";
import type { CommandData } from "commandkit";
import { useQueue } from "#bot/player/runtime";

export const data: CommandData = {
  name: "leave",
  description: "Disconnect the bot",
};

export async function run({ interaction }: ChatInputCommandContext) {
  if (!interaction.inCachedGuild()) return;

  await interaction.deferReply();

  const queue = useQueue(interaction.guildId);

  if (!queue) {
    const embed = EmbedGenerator.Error({
      title: "Not playing",
      description: "I am not playing anything right now",
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  await queue.delete();

  const embed = EmbedGenerator.Success({
    title: "Disconnected!",
    description: "I have successfully left the voice channel.",
  }).withAuthor(interaction.user);

  return interaction.editReply({ embeds: [embed] });
}

import type { ChatInputCommandContext } from "#bot/commands/types";
import { EmbedGenerator } from "#bot/utils/EmbedGenerator";
import type { CommandData } from "commandkit";
import { useQueue } from "#bot/player/runtime";

export const data: CommandData = {
  name: "stop",
  description: "Stop the player",
};

export async function run({ interaction }: ChatInputCommandContext) {
  if (!interaction.inCachedGuild()) return;

  await interaction.deferReply();

  const queue = useQueue(interaction.guildId);

  if (!queue?.isPlaying()) {
    const embed = EmbedGenerator.Error({
      title: "Not playing",
      description: "I am not playing anything right now",
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  await queue.node.stop();

  const embed = EmbedGenerator.Success({
    title: "Track stopped!",
    description: "I have successfully stopped the track.",
  }).withAuthor(interaction.user);

  return interaction.editReply({ embeds: [embed] });
}

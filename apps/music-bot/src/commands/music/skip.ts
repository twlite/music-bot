import type { ChatInputCommandContext } from "#bot/commands/types";
import { EmbedGenerator } from "#bot/utils/EmbedGenerator";
import type { CommandData } from "commandkit";
import { useQueue } from "#bot/player/runtime";

export const data: CommandData = {
  name: "skip",
  description: "Skip to the next track",
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

  await queue.node.skip();

  const embed = EmbedGenerator.Success({
    title: "Track skipped!",
    description: "I have successfully skipped to the next track.",
  }).withAuthor(interaction.user);

  return interaction.editReply({ embeds: [embed] });
}

import type { ChatInputCommandContext } from "#bot/commands/types";
import { EmbedGenerator } from "#bot/utils/EmbedGenerator";
import type { CommandData } from "commandkit";
import { useTimeline } from "#bot/player/runtime";

export const data: CommandData = {
  name: "resume",
  description: "Resume the current song",
};

export async function run({ interaction }: ChatInputCommandContext) {
  if (!interaction.inCachedGuild()) return;

  await interaction.deferReply();

  const timeline = useTimeline(interaction.guildId);

  if (!timeline?.track) {
    const embed = EmbedGenerator.Error({
      title: "Not playing",
      description: "I am not playing anything right now",
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  if (!timeline.paused) {
    const embed = EmbedGenerator.Error({
      title: "Error",
      description: "The track is not paused",
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  await timeline.resume();

  const embed = EmbedGenerator.Success({
    title: "Resumed",
    description: "I have successfully resumed the track.",
  }).withAuthor(interaction.user);

  return interaction.editReply({ embeds: [embed] });
}

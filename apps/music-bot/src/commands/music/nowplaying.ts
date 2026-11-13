import type { ChatInputCommandContext } from "#bot/commands/types";
import { EmbedGenerator } from "#bot/utils/EmbedGenerator";
import type { CommandData } from "commandkit";
import { usePlayer, useTimeline } from "#bot/player/runtime";

export const data: CommandData = {
  name: "nowplaying",
  description: "View the currently playing song",
};

export async function run({ interaction }: ChatInputCommandContext) {
  if (!interaction.inCachedGuild()) return;

  await interaction.deferReply();

  const node = usePlayer(interaction.guildId)!;
  const timeline = useTimeline(interaction.guildId);

  // this will also verify if usePlayer's value is null
  if (!timeline?.track) {
    const embed = EmbedGenerator.Error({
      title: "Not playing",
      description: "I am not playing anything right now",
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  const { track, timestamp } = timeline;

  const embed = EmbedGenerator.Info({
    title: "Now Playing",
    description: `[${track.title}](${track.url})`,
    fields: [{ name: "Progress", value: node.createProgressBar()! }],
    thumbnail: { url: track.thumbnail },
    footer: {
      text: `Requested by ${String(track.requestedBy ?? "unknown")} • ${timestamp?.progress ?? 0}%`,
      iconURL: undefined,
    },
  }).withAuthor(interaction.user);

  return interaction.editReply({ embeds: [embed] });
}

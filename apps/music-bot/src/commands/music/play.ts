import type { ChatInputCommandContext } from "#bot/commands/types";
import { queueDefaults } from "#bot/player/effects";
import { PlayerMetadata } from "#bot/player/PlayerMetadata";
import { fetchPlayerOptions } from "#bot/player/playerOptions";
import { EmbedGenerator } from "#bot/utils/EmbedGenerator";
import type { CommandData } from "commandkit";

import { useMainPlayer } from "#bot/player/runtime";
import { ApplicationCommandOptionType } from "discord.js";

export const data: CommandData = {
  name: "play",
  description: "Play a song",
  options: [
    {
      name: "query",
      description:
        'The track or playlist to play. Custom playlist id must be prefixed with "playlist:"',
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
      required: true,
    },
  ],
};

export async function run({ interaction }: ChatInputCommandContext) {
  if (!interaction.inCachedGuild()) return;
  const player = useMainPlayer();
  const channel = interaction.member.voice.channel!;
  const query = interaction.options.getString("query", true);

  await interaction.deferReply();

  const result = await player.search(query, {
    requestedBy: interaction.user.id,
  });

  if (!result.tracks.length) {
    const embed = EmbedGenerator.Error({
      title: "No results found",
      description: `No results found for \`${query}\``,
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  try {
    const playerOptions = await fetchPlayerOptions(interaction.guildId);

    const { searchResult } = await player.play(channel, result, {
      nodeOptions: {
        metadata: PlayerMetadata.create(interaction),
        ...queueDefaults(playerOptions),
      },
      requestedBy: interaction.user.id,
      selfDeaf: true,
    });

    const embed = EmbedGenerator.Info({
      title: `${Boolean(searchResult.playlist) ? "Playlist" : "Track"} queued!`,
      thumbnail: { url: searchResult.tracks[0].thumbnail },
      description: `[${searchResult.tracks[0].title}](${searchResult.tracks[0].url})`,
      fields: searchResult.playlist
        ? [{ name: "Playlist", value: searchResult.playlist.title }]
        : [],
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  } catch (e) {
    console.error(e);

    const embed = EmbedGenerator.Error({
      title: "Something went wrong",
      description: `Something went wrong while playing \`${query}\``,
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }
}

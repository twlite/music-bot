import { useMainPlayer } from "#bot/player/runtime";
import { Interaction } from "discord.js";

export default async function interactionCreate(interaction: Interaction) {
  if (!interaction.isAutocomplete() || interaction.commandName !== "play")
    return;
  const query = interaction.options.getString("query", true);

  if (!query.length) return interaction.respond([]);

  try {
    const player = useMainPlayer();

    const data = await player.search(query, {
      requestedBy: interaction.user.id,
    });

    if (!data.tracks.length) return interaction.respond([]);

    const results = data.tracks
      .filter((track) => track.url.length < 100)
      .slice(0, 10)
      .map((track) => ({
        name: track.title.slice(0, 100),
        value: track.url,
      }));

    return interaction.respond(results);
  } catch {
    return interaction.respond([]).catch(() => {});
  }
}

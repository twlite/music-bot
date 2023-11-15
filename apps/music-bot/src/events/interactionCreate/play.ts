import { useRedis } from '#bot/hooks/useRedis';
import { useMainPlayer } from 'discord-player';
import { Interaction } from 'discord.js';

export default async function interactionCreate(interaction: Interaction) {
  if (!interaction.isAutocomplete() || interaction.commandName !== 'play')
    return;
  const query = interaction.options.getString('query', true);

  if (!query.length) return interaction.respond([]);

  try {
    // autocomplete custom playlists from cache
    if (query.startsWith('playlist:')) {
      const redis = useRedis();

      try {
        const result = await redis.get(`discord-player:custom-${query}`);
        if (result) {
          const parsed = JSON.parse(result);

          return interaction.respond([
            {
              name: parsed.name.slice(0, 100),
              value: parsed.url,
            },
          ]);
        }
      } catch {
        // fall back to default search
      }
    }

    const player = useMainPlayer();

    const data = await player.search(query, { requestedBy: interaction.user });

    if (!data.hasTracks()) return interaction.respond([]);

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

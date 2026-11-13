import { EmbedGenerator } from '@/utils/embed-generator';
import { splitLyrics } from '@/utils/split-lyrics';
import type { CommandData } from 'commandkit';
import { ApplicationCommandOptionType } from 'discord.js';
import type { ChatInputCommandContext } from './_types.js';
import { useMainPlayer, useQueue } from '@/player/runtime';
import { getLyrics } from '@/web/lyrics';

export const command: CommandData = {
  name: 'lyrics',
  description: 'Show lyrics for the playing track or search for a song',
  options: [
    {
      name: 'query',
      description: 'Song title and artist; omit to use the playing track',
      type: ApplicationCommandOptionType.String,
      required: false,
      min_length: 1,
      max_length: 200,
    },
  ],
};

export const chatInput = async ({ interaction }: ChatInputCommandContext) => {
  if (!interaction.inCachedGuild()) return;
  const query = interaction.options.getString('query')?.trim() ?? '';
  const queue = useQueue();
  const allowedMentions = { parse: [] as never[] };
  if (!query && !queue?.currentTrack) {
    await interaction.reply({
      content: 'Nothing is playing. Use /lyrics query:<song title and artist> to search.',
      flags: 64,
      allowedMentions,
    });
    return;
  }

  await interaction.deferReply();
  let text = '';
  try {
    if (queue?.currentTrack) {
      const lyrics = await getLyrics(queue, query, query ? 0 : undefined);
      if (lyrics.status === 'error') throw new Error('Lyrics unavailable');
      text = lyrics.plain ?? lyrics.lines.map((line) => line.line).join('\n');
    } else {
      const results = await useMainPlayer().lyrics.search(query, { signal: AbortSignal.timeout(10000) });
      const result = results.find((result) => result.plain.available || result.synced.available);
      text = result?.plain.available
        ? result.plain.text
        : result?.synced.available
          ? result.synced.lines.map((line) => line.line).join('\n')
          : '';
    }
  } catch {
    await interaction.editReply({ content: 'Could not load lyrics right now. Please try again.', allowedMentions });
    return;
  }

  if (!text.trim()) {
    await interaction.editReply({
      content: 'No lyrics found. Try /lyrics with the song title and artist.',
      allowedMentions,
    });
  } else if (text.length <= 2000) {
    await interaction.editReply({ content: text, allowedMentions });
  } else {
    const parts = splitLyrics(text);
    for (const [index, description] of parts.entries()) {
      const message = {
        embeds: [
          EmbedGenerator.Info({
            title: parts.length > 1 ? `Lyrics · ${index + 1}/${parts.length}` : 'Lyrics',
            description,
          }),
        ],
        allowedMentions,
      };
      if (index === 0) await interaction.editReply(message);
      else await interaction.followUp(message);
    }
  }
};

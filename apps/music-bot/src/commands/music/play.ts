import type {
  CommandData,
  CommandOptions,
  SlashCommandProps,
} from 'commandkit';
import { useMainPlayer } from 'discord-player';
import { ApplicationCommandOptionType, SlashCommandBuilder } from 'discord.js';

export const data: CommandData = {
  name: 'play',
  description: 'Play a song',
  options: [
    {
      name: 'query',
      description: 'The track or playlist to play',
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
      required: true,
    },
  ],
};

export async function run({ interaction, client }: SlashCommandProps) {
  const player = useMainPlayer();

  const query = interaction.options.getString('query', true);
}

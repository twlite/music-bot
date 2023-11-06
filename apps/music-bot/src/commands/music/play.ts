import type { SlashCommandProps } from 'commandkit';
import { useMainPlayer } from 'discord-player';
import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder().addStringOption((option) =>
  option
    .setName('query')
    .setDescription('The track or playlist to play')
    .setRequired(true)
    .setAutocomplete(true)
);

export async function run({ interaction, client }: SlashCommandProps) {
  const player = useMainPlayer();

  const query = interaction.options.getString('query', true);
}

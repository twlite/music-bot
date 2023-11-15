import { generateSession } from '#bot/player/session';
import { EmbedGenerator } from '#bot/utils/EmbedGenerator';
import type { CommandData, SlashCommandProps } from 'commandkit';
import { useQueue } from 'discord-player';
import { ButtonStyle, ComponentType } from 'discord.js';

export const data: CommandData = {
  name: 'web',
  description: 'Get address to the web interface',
};

export async function run({ interaction }: SlashCommandProps) {
  if (!interaction.inCachedGuild()) return;

  await interaction.deferReply({ ephemeral: true });

  const queue = useQueue(interaction.guildId);

  if (!queue) {
    const embed = EmbedGenerator.Error({
      title: 'Not playing',
      description:
        'I am not playing anything right now. You have to play something before you can use the web interface.',
    }).withAuthor(interaction.user);

    return interaction.editReply({ embeds: [embed] });
  }

  const session = await generateSession(interaction.user, interaction.guild);

  return interaction.editReply({
    content: `✅ | Web interface session has been generated for **${interaction.user.displayName}** with guild **${interaction.guild.name}**!\n**⚠️ PLEASE DO NOT SHARE THIS LINK WITH ANYONE ELSE**\n\n[Open Web Interface](${process.env.WEB_INTERFACE_URL}/?session=${session})`,

    // FUCK YOU DISCORD FOR 512 LENGTH HARD LIMIT
    // components: [
    //   {
    //     components: [
    //       {
    //         type: ComponentType.Button,
    //         style: ButtonStyle.Link,
    //         label: 'Open',
    //         emoji: '🌐',
    //         url: `${process.env.WEB_INTERFACE_URL}/?session=${session}`,
    //       },
    //     ],
    //     type: ComponentType.ActionRow,
    //   },
    // ],
  });
}

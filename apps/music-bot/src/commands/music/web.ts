import { generateSession } from '#bot/player/session';
import type { CommandData, SlashCommandProps } from 'commandkit';
import { ButtonStyle, ComponentType } from 'discord.js';

export const data: CommandData = {
  name: 'web',
  description: 'Get address to the web interface',
};

export async function run({ interaction }: SlashCommandProps) {
  if (!interaction.inCachedGuild()) return;

  await interaction.deferReply({ ephemeral: true });

  const session = await generateSession(interaction.user, interaction.guild);

  const url = `${process.env.WEB_INTERFACE_URL}/?session=${session.token}`;

  return interaction.editReply({
    content: `✅ | Web interface session has been generated for **${session.data.displayName}** with guild **${session.data.guildName}**!\n**⚠️ PLEASE DO NOT SHARE THIS LINK WITH ANYONE ELSE**`,
    components: [
      {
        components: [
          {
            type: ComponentType.Button,
            style: ButtonStyle.Link,
            label: 'Open',
            emoji: '🌐',
            url,
          },
        ],
        type: ComponentType.ActionRow,
      },
    ],
  });
}

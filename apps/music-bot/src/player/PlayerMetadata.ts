import { CommandInteraction } from 'discord.js';

export class PlayerMetadata {
  public constructor(public interaction: CommandInteraction) {
    if (!interaction.inGuild()) {
      throw new Error('PlayerMetadata can only be created from a guild');
    }

    if (!interaction.channelId) {
      throw new Error('PlayerMetadata can only be created from a channel');
    }
  }

  public get channel() {
    return this.interaction.channel!;
  }

  public get guild() {
    return this.interaction.guild!;
  }

  public static create(interaction: CommandInteraction) {
    return new PlayerMetadata(interaction);
  }
}

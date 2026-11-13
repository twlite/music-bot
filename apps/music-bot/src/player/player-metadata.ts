import {
  CommandInteraction,
  Guild,
  GuildChannel,
  TextBasedChannel,
  VoiceChannel,
} from "discord.js";

type ChannelInferrable = {
  channel: TextBasedChannel | VoiceChannel;
  guild?: Guild;
};

export class PlayerMetadata {
  public constructor(public data: ChannelInferrable) {
    if (data.channel.isDMBased()) {
      throw new Error("PlayerMetadata cannot be created from a DM");
    }

    if (!data.channel) {
      throw new Error("PlayerMetadata can only be created from a channel");
    }
  }

  public get channel() {
    return this.data.channel!;
  }

  public get guild() {
    return this.data.guild || (this.data.channel as GuildChannel).guild;
  }

  public static create(data: ChannelInferrable | CommandInteraction) {
    if (data instanceof CommandInteraction) {
      if (!data.inGuild()) {
        throw new Error("PlayerMetadata cannot be created from a DM");
      }

      return new PlayerMetadata({ channel: data.channel!, guild: data.guild! });
    }

    return new PlayerMetadata(data);
  }
}

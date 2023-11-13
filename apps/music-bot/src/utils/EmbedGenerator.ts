import { EmbedBuilder, UserResolvable } from 'discord.js';
import { EmbedColor } from './constants.js';
import { useClient } from '#bot/hooks/useClient';

type EmbedInit = ConstructorParameters<typeof EmbedBuilder>[0];

export class EmbedGenerator extends EmbedBuilder {
  public static Error(data?: EmbedInit) {
    return EmbedGenerator.create(data).setColor(EmbedColor.Error);
  }

  public static Success(data?: EmbedInit) {
    return EmbedGenerator.create(data).setColor(EmbedColor.Success);
  }

  public static Warning(data?: EmbedInit) {
    return EmbedGenerator.create(data).setColor(EmbedColor.Warning);
  }

  public static Info(data?: EmbedInit) {
    return EmbedGenerator.create(data).setColor(EmbedColor.Info);
  }

  public static create(data?: EmbedInit) {
    const client = useClient();
    return new EmbedGenerator(data).setClient(client);
  }

  public client: ReturnType<typeof useClient> | null = null;

  public setClient(client: ReturnType<typeof useClient>) {
    this.client = client;
    return this;
  }

  public withAuthor(user: UserResolvable) {
    if (!this.client) return this;
    const author = this.client.users.resolve(user);
    if (!author) return this;

    return this.setAuthor({
      name: author.username,
      iconURL: author.displayAvatarURL(),
    });
  }
}

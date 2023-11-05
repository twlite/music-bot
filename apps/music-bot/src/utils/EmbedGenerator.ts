import { EmbedBuilder } from 'discord.js';
import { EmbedColor } from './constants';

type EmbedInit = ConstructorParameters<typeof EmbedBuilder>[0];

export class EmbedGenerator extends EmbedBuilder {
  public static Error(data?: EmbedInit) {
    return new EmbedGenerator(data).setColor(EmbedColor.Error);
  }

  public static Success(data?: EmbedInit) {
    return new EmbedGenerator(data).setColor(EmbedColor.Success);
  }

  public static Warning(data?: EmbedInit) {
    return new EmbedGenerator(data).setColor(EmbedColor.Warning);
  }

  public static Info(data?: EmbedInit) {
    return new EmbedGenerator(data).setColor(EmbedColor.Info);
  }

  public static create(data?: EmbedInit) {
    return new EmbedGenerator(data);
  }
}

import { Schema, SchemaTypes, model } from 'mongoose';

export interface IGuildSchema {
  id: string;
  volume: number;
  equalizer: number[];
  filters: string[];
  loopMode: 0 | 1 | 2 | 3;
  createdAt: Date;
  updatedAt: Date;
}

export const GuildSchema = new Schema<IGuildSchema>(
  {
    id: {
      type: SchemaTypes.String,
      required: true,
      unique: true,
    },
    volume: {
      type: SchemaTypes.Number,
      default: 50,
      min: 0,
      max: 100,
    },
    equalizer: {
      type: [SchemaTypes.Number],
      default: Array.from({ length: 15 }, () => 0),
    },
    filters: {
      type: [SchemaTypes.String],
      default: [],
    },
    loopMode: {
      type: SchemaTypes.Number,
      default: 0,
      min: 0,
      max: 3,
    },
  },
  {
    timestamps: true,
  }
);

export const GuildModel = model<IGuildSchema>('Guild', GuildSchema);

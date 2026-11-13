import { randomUUID } from "node:crypto";
import { SerializedTrack } from "discord-player";
import { Schema, SchemaTypes, model } from "mongoose";

export interface IPlaylistSchema {
  id: string;
  name: string;
  author: string;
  tracks: SerializedTrack[];
  private: boolean;
  unlisted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const PlaylistSchema = new Schema<IPlaylistSchema>(
  {
    id: {
      type: SchemaTypes.String,
      required: true,
      unique: true,
      default: () => randomUUID(),
    },
    author: {
      type: SchemaTypes.String,
      required: true,
    },
    name: {
      type: SchemaTypes.String,
      required: true,
      maxlength: 100,
      trim: true,
    },
    private: {
      type: SchemaTypes.Boolean,
      default: false,
    },
    unlisted: {
      type: SchemaTypes.Boolean,
      default: false,
    },
    tracks: {
      type: [SchemaTypes.Mixed as any],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

PlaylistSchema.index({ author: 1, createdAt: -1 });
PlaylistSchema.index({ private: 1, unlisted: 1 });

export const PlaylistModel = model<IPlaylistSchema>("Playlist", PlaylistSchema);

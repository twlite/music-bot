import { config } from "@/config";
import mongoose from "mongoose";
import { HooksRegistry, Symbols } from "@/hooks/registry";
import { GuildModel } from "./mongo/Guild.schema.js";
import { PlaylistModel } from "./mongo/Playlist.Schema.js";

const db = await mongoose.connect(
  process.env.DATABASE_URL || config.database.url,
);

console.log("Connected to the database");

export class MongoDatabase {
  public guild = GuildModel;
  public playlist = PlaylistModel;

  public constructor(public mongo: typeof db) {}
}

HooksRegistry.set(Symbols.kDatabase, new MongoDatabase(db));

export { db };

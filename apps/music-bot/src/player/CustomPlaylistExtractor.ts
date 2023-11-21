import { useDatabase } from '#bot/hooks/useDatabase';
import {
  BaseExtractor,
  ExtractorInfo,
  ExtractorSearchContext,
  SearchQueryType,
  SerializedTrack,
  Track,
  deserialize,
} from 'discord-player';
import type { MongoDatabase } from '#bot/bootstrap/database';

export class CustomPlaylistExtractor extends BaseExtractor {
  private db: MongoDatabase | null = null;
  public static identifier = 'custom-playlist-extractor' as const;

  public async activate() {
    this.db = useDatabase();
    this.protocols = ['playlist'];
  }

  public async deactivate(): Promise<void> {
    this.db = null;
    this.protocols = [];
  }

  public async validate(
    query: string,
    type?: SearchQueryType | null | undefined
  ): Promise<boolean> {
    const regex = new RegExp(
      `/^(${this.protocols.join(
        '|'
      )}:)?[a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12}$/`
    );

    return regex.test(query);
  }

  public async handle(
    query: string,
    context: ExtractorSearchContext
  ): Promise<ExtractorInfo> {
    if (!this.db) return this.createResponse();

    const id = query.startsWith('playlist:')
      ? query.split('playlist:')[1]
      : query;
    const result = await this.db.playlist.findOne({
      id,
    });

    if (
      !result ||
      (result.author !== context.requestedBy?.id && result.private)
    )
      return this.createResponse();

    const playlist = this.context.player.createPlaylist({
      author: {
        name:
          this.context.player.client.users.resolve(result.author)
            ?.displayName ?? result.author,
        url: '',
      },
      description: '',
      id: result.id,
      source: 'arbitrary',
      thumbnail: '',
      title: result.name,
      tracks: [],
      type: 'playlist',
      url: '',
    });

    const tracks = result.tracks.map((track) => {
      const song = deserialize(
        this.context.player,
        track as SerializedTrack
      ) as Track<unknown>;

      song.playlist = playlist;

      return song;
    });

    playlist.tracks = tracks;

    return this.createResponse(playlist, tracks);
  }
}

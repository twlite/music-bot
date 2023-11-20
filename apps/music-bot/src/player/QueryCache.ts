import {
  serialize,
  DiscordPlayerQueryResultCache,
  type QueryCacheProvider,
  type QueryCacheResolverContext,
  SearchResult,
  type Track,
  deserialize,
  useMainPlayer,
  SerializedTrack,
  SerializedPlaylist,
  Playlist,
} from 'discord-player';
import type { Redis } from 'ioredis';

export class RedisQueryCache implements QueryCacheProvider<Track> {
  public EXPIRY_TIMEOUT = 3600 * 5;
  public constructor(public redis: Redis) {}

  private createKey(id: string) {
    return `discord-player:query-cache:${id}` as const;
  }

  public async addData(data: SearchResult): Promise<void> {
    const key = this.createKey(data.query);
    const serialized = JSON.stringify(
      data.playlist
        ? serialize(data.playlist)
        : data.tracks.map((track) => serialize(track))
    );

    await this.redis.setex(key, this.EXPIRY_TIMEOUT, serialized);
  }

  public async getData(): Promise<
    DiscordPlayerQueryResultCache<Track<unknown>>[]
  > {
    const player = useMainPlayer();

    const data = await this.redis.keys(this.createKey('*'));

    const serialized = await this.redis.mget(data);

    const parsed = serialized
      .filter(Boolean)
      .map((item) => deserialize(player, JSON.parse(item!))) as Track[];

    const res = parsed.map(
      (item) => new DiscordPlayerQueryResultCache(item, 0)
    );

    return res;
  }

  public async resolve(
    context: QueryCacheResolverContext
  ): Promise<SearchResult> {
    const player = useMainPlayer();

    try {
      const key = this.createKey(context.query);

      const serialized = await this.redis.get(key);
      if (!serialized) throw new Error('No data found');

      const raw = JSON.parse(serialized) as
        | SerializedTrack[]
        | SerializedPlaylist;

      const parsed = Array.isArray(raw)
        ? (raw.map((item) => deserialize(player, item)) as Track[])
        : (deserialize(player, raw) as Playlist);

      return new SearchResult(player, {
        query: context.query,
        extractor: Array.isArray(parsed)
          ? parsed[0].extractor
          : parsed?.tracks[0].extractor,
        tracks: Array.isArray(parsed) ? parsed : parsed.tracks,
        requestedBy: context.requestedBy,
        playlist: Array.isArray(parsed) ? null : parsed,
        queryType: context.queryType,
      });
    } catch {
      return new SearchResult(player, {
        query: context.query,
        extractor: null,
        tracks: [],
        requestedBy: context.requestedBy,
        playlist: null,
        queryType: context.queryType,
      });
    }
  }
}

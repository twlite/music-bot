import { usePrisma } from '#bot/hooks/usePrisma';
import { PrismaClient } from '@prisma/client';
import {
  BaseExtractor,
  ExtractorInfo,
  ExtractorSearchContext,
  SearchQueryType,
  SerializedTrack,
  Track,
  deserialize,
} from 'discord-player';

export class CustomPlaylistExtractor extends BaseExtractor {
  private prisma: PrismaClient | null = null;
  public static identifier = 'custom-playlist-extractor' as const;

  public async activate() {
    this.prisma = usePrisma();
    this.protocols = ['playlist'];
  }

  public async deactivate(): Promise<void> {
    this.prisma = null;
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
    if (!this.prisma) return this.createResponse();

    const id = query.startsWith('playlist')
      ? query.split('playlist:')[1]
      : query;
    const result = await this.prisma.playlist.findUnique({
      where: {
        id,
      },
    });

    if (
      !result ||
      (result.authorId !== context.requestedBy?.id && result.private)
    )
      return this.createResponse();

    const playlist = this.context.player.createPlaylist({
      author: {
        name:
          this.context.player.client.users.resolve(result.authorId)
            ?.displayName ?? result.authorId,
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

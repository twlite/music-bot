import { usePrisma } from '#bot/hooks/usePrisma';
import { useRedis } from '#bot/hooks/useRedis';
import { Client } from 'discord.js';

export default async function loadCustomPlaylistsCache(client: Client<true>) {
  const db = usePrisma();
  const redis = useRedis();

  const playlists = await db.playlist.findMany({
    where: {
      private: false,
      unlisted: false,
    },
  });

  if (!playlists.length) return;

  const resolvedList = new Map<string, string>();

  await Promise.all(
    playlists.map(async (list) => {
      const user = await client.users
        .fetch(list.authorId)
        .then((u) => u.displayName)
        .catch(() => list.authorId);

      resolvedList.set(
        `discord-player:custom-playlist:${list.id}`,
        JSON.stringify({
          id: list.id,
          name: list.name,
          author: user,
          url: `playlist:${list.id}`,
          trackCount: list.tracks.length,
        })
      );
    })
  );

  await redis.mset(resolvedList);
}

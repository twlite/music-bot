import { useQueue } from '@/player/runtime';

/** Resolve IDs only against this guild's upcoming queue, rejecting stale dashboard edits. */
export function editQueue(
  guildId: string,
  trackId: string,
  action: 'remove' | 'move' | 'next',
  beforeId: string | null = null,
) {
  const queue = useQueue(guildId);
  const tracks = queue?.tracks.toArray() ?? [];
  const track = tracks.find((item) => item.id === trackId);
  if (!queue || !track) throw new Error('This queued track is no longer available.');
  if (action === 'remove') return queue.removeTrack(track);
  if (beforeId === trackId) return;
  const remaining = tracks.filter((item) => item.id !== trackId);
  const destination =
    action === 'next' ? 0 : beforeId === null ? remaining.length : remaining.findIndex((item) => item.id === beforeId);
  if (destination < 0) throw new Error('The queue changed. Try the move again.');
  queue.moveTrack(track, destination);
}

export async function seek(guildId: string, trackId: string, positionMs: number) {
  const queue = useQueue(guildId);
  const track = queue?.currentTrack;
  if (!queue || !track || track.id !== trackId) throw new Error('The playing track changed.');
  if (track.live || !track.durationMS || positionMs >= track.durationMS)
    throw new Error('This position cannot be played.');
  await queue.node.seek(positionMs);
}

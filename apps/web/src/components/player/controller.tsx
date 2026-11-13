import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useSocket, useSocketEvent } from '@/context/socket.context';
import { usePlayback } from '@/hooks/use-playback';
import { AlbumCover } from './album-cover';
import { VolumeController } from './volume-controller';
import { TimelineActions } from './timeline-actions';
import { TrackProgress } from './track-progress';
import { Equalizer } from './equalizer';
import { QueueList, RequestedBy } from './queue-list';
import { Lyrics } from './lyrics';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MixerHorizontalIcon, ListBulletIcon, ReaderIcon } from '@radix-ui/react-icons';

export function PlayerController({ showArt: _showArt = false }) {
  const { state, position } = usePlayback();
  const { send } = useSocket();
  const { toast } = useToast();
  const [tab, setTab] = useState('queue');
  const track = state?.track ?? null;
  const onVolumeChange = useCallback((volume: number) => send('volume', volume), [send]);

  useSocketEvent('queued', ({ data, playlist }) =>
    toast({
      title: `${playlist ? 'Playlist' : 'Track'} queued`,
      description: data.title,
      variant: 'success',
      duration: 3000,
    }),
  );
  useSocketEvent('error', (description) =>
    toast({ title: 'Unable to complete action', description, variant: 'destructive', duration: 5000 }),
  );

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Your server, your soundtrack
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Listening room</h1>
        </div>
        <Badge variant="secondary">{state?.listeners ?? 0} listening</Badge>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.6fr)]">
        <Card className="overflow-hidden lg:sticky lg:top-6">
          <CardContent className="space-y-6 p-6">
            <div className="relative mx-auto aspect-square w-full max-w-80 overflow-hidden rounded-xl bg-muted shadow-lg">
              <AlbumCover
                icon={track?.thumbnail}
                fallback={track?.title ?? 'Nothing playing'}
                className="h-full w-full rounded-none [&>svg]:h-24 [&>svg]:w-24"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">Now playing</span>
                {track?.live && <Badge variant="outline">Live</Badge>}
              </div>
              <h2 className="line-clamp-2 text-xl font-semibold leading-tight">
                {track ? (
                  <Link
                    href={/^https?:\/\//.test(track.url) ? track.url : '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    {track.title}
                  </Link>
                ) : (
                  'The room is quiet'
                )}
              </h2>
              <p className="truncate text-sm text-muted-foreground">
                {track?.author ?? 'Join a voice channel and start a song with /play.'}
              </p>
              {track && <RequestedBy track={track} />}
            </div>
            <TrackProgress
              trackId={track?.id}
              position={position}
              total={state?.timestamp?.total.value ?? 0}
              disabled={!track || track.live}
            />
            <div className={!track ? 'pointer-events-none opacity-40' : ''}>
              <div className="flex justify-center">
                <TimelineActions paused={state?.paused ?? true} shuffle={state?.shuffle ?? false} />
              </div>
            </div>
            <div className="flex items-center gap-5 border-t pt-5">
              <div className="min-w-0 flex-1">
                <VolumeController volume={state?.volume ?? 50} onChange={onVolumeChange} />
              </div>
              <Select
                value={String(state?.repeatMode ?? 0)}
                disabled={!track}
                onValueChange={(value) => send('loop', Number(value) as 0 | 1 | 2 | 3)}
              >
                <SelectTrigger aria-label="Repeat mode" className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Repeat off</SelectItem>
                  <SelectItem value="1">Repeat track</SelectItem>
                  <SelectItem value="2">Repeat queue</SelectItem>
                  <SelectItem value="3">Autoplay</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardContent className="p-4 sm:p-6">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="mb-6 grid w-full grid-cols-3">
                <TabsTrigger value="queue">
                  <ListBulletIcon className="mr-2" />
                  Queue
                </TabsTrigger>
                <TabsTrigger value="lyrics">
                  <ReaderIcon className="mr-2" />
                  Lyrics
                </TabsTrigger>
                <TabsTrigger value="effects">
                  <MixerHorizontalIcon className="mr-2" />
                  Sound
                </TabsTrigger>
              </TabsList>
              <TabsContent value="queue" forceMount hidden={tab !== 'queue'}>
                <QueueList />
              </TabsContent>
              <TabsContent value="lyrics">
                {tab === 'lyrics' && <Lyrics track={track} position={position} />}
              </TabsContent>
              <TabsContent value="effects">{tab === 'effects' && <Equalizer state={state} />}</TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

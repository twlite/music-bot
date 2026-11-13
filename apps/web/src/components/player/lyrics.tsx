import { useEffect, useRef, useState } from 'react';
import type { DashboardLyrics, SerializedTrack } from '@music-bot/shared';
import { useSocket, useSocketEvent } from '@/context/socket.context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { activeLyricIndex } from '@/lib/playback';
import { cn } from '@/lib/utils';

export function Lyrics({ track, position }: { track: SerializedTrack | null; position: number }) {
  const { send } = useSocket();
  const [lyrics, setLyrics] = useState<DashboardLyrics | null>(null);
  const [follow, setFollow] = useState(true);
  const activeLine = useRef<HTMLButtonElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const index = activeLyricIndex(lyrics?.lines ?? [], position);

  useEffect(() => {
    setLyrics(null);
    setFollow(true);
    if (track) send('lyrics', { trackId: track.id });
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [track?.id, send]);

  useSocketEvent('lyrics', (result) => {
    if (result.trackId === track?.id) setLyrics(result);
  });

  useEffect(() => {
    if (follow && index >= 0)
      activeLine.current?.scrollIntoView({
        block: 'center',
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
  }, [follow, index]);

  const seek = (positionMs: number) => {
    if (!track) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => send('seek', { trackId: track.id, positionMs }), 300);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Lyrics</h2>
          {!!lyrics?.lines.length && <Badge variant="secondary">Synced</Badge>}
        </div>
        <Button
          size="sm"
          variant={follow ? 'secondary' : 'outline'}
          onClick={() => setFollow(!follow)}
          disabled={!lyrics?.lines.length}
        >
          {follow ? 'Following' : 'Follow playback'}
        </Button>
      </div>
      <ScrollArea
        className="h-[485px] rounded-xl bg-gradient-to-b from-primary/5 to-transparent"
        onWheel={() => setFollow(false)}
      >
        {!track ? (
          <p className="p-10 text-center text-sm text-muted-foreground">Play a track to see its lyrics.</p>
        ) : !lyrics ? (
          <div className="space-y-6 px-8 py-16" role="status" aria-label="Loading lyrics">
            {[80, 65, 90, 55, 75].map((width, i) => (
              <div key={i} className="h-6 animate-pulse rounded bg-muted" style={{ width: `${width}%` }} />
            ))}
          </div>
        ) : lyrics.status !== 'ready' ? (
          <div className="px-8 py-24 text-center">
            <p className="font-medium">
              {lyrics.status === 'error' ? 'Lyrics could not be loaded' : 'No lyrics found for this track'}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {lyrics.status === 'error'
                ? 'The lyrics provider may be temporarily unavailable.'
                : 'Instrumental tracks and some recordings do not have lyrics.'}
            </p>
          </div>
        ) : lyrics.lines.length ? (
          <div className="space-y-4 px-6 py-16 sm:px-10">
            {lyrics.lines.map((line, i) => (
              <button
                key={`${line.timestampMs}-${i}`}
                ref={i === index ? activeLine : undefined}
                onClick={() => seek(line.timestampMs)}
                className={cn(
                  'block w-full text-left text-xl font-semibold leading-relaxed transition-all duration-300 sm:text-2xl',
                  i === index ? 'scale-[1.02] text-primary' : 'text-muted-foreground/50 hover:text-foreground',
                )}
                aria-current={i === index ? 'true' : undefined}
                title="Seek to this line"
              >
                {line.line || '♪'}
              </button>
            ))}
          </div>
        ) : (
          <div className="px-8 py-12">
            <Badge variant="outline" className="mb-5">
              Unsynced lyrics
            </Badge>
            <p className="whitespace-pre-line text-lg leading-loose text-muted-foreground">{lyrics.plain}</p>
          </div>
        )}
      </ScrollArea>
      {lyrics?.status === 'ready' && (
        <p className="text-right text-[10px] text-muted-foreground">Lyrics via LRCLIB · Click a synced line to seek</p>
      )}
    </div>
  );
}

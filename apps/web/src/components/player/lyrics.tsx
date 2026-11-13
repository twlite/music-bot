import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { DashboardLyrics, SerializedTrack } from '@music-bot/shared';
import { useSocket, useSocketEvent } from '@/context/socket.context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { lyricChoiceLabel, lyricChoiceDetails } from '@/lib/lyric-choices';
import { activeLyricIndex } from '@/lib/playback';
import { cn } from '@/lib/utils';

let requestSequence = 0;

export function Lyrics({
  track,
  position,
  active = true,
}: {
  track: SerializedTrack | null;
  position: number;
  active?: boolean;
}) {
  const { send } = useSocket();
  const [lyrics, setLyrics] = useState<DashboardLyrics | null>(null);
  const [query, setQuery] = useState('');
  const activeRequest = useRef('');
  const requestedTrack = useRef<string | null>(null);
  const [follow, setFollow] = useState(true);
  const activeLine = useRef<HTMLButtonElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedChoice = lyrics?.choices?.find((choice) => choice.index === (lyrics.resultIndex ?? 0));
  const index = activeLyricIndex(lyrics?.lines ?? [], position);

  const request = (search = '', resultIndex?: number) => {
    if (!track) return;
    activeRequest.current = String(++requestSequence);
    requestedTrack.current = track.id;
    setLyrics(null);
    setFollow(true);
    send('lyrics', { trackId: track.id, query: search, resultIndex, requestId: activeRequest.current });
  };

  useEffect(() => {
    setQuery('');
    setLyrics(null);
    setFollow(true);
    activeRequest.current = '';
    requestedTrack.current = null;
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [track?.id, send]);

  useEffect(() => {
    if (active && track && requestedTrack.current !== track.id) request();
    if (!active && timer.current) clearTimeout(timer.current);
  }, [active, track?.id, send]);

  useSocketEvent('lyrics', (result) => {
    if (result.trackId === track?.id && result.requestId === activeRequest.current) setLyrics(result);
  });

  const search = (event: FormEvent) => {
    event.preventDefault();
    if (query.trim()) request(query.trim(), 0);
  };

  useEffect(() => {
    if (active && follow && index >= 0)
      activeLine.current?.scrollIntoView({
        block: 'center',
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
  }, [active, follow, index]);

  const seek = (positionMs: number) => {
    if (!track) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(
      () => send('seek', { trackId: track.id, positionMs: Math.min(positionMs, Math.max(0, track.durationMS - 1)) }),
      300,
    );
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
      <form className="flex gap-2" onSubmit={search}>
        <Input
          aria-label="Search lyrics"
          placeholder="Search by song title and artist…"
          value={query}
          maxLength={200}
          disabled={!track}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button type="submit" disabled={!track || !query.trim()}>
          Search
        </Button>
      </form>
      {lyrics?.query && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Results for “{lyrics.query}”</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery('');
              request();
            }}
          >
            Use track details
          </Button>
        </div>
      )}
      {(lyrics?.choices?.length ?? 0) > 1 && (
        <Select
          value={String(lyrics?.resultIndex ?? 0)}
          onValueChange={(index) => request(lyrics?.query ?? '', Number(index))}
        >
          <SelectTrigger aria-label="Lyric match" className="text-left">
            <SelectValue>{selectedChoice ? lyricChoiceLabel(selectedChoice) : 'Choose a lyric version'}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {lyrics?.choices?.map((choice) => (
              <SelectItem
                key={choice.index}
                value={String(choice.index)}
                textValue={lyricChoiceLabel(choice)}
                className="py-2.5"
              >
                <span className="block space-y-1">
                  <span className="block font-medium">{lyricChoiceLabel(choice)}</span>
                  <span className="block text-xs text-muted-foreground">
                    {choice.title} — {choice.artist} · {choice.synced ? 'Synced' : 'Plain text'}
                  </span>
                  <span className="block text-xs tabular-nums text-muted-foreground">{lyricChoiceDetails(choice)}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {selectedChoice && (
        <p className="text-xs tabular-nums text-muted-foreground">{lyricChoiceDetails(selectedChoice)}</p>
      )}
      {(lyrics?.choices?.length ?? 0) > 1 && (
        <p className="text-xs text-muted-foreground">
          Versions can have different timing. Choose the one that matches what you hear.
        </p>
      )}
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

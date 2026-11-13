import { useState, type FormEvent } from 'react';
import type { SerializedTrack } from '@music-bot/shared';
import { useSocket, useSocketEvent } from '@/context/socket.context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { DotsHorizontalIcon, DragHandleDots2Icon, PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { AlbumCover } from './album-cover';
import { cn } from '@/lib/utils';

export function RequestedBy({ track }: { track: SerializedTrack }) {
  const user = track.requestedBy;
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground" title={user?.id}>
      <Avatar className="h-5 w-5">
        <AvatarImage src={user?.displayAvatarURL ?? undefined} alt="" />
        <AvatarFallback className="text-[9px]">{user?.displayName.slice(0, 1) ?? '?'}</AvatarFallback>
      </Avatar>
      <span className="truncate">Queued by {user?.displayName ?? 'Autoplay'}</span>
    </span>
  );
}

export function QueueList() {
  const [tracks, setTracks] = useState<SerializedTrack[]>([]);
  const [query, setQuery] = useState('');
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const { send } = useSocket();
  useSocketEvent('queue', setTracks);

  function add(event: FormEvent) {
    event.preventDefault();
    if (query.trim()) {
      send('play', query.trim());
      setQuery('');
    }
  }

  const move = (trackId: string, beforeId: string | null) => send('queueMove', { trackId, beforeId });
  const drop = (beforeId: string | null) => {
    if (dragging && dragging !== beforeId) move(dragging, beforeId);
    setDragging(null);
    setOver(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Up next</h2>
          <p className="text-xs text-muted-foreground">Drag the handle to reorder. Right-click a track for more.</p>
        </div>
        <Badge variant="secondary">{tracks.length} tracks</Badge>
      </div>
      <form className="flex gap-2" onSubmit={add}>
        <Input
          aria-label="Track URL or search query"
          placeholder="Paste a link or search for a song…"
          value={query}
          maxLength={1000}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" disabled={!query.trim()}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add
        </Button>
      </form>
      <ScrollArea className="h-[440px] pr-3">
        {!tracks.length && (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed px-6 text-center">
            <h3 className="font-medium">Make room for your next favorite</h3>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Search above to add a track. Use /join in Discord first, then add a song here.
            </p>
          </div>
        )}
        <div className="space-y-1">
          {tracks.map((track, index) => {
            const items = [
              { label: 'Play next', disabled: index === 0, run: () => send('queueNext', { trackId: track.id }) },
              { label: 'Move up', disabled: index === 0, run: () => move(track.id, tracks[index - 1]?.id ?? null) },
              {
                label: 'Move down',
                disabled: index === tracks.length - 1,
                run: () => move(track.id, tracks[index + 2]?.id ?? null),
              },
              { label: 'Move to end', disabled: index === tracks.length - 1, run: () => move(track.id, null) },
              { label: 'Remove from queue', disabled: false, run: () => send('queueRemove', { trackId: track.id }) },
            ];
            return (
              <ContextMenu key={`${track.id}-${index}`}>
                <ContextMenuTrigger asChild>
                  <div
                    onDragOver={(e) => {
                      if (dragging) {
                        e.preventDefault();
                        setOver(track.id);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      drop(track.id);
                    }}
                    className={cn(
                      'group flex items-center gap-3 rounded-lg border border-transparent p-2 transition-colors hover:bg-muted/60',
                      over === track.id && dragging !== track.id && 'border-t-primary bg-primary/5',
                      dragging === track.id && 'opacity-40',
                    )}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-6 shrink-0 cursor-grab active:cursor-grabbing"
                      aria-label={`Reorder ${track.title}`}
                      title="Drag, or use Alt + arrow keys"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', track.id);
                        setDragging(track.id);
                      }}
                      onDragEnd={() => {
                        setDragging(null);
                        setOver(null);
                      }}
                      onKeyDown={(e) => {
                        if (!e.altKey) return;
                        if (e.key === 'ArrowUp' && index > 0) {
                          e.preventDefault();
                          move(track.id, tracks[index - 1].id);
                        }
                        if (e.key === 'ArrowDown' && index < tracks.length - 1) {
                          e.preventDefault();
                          move(track.id, tracks[index + 2]?.id ?? null);
                        }
                      }}
                    >
                      <DragHandleDots2Icon />
                    </Button>
                    <span className="w-4 text-center text-xs tabular-nums text-muted-foreground">{index + 1}</span>
                    <AlbumCover
                      icon={track.thumbnail}
                      fallback={track.title}
                      className="h-11 w-11 shrink-0 rounded-md"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" title={track.title}>
                        {track.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{track.author}</p>
                      <RequestedBy track={track} />
                    </div>
                    <span className="hidden text-xs tabular-nums text-muted-foreground sm:block">
                      {track.live ? 'Live' : track.duration}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions for ${track.title}`}
                          className="h-8 w-8"
                        >
                          <DotsHorizontalIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {items.map((item) => (
                          <DropdownMenuItem
                            key={item.label}
                            disabled={item.disabled}
                            onSelect={item.run}
                            className={item.label.startsWith('Remove') ? 'text-destructive' : ''}
                          >
                            {item.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${track.title}`}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => send('queueRemove', { trackId: track.id })}
                    >
                      <TrashIcon />
                    </Button>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  {items.map((item) => (
                    <ContextMenuItem
                      key={item.label}
                      disabled={item.disabled}
                      onSelect={item.run}
                      className={item.label.startsWith('Remove') ? 'text-destructive' : ''}
                    >
                      {item.label}
                    </ContextMenuItem>
                  ))}
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
          {dragging && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                drop(null);
              }}
              className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground"
            >
              Drop here to move to the end
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

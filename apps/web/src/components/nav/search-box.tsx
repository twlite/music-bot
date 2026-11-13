import { MagnifyingGlassIcon, PlusIcon } from '@radix-ui/react-icons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useEffect, useId, useState } from 'react';
import type { SerializedPlaylist, SerializedTrack } from '@music-bot/shared';
import { useDebounce } from '@/hooks/useDebounce';
import { AlbumCover } from '@/components/player/album-cover';
import { useSocket } from '@/context/socket.context';
import { cn } from '@/lib/utils';

type Result = SerializedTrack | SerializedPlaylist;

/** Shared track/playlist suggestions for the navigation and the upcoming queue. */
export function SearchBox({
  className = 'w-1/3',
  showAddButton = false,
  label = 'Search a track',
  placeholder = 'Search a track',
}: {
  className?: string;
  showAddButton?: boolean;
  label?: string;
  placeholder?: string;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [result, setResult] = useState<{ query: string; items: Result[]; loading: boolean; error: boolean }>({
    query: '',
    items: [],
    loading: false,
    error: false,
  });
  const debouncedQuery = useDebounce(query.trim(), 500);
  const listId = useId();
  const { send } = useSocket();

  useEffect(() => {
    if (!query.trim() || debouncedQuery !== query.trim()) return;
    const controller = new AbortController();
    setResult({ query: debouncedQuery, items: [], loading: true, error: false });
    void fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? ''}/search?query=${encodeURIComponent(debouncedQuery)}`, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error('Search unavailable');
        return response.json();
      })
      .then((items) => {
        if (!controller.signal.aborted)
          setResult({ query: debouncedQuery, items: Array.isArray(items) ? items : [], loading: false, error: false });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ query: debouncedQuery, items: [], loading: false, error: true });
      });
    return () => controller.abort();
  }, [query, debouncedQuery]);

  const items = result.query === query.trim() ? result.items : [];
  const choose = (selection?: Result) => {
    const value = /^playlist:[a-f0-9-]{36}$/i.test(query.trim())
      ? query.trim()
      : selection?.url || selection?.title || query.trim();
    if (value) send('play', value);
    setQuery('');
    setOpen(false);
    setActive(-1);
  };
  const expanded = open && Boolean(query.trim());

  return (
    <form
      className={cn('relative flex gap-2', className)}
      onSubmit={(event) => {
        event.preventDefault();
        choose(active >= 0 ? items[active] : undefined);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <div className="relative min-w-0 flex-1">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-3 text-muted-foreground" />
        <Input
          aria-label={label}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-activedescendant={active >= 0 && items[active] ? `${listId}-${active}` : undefined}
          autoComplete="off"
          maxLength={1000}
          className="pl-8"
          placeholder={placeholder}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setOpen(true);
              setActive((index) => Math.min(items.length - 1, index + 1));
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActive((index) => Math.max(-1, index - 1));
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              setOpen(false);
              setActive(-1);
            }
          }}
        />
      </div>
      {showAddButton && (
        <Button type="submit" disabled={!query.trim()}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add
        </Button>
      )}
      {expanded && (
        <div
          id={listId}
          role="listbox"
          aria-label={`${label} suggestions`}
          className="absolute inset-x-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-lg border bg-popover p-2 text-popover-foreground shadow-xl"
        >
          {result.query !== query.trim() || result.loading ? (
            <p className="p-3 text-sm text-muted-foreground" role="status">
              Searching…
            </p>
          ) : result.error ? (
            <p className="p-3 text-sm text-muted-foreground">
              Search is unavailable. You can still add the query directly.
            </p>
          ) : !items.length ? (
            <p className="p-3 text-sm text-muted-foreground">No suggestions found. Press Enter to add your query.</p>
          ) : (
            items.map((item, index) => (
              <button
                key={`${item.url}-${index}`}
                id={`${listId}-${index}`}
                type="button"
                role="option"
                aria-selected={active === index}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(item)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-accent focus:bg-accent',
                  active === index && 'bg-accent',
                )}
              >
                <AlbumCover icon={item.thumbnail} fallback={item.title} className="h-10 w-10 shrink-0" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{item.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {typeof item.author === 'string' ? item.author : item.author.name} ·{' '}
                    {'tracks' in item ? 'Playlist' : 'Track'}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </form>
  );
}

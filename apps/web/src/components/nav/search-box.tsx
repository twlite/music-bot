import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { Input } from '../ui/input';
import { useCallback, useEffect, useState } from 'react';
import { SerializedPlaylist, SerializedTrack } from 'music-bot/src/web/types';
import { useDebounce } from '@/hooks/useDebounce';
import { CircleIcon } from '@radix-ui/react-icons';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent, CardTitle } from '../ui/card';
import { useFetch } from '@/hooks/useFetch';
import { AlbumCover } from '../player/album-cover';
import { useSocket } from '@/context/socket.context';

type ResponseData = Array<SerializedTrack | SerializedPlaylist>;

export function SearchBox() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 1000);
  const { data, error, loading, execute } = useFetch<ResponseData>([]);
  const { send } = useSocket();

  useEffect(() => {
    if (!debouncedQuery) return;
    execute(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/search?query=${debouncedQuery}`
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const handleSelection = useCallback(
    (selection: ResponseData[number]) => {
      const regex = /^playlist:[a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12}$/;

      const key = regex.test(debouncedQuery)
        ? debouncedQuery
        : selection.url || selection.title;

      if (key) send('play', key);
      setQuery('');
    },
    [send, debouncedQuery]
  );

  return (
    <div className="w-1/3 relative">
      <div className="relative flex items-center">
        <MagnifyingGlassIcon className="absolute left-3" />
        <Input
          className="pl-8"
          placeholder="Search a track"
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          value={query}
        />
      </div>
      {query ? (
        <div className="absolute bg-secondary p-4 border w-full mt-4 rounded-md z-50">
          {loading ? (
            <div className="text-destructive text-3xl flex items-center justify-center">
              <svg
                stroke="currentColor"
                fill="currentColor"
                className="animate-spin"
                stroke-width="0"
                version="1.1"
                viewBox="0 0 16 16"
                height="1em"
                width="1em"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M8 0c-4.355 0-7.898 3.481-7.998 7.812 0.092-3.779 2.966-6.812 6.498-6.812 3.59 0 6.5 3.134 6.5 7 0 0.828 0.672 1.5 1.5 1.5s1.5-0.672 1.5-1.5c0-4.418-3.582-8-8-8zM8 16c4.355 0 7.898-3.481 7.998-7.812-0.092 3.779-2.966 6.812-6.498 6.812-3.59 0-6.5-3.134-6.5-7 0-0.828-0.672-1.5-1.5-1.5s-1.5 0.672-1.5 1.5c0 4.418 3.582 8 8 8z"></path>
              </svg>
            </div>
          ) : error ? (
            'An error occurred!'
          ) : (
            <SearchResult data={data} onClick={handleSelection} />
          )}
        </div>
      ) : null}
    </div>
  );
}

function SearchResult({
  data,
  onClick,
}: {
  data: ResponseData | null;
  onClick: (item: ResponseData[number]) => void;
}) {
  if (!data?.length) return <span>No results found!</span>;

  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div
          key={item.url}
          className="cursor-pointer hover:bg-card/50 p-2 rounded-md"
          onClick={() => onClick(item)}
        >
          <div className="flex gap-4 items-center">
            <AlbumCover
              fallback={item.title}
              icon={item.thumbnail?.url ?? item.thumbnail}
              className="h-10 w-10"
            />
            <div className="space-y-2 text-start">
              <h1 className="text-base font-semibold">{item.title}</h1>
              <h4 className="text-muted-foreground text-sm">
                {typeof item.author === 'string'
                  ? item.author
                  : item.author.name}
                {' • '}
                {item.$type}
              </h4>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

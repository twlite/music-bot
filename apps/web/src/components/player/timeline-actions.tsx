import { useSocket } from '@/context/socket.context';
import { ActionIcon } from './action-icon';
import {
  PauseIcon,
  PlayIcon,
  ShuffleIcon,
  TrackNextIcon,
  TrackPreviousIcon,
} from '@radix-ui/react-icons';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function TimelineActions({
  paused,
  shuffle,
}: {
  paused: boolean;
  shuffle: boolean;
}) {
  const { send } = useSocket();
  const [localPaused, setLocalPaused] = useState(paused);
  const [shuffleMode, setShuffleMode] = useState(shuffle);

  useEffect(() => {
    setLocalPaused(paused);
  }, [paused]);

  useEffect(() => {
    setShuffleMode(shuffle);
  }, [shuffle]);

  return (
    <div className="flex gap-4">
      <ActionIcon
        onClick={() => {
          send('back');
        }}
        name="Previous track"
      >
        <TrackPreviousIcon className="h-5 w-5 cursor-pointer" />
      </ActionIcon>
      {localPaused ? (
        <ActionIcon
          name="Play"
          onClick={() => {
            setLocalPaused(false);
            send('pause', false);
          }}
        >
          <PlayIcon className="h-5 w-5 cursor-pointer" />
        </ActionIcon>
      ) : (
        <ActionIcon
          onClick={() => {
            setLocalPaused(true);
            send('pause', true);
          }}
          name="Pause"
        >
          <PauseIcon className="h-5 w-5 cursor-pointer" />
        </ActionIcon>
      )}
      <ActionIcon
        onClick={() => {
          send('skip');
        }}
        name="Next track"
      >
        <TrackNextIcon className="h-5 w-5 cursor-pointer" />
      </ActionIcon>
      <ActionIcon
        name={`${shuffleMode ? 'Disable' : 'Enable'} shuffle`}
        onClick={() => {
          const newMode = !shuffleMode;
          setShuffleMode(newMode);
          send('shuffle', newMode);
        }}
      >
        <ShuffleIcon
          className={cn(
            'h-5 w-5 cursor-pointer',
            shuffle ? 'text-destructive' : ''
          )}
        />
      </ActionIcon>
    </div>
  );
}

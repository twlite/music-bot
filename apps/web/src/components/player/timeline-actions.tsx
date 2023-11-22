import { useSocket } from '@/context/socket.context';
import { ActionIcon } from './action-icon';
import {
  PauseIcon,
  PlayIcon,
  TrackNextIcon,
  TrackPreviousIcon,
} from '@radix-ui/react-icons';
import { useEffect, useState } from 'react';

export function TimelineActions({ paused }: { paused: boolean }) {
  const { send } = useSocket();
  const [localPaused, setLocalPaused] = useState(paused);

  useEffect(() => {
    setLocalPaused(paused);
  }, [paused]);

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
    </div>
  );
}

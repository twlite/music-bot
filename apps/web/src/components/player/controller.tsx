import { useSocket, useSocketEvent } from '@/context/socket.context';
import type { SerializedTrack } from 'music-bot/src/web/types';
import { useCallback, useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  TrackPreviousIcon,
  TrackNextIcon,
  PauseIcon,
  PlayIcon,
  SpeakerModerateIcon,
  SpeakerLoudIcon,
  SpeakerQuietIcon,
  SpeakerOffIcon,
} from '@radix-ui/react-icons';
import { Progress } from '../ui/progress';
import { Slider } from '../ui/slider';
import Link from 'next/link';

export function PlayerController({ showArt = false }) {
  const { send } = useSocket();
  const [currentTrack, setCurrentTrack] = useState<SerializedTrack | null>(
    null
  );
  const [paused, setPaused] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState({
    current: '0:00',
    total: '0:00',
  });

  const onvolumechange = useCallback(
    (volume: number) => {
      send('volume', volume);
    },
    [send]
  );

  useSocketEvent('playerStart', (track) => {
    setCurrentTrack(track);
    setPaused(false);
  });

  useSocketEvent('pause', (paused) => {
    setPaused(paused);
  });

  useSocketEvent('volume', (volume) => {
    setVolume(volume / 100);
  });

  useSocketEvent('statistics', (data) => {
    setPaused(data.paused);
    setVolume(data.volume / 100);
    setProgress(data.timestamp?.progress ?? 0);
    setDuration({
      current: data.timestamp?.current.label ?? '0:00',
      total: data.timestamp?.total.label ?? '0:00',
    });
    setCurrentTrack(data.track);
  });

  useSocketEvent('playerFinish', () => {
    setCurrentTrack(null);
  });

  return (
    <>
      {showArt && currentTrack ? (
        <div className="grid place-items-center h-[80vh]">
          <div className="text-center flex items-center flex-col">
            <Avatar className="rounded-sm h-52 w-52">
              <AvatarImage
                src={currentTrack.thumbnail?.url ?? currentTrack.thumbnail}
                alt={currentTrack.title}
              />
              <AvatarFallback>{currentTrack.title}</AvatarFallback>
            </Avatar>
            <h1 className="text-2xl mt-4">{currentTrack.title}</h1>
            <span className="text-sm text-muted-foreground">
              {currentTrack?.author ?? 'N/A'}
            </span>
          </div>
        </div>
      ) : null}
      <div className="fixed bottom-0 left-0 px-5 py-3 border-t w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          {currentTrack ? (
            <Avatar className="rounded-sm h-12 w-12">
              <AvatarImage
                src={currentTrack.thumbnail?.url ?? currentTrack.thumbnail}
                alt={currentTrack.title}
              />
              <AvatarFallback>{currentTrack.title}</AvatarFallback>
            </Avatar>
          ) : (
            <Avatar className="rounded-sm h-12 w-12">
              <AvatarFallback>N/A</AvatarFallback>
            </Avatar>
          )}
          <div className="flex flex-col items-start">
            <Link
              href={currentTrack?.url || '#'}
              target={currentTrack ? '_blank' : undefined}
              className="font-semibold hover:underline"
            >
              {currentTrack?.title ?? 'Not Playing'}
            </Link>
            <span className="text-xs text-muted-foreground">
              {currentTrack?.author ?? 'N/A'}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center w-[60%]">
          <div className="flex gap-4">
            <TrackPreviousIcon
              className="h-5 w-5"
              onClick={() => {
                send('back');
              }}
            />
            {paused ? (
              <PlayIcon
                className="h-5 w-5"
                onClick={() => {
                  send('pause', false);
                }}
              />
            ) : (
              <PauseIcon
                className="h-5 w-5"
                onClick={() => {
                  send('pause', true);
                }}
              />
            )}
            <TrackNextIcon
              className="h-5 w-5"
              onClick={() => {
                send('skip');
              }}
            />
          </div>
          <div className="flex items-center gap-5 w-[70%]">
            <span>{duration.current}</span>
            <Progress value={progress} className="w-full" />
            <span>{duration.total}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 w-[8%]">
          <VolumeController volume={volume} onChange={onvolumechange} />
        </div>
      </div>
    </>
  );
}

function VolumeController({
  volume,
  onChange,
}: {
  volume: number;
  onChange: (volume: number) => void;
}) {
  const vol = volume * 100;
  const icon =
    vol === 0 ? (
      <SpeakerOffIcon className="h-5 w-5" />
    ) : vol > 0 && vol <= 10 ? (
      <SpeakerQuietIcon className="h-5 w-5" />
    ) : vol > 10 && vol < 50 ? (
      <SpeakerModerateIcon className="h-5 w-5" />
    ) : vol >= 50 ? (
      <SpeakerLoudIcon className="h-5 w-5" />
    ) : null;

  return (
    <>
      {icon}
      <Slider
        onValueChange={(e) => {
          onChange(Math.floor(e[0] * 100));
        }}
        value={[volume]}
        max={1}
        min={0}
        step={0.1}
      />
    </>
  );
}

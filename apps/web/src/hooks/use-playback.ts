import { useEffect, useRef, useState } from 'react';
import type { IStatistics, PlaybackPosition } from '@music-bot/shared';
import { useSocket, useSocketEvent } from '@/context/socket.context';

export const timeLabel = (ms: number) =>
  `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;

/** Interpolate source-media position using the effective tempo, then reconcile to server snapshots. */
export function usePlayback() {
  const [state, setState] = useState<IStatistics | null>(null);
  const [position, setPosition] = useState(0);
  const trackId = useRef<string | null>(null);
  const clock = useRef({ value: 0, received: 0, total: 0, rate: 1 as number | null, advancing: false, sentAt: 0 });
  const { socket } = useSocket();
  const currentPosition = () => {
    const c = clock.current;
    return Math.max(0, Math.min(c.total || Infinity, c.value + (c.advancing && c.rate !== null ? (performance.now() - c.received) * c.rate : 0)));
  };

  const reconcile = (packet: PlaybackPosition) => {
    if (packet.trackId !== trackId.current || packet.sentAt < clock.current.sentAt) return;
    clock.current = {
      value: packet.positionMs,
      total: packet.durationMs,
      rate: packet.playbackRate,
      received: performance.now(),
      advancing: packet.playing && !packet.paused && socket.connected,
      sentAt: packet.sentAt,
    };
    setPosition(packet.positionMs);
  };

  useSocketEvent('statistics', (data) => {
    if (trackId.current !== (data.track?.id ?? null)) {
      trackId.current = data.track?.id ?? null;
      clock.current.sentAt = 0;
    }
    setState(data);
    reconcile({
      trackId: trackId.current,
      positionMs: data.timestamp?.current.value ?? 0,
      durationMs: data.timestamp?.total.value ?? 0,
      playbackRate: data.playbackRate,
      playing: data.playing,
      paused: data.paused,
      sentAt: data.sentAt,
    });
  });
  useSocketEvent('position', reconcile);

  useEffect(() => {
    const stop = () => {
      clock.current.value = currentPosition();
      clock.current.received = performance.now();
      clock.current.advancing = false;
      setPosition(clock.current.value);
    };
    socket.on('disconnect', stop);
    const timer = setInterval(() => setPosition(currentPosition()), 200);
    return () => {
      clearInterval(timer);
      socket.off('disconnect', stop);
    };
  }, [socket]);

  return { state, position };
}

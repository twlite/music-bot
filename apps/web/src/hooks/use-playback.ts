import { useEffect, useRef, useState } from 'react';
import type { IStatistics } from '@music-bot/shared';
import { useSocket, useSocketEvent } from '@/context/socket.context';

export const timeLabel = (ms: number) =>
  `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;

/** Interpolate locally; only authoritative server updates reset the clock. */
export function usePlayback() {
  const [state, setState] = useState<IStatistics | null>(null);
  const [position, setPosition] = useState(0);
  const clock = useRef({ value: 0, received: 0, total: 0, paused: true });
  const { socket } = useSocket();

  useSocketEvent('statistics', (data) => {
    clock.current = {
      value: data.timestamp?.current.value ?? 0,
      total: data.timestamp?.total.value ?? 0,
      received: performance.now(),
      paused: data.paused || !socket.connected,
    };
    setState(data);
    setPosition(clock.current.value);
  });

  useEffect(() => {
    const stop = () => {
      clock.current.paused = true;
    };
    socket.on('disconnect', stop);
    const timer = setInterval(() => {
      const c = clock.current;
      setPosition(Math.min(c.total, c.value + (c.paused ? 0 : performance.now() - c.received)));
    }, 200);
    return () => {
      clearInterval(timer);
      socket.off('disconnect', stop);
    };
  }, [socket]);

  return { state, position };
}

import { useSocket } from '@/context/socket.context';
import type { SocketUser } from 'music-bot/src/web/types';
import { useCallback, useEffect, useState } from 'react';

export function useSession() {
  const [session, setSession] = useState<SocketUser | null>(null);
  const { socket } = useSocket();

  useEffect(() => {
    try {
      const data = JSON.parse(sessionStorage.getItem('session')!);
      setSession(data);
    } catch {
      setSession(null);
    }
  }, []);

  const set = useCallback(
    (data: typeof session) => {
      if (!data) {
        socket.disconnect();
        setSession(null);
        return;
      }

      setSession(data);
    },
    [socket]
  );

  return [session, set] as const;
}

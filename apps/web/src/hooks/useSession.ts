import { useSocket, useSocketEvent } from '@/context/socket.context';
import type { SocketUser } from '@music-bot/shared';
import { useCallback, useEffect, useState } from 'react';

/** Display the identity/guild authenticated for this socket, never a previous browser session. */
export function useSession() {
  const [session, setSession] = useState<SocketUser | null>(null);
  const { socket } = useSocket();

  useSocketEvent('ready', setSession);

  useEffect(() => {
    const clear = () => setSession(null);
    socket.on('disconnect', clear);
    return () => {
      socket.off('disconnect', clear);
    };
  }, [socket]);

  const set = useCallback(
    (data: SocketUser | null) => {
      if (!data) socket.disconnect();
      setSession(data);
    },
    [socket],
  );

  return [session, set] as const;
}

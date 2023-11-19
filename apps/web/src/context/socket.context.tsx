import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import io, { Socket } from 'socket.io-client';
import type { SocketEvents, SocketActions } from 'music-bot/src/web/types';

const socket: Socket<SocketEvents, SocketActions> = io(
  process.env.NEXT_PUBLIC_GATEWAY_URL!,
  {
    auth(cb) {
      cb({
        token: sessionStorage.getItem('token'),
      });
    },
    autoConnect: false,
  }
);

const SocketContext = createContext(socket);

export function SocketContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [connecting, setConnecting] = useState(true);

  useEffect(() => {
    const onConnect = () => {
      setConnecting(false);
    };

    const onDisconnect = () => {
      setConnecting(false);
    };

    const onError = () => {
      setConnecting(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onError);
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {connecting ? (
        <div className="fixed inset-0 grid place-items-center bg-background">
          <p className="text-lg text-foreground">Connecting...</p>
        </div>
      ) : (
        children
      )}
    </SocketContext.Provider>
  );
}
export function useSocketEvent<T extends keyof SocketEvents>(
  name: T,
  handler: (...args: SocketEvents[T]) => void
) {
  const { socket } = useSocket();

  useEffect(() => {
    socket.on(name, handler as any);

    return () => {
      socket.off(name, handler as any);
    };
  }, [name, handler, socket]);
}

export function useSocket() {
  const socket = useContext(SocketContext);

  if (!socket) {
    throw new Error('useSocket must be used within SocketContextProvider');
  }

  const send = useCallback<
    <T extends keyof SocketActions>(
      name: T,
      ...values: SocketActions[T]
    ) => void
  >(
    (name, ...params) => {
      return void socket.emit(name as any, ...params);
    },
    [socket]
  );

  return { socket, send };
}

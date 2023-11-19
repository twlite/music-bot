import { AppProps } from 'next/app';
import '../styles/globals.css';
import { Inter } from 'next/font/google';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { SocketContextProvider, useSocket } from '@/context/socket.context';
import { InvalidSession } from '@/components/auth/InvalidSession';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { socket } = useSocket();
  const [invalidSession, setInvalidSession] = useState(true);

  useEffect(() => {
    const onConnect = () => {
      setInvalidSession(false);
    };

    const onError = () => {
      setInvalidSession(true);
    };

    if (!socket.connected) {
      const token = router.query.session;
      if (!token) return setInvalidSession(true);

      sessionStorage.setItem('token', token as string);

      socket.on('connect', onConnect);
      socket.on('connect_error', onError);

      socket.connect();
    }

    return () => {
      socket.disconnect();
      socket.off('connect', onConnect);
      socket.off('connect_error', onError);
    };
  }, [router.query.session, socket]);

  return (
    <SocketContextProvider>
      <div className={inter.className}>
        {invalidSession ? <InvalidSession /> : <Component {...pageProps} />}
      </div>
    </SocketContextProvider>
  );
}

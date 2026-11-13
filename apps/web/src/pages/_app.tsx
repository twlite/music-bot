import { AppProps } from 'next/app';
import '../styles/globals.css';
import { Inter } from 'next/font/google';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { SocketContextProvider, useSocket } from '@/context/socket.context';
import { InvalidSession } from '@/components/auth/InvalidSession';
import { ThemeProvider } from '@/components/theme';
import { TooltipProvider } from '@/components/ui/tooltip';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const exchange = useRef<Promise<Response> | null>(null);
  const { socket } = useSocket();
  const [invalidSession, setInvalidSession] = useState(true);

  useEffect(() => {
    const onError = () => {
      setInvalidSession(true);
    };

    const onSession = () => {
      setInvalidSession(false);
    };

    if (!router.isReady) return;
    socket.on('ready', onSession);
    socket.on('disconnect', onError);
    socket.on('connect_error', onError);
    const code = typeof router.query.session === 'string' ? router.query.session : null;
    if (code) {
      window.history.replaceState({}, '', '/');
      exchange.current ??= fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/exchange`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      void exchange.current
        .then((res) => {
          if (res.ok) socket.connect();
          else setInvalidSession(true);
        })
        .catch(onError);
    } else socket.connect();

    return () => {
      socket.disconnect();
      socket.off('disconnect', onError);
      socket.off('connect_error', onError);
      socket.off('ready', onSession);
    };
  }, [router.isReady, socket]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SocketContextProvider>
        <div className={inter.className}>
          {invalidSession ? (
            <InvalidSession />
          ) : (
            <TooltipProvider>
              <Component {...pageProps} />
            </TooltipProvider>
          )}
        </div>
      </SocketContextProvider>
    </ThemeProvider>
  );
}

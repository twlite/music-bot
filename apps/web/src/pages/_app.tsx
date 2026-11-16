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
const SESSION_REFRESH_INTERVAL_MS = 10 * 60 * 1000;
const SESSION_REFRESH_RETRY_MS = 30 * 1000;

export default function RootLayout({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const exchange = useRef<Promise<Response> | null>(null);
  const { socket } = useSocket();
  const [invalidSession, setInvalidSession] = useState(true);

  useEffect(() => {
    if (!router.isReady) return;

    let active = true;
    let authenticated = false;
    let refreshing: Promise<boolean> | null = null;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let lastRefreshAt = Date.now();

    const scheduleRefresh = (delay = SESSION_REFRESH_INTERVAL_MS) => {
      if (!active) return;
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => void refreshSession(), delay);
    };

    function refreshSession() {
      if (refreshing) return refreshing;

      const pending = fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
        .then((res) => {
          if (!active) return false;
          if (res.status === 401) {
            authenticated = false;
            setInvalidSession(true);
            socket.disconnect();
            return false;
          }

          if (!res.ok) {
            scheduleRefresh(SESSION_REFRESH_RETRY_MS);
            return false;
          }

          authenticated = true;
          lastRefreshAt = Date.now();
          socket.disconnect();
          socket.connect();
          scheduleRefresh();
          return true;
        })
        .catch(() => {
          scheduleRefresh(SESSION_REFRESH_RETRY_MS);
          return false;
        })
        .finally(() => {
          refreshing = null;
        });

      refreshing = pending;
      return pending;
    }

    const onSession = () => {
      authenticated = true;
      setInvalidSession(false);
    };

    const onDisconnect = (reason: string) => {
      if (authenticated && reason === 'io server disconnect') void refreshSession();
    };

    const onConnectError = (error: Error) => {
      if (!authenticated) {
        setInvalidSession(true);
        return;
      }

      if (/session expired|voice access denied/i.test(error.message)) void refreshSession();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastRefreshAt >= SESSION_REFRESH_INTERVAL_MS)
        void refreshSession();
    };

    const connect = () => {
      if (!active) return;
      authenticated = true;
      lastRefreshAt = Date.now();
      socket.connect();
      scheduleRefresh();
    };

    socket.on('ready', onSession);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    document.addEventListener('visibilitychange', onVisibilityChange);

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
          if (res.ok) connect();
          else if (active) setInvalidSession(true);
        })
        .catch(() => {
          if (active) setInvalidSession(true);
        });
    } else void refreshSession();

    return () => {
      active = false;
      clearTimeout(refreshTimer);
      socket.disconnect();
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('ready', onSession);
      document.removeEventListener('visibilitychange', onVisibilityChange);
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

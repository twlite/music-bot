import { act, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import RootLayout from '../src/pages/_app';

const mock = vi.hoisted(() => ({
  listeners: new Map<string, (...args: any[]) => void>(),
  socket: {
    on: (name: string, callback: (...args: any[]) => void) => mock.listeners.set(name, callback),
    off: (name: string) => mock.listeners.delete(name),
    connect: vi.fn(),
    disconnect: vi.fn(),
  },
}));
vi.mock('next/router', () => ({ useRouter: () => ({ isReady: true, query: {} }) }));
vi.mock('next/font/google', () => ({ Inter: () => ({ className: 'font-test' }) }));
vi.mock('@/context/socket.context', () => ({
  useSocket: () => ({ socket: mock.socket }),
  SocketContextProvider: ({ children }: any) => children,
}));
vi.mock('@/components/theme', () => ({ ThemeProvider: ({ children }: any) => children }));
vi.mock('@/components/auth/InvalidSession', () => ({ InvalidSession: () => <p>Session required</p> }));

it('shows guild controls only after ready and removes them on disconnect', () => {
  const Panel = () => <p>Guild controls</p>;
  render(<RootLayout Component={Panel} pageProps={{}} router={{} as never} />);
  expect(screen.getByText('Session required')).toBeTruthy();
  expect(screen.queryByText('Guild controls')).toBeNull();
  act(() => mock.listeners.get('ready')!({ guildId: 'guild-a' }));
  expect(screen.getByText('Guild controls')).toBeTruthy();
  act(() => mock.listeners.get('disconnect')!());
  expect(screen.queryByText('Guild controls')).toBeNull();
  expect(screen.getByText('Session required')).toBeTruthy();
});

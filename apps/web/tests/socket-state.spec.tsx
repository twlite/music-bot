import { useState } from 'react';
import { act, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { SocketContextProvider, useSocketEvent } from '../src/context/socket.context';

const fake = vi.hoisted(() => ({
  any: new Set<(...args: any[]) => void>(),
  listeners: new Map<string, Set<(...args: any[]) => void>>(),
  on(name: string, listener: (...args: any[]) => void) {
    if (!this.listeners.has(name)) this.listeners.set(name, new Set());
    this.listeners.get(name)!.add(listener);
    return this;
  },
  off(name: string, listener: (...args: any[]) => void) {
    this.listeners.get(name)?.delete(listener);
    return this;
  },
  onAny(listener: (...args: any[]) => void) {
    this.any.add(listener);
  },
  offAny(listener: (...args: any[]) => void) {
    this.any.delete(listener);
  },
  emit: vi.fn(),
}));
vi.mock('socket.io-client', () => ({ default: () => fake }));

function Probe() {
  const [count, setCount] = useState(-1);
  useSocketEvent('queue', (tracks) => setCount(tracks.length));
  return <span>Queue size: {count}</span>;
}

it('hydrates a late-mounted queue panel and releases every listener on unmount', () => {
  const view = render(
    <SocketContextProvider>
      <span>Connecting</span>
    </SocketContextProvider>,
  );
  act(() => {
    for (const listener of fake.any) listener('queue', [{ id: 'a' }, { id: 'b' }]);
  });
  view.rerender(
    <SocketContextProvider>
      <Probe />
    </SocketContextProvider>,
  );
  expect(screen.getByText('Queue size: 2')).toBeTruthy();
  view.unmount();
  expect(fake.any.size).toBe(0);
  expect([...fake.listeners.values()].every((listeners) => listeners.size === 0)).toBe(true);
});

import { expect, it, vi } from 'vitest';
import { Track } from 'discord-player';
import start from '../src/app/events/(discord-player)/playerStart/announce.js';
import finish from '../src/app/events/(discord-player)/playerFinish/announce.js';
import { VolumeAction } from '../src/web/actions/volume.action.js';

const mocks = vi.hoisted(() => ({ send: vi.fn(), setVolume: vi.fn() }));
vi.mock('../src/utils/embed-generator.js', () => ({ EmbedGenerator: { Success: (data: unknown) => data } }));
vi.mock('../src/web/index.js', () => ({ io: { to: () => ({ emit: vi.fn() }) } }));
vi.mock('../src/player/runtime.js', () => ({
  useQueue: () => ({
    node: { session: {}, volume: 7.000000000000001, setVolume: mocks.setVolume },
    metadata: { channel: { isSendable: () => true, send: mocks.send } },
  }),
}));

it.each([start, finish])('renders requester names in actual playback announcement embeds', async (handler) => {
  mocks.send.mockClear();
  const track = new Track({ title: 'Song', requestedBy: { id: 'user', displayName: 'Twilight' } });
  await handler(
    { guildId: 'guild', metadata: { channel: { isSendable: () => true, send: mocks.send } } } as never,
    track,
  );
  expect(mocks.send.mock.calls[0][0].embeds[0].footer.text).toBe('Requested by Twilight');
});

it('rounds percentages in dashboard volume announcements', async () => {
  mocks.send.mockClear();
  await VolumeAction({ guildId: 'guild', id: 'user', displayName: 'Twilight' } as never, {} as never, 7);
  expect(mocks.send.mock.calls[0][0].embeds[0].description).toBe('The volume was set to 7% by Twilight (<@user>).');
});

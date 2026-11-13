import { expect, it, vi } from 'vitest';
import { Track, type GuildQueue } from 'discord-player';
import { automaticLyricsTrack, lyricsTitle } from '../src/player/lyrics-query.js';
import { getLyrics, releaseLyrics } from '../src/web/lyrics.js';

it.each([
  ['Starboy (Official Video) (Lyrics)', 'Starboy'],
  ['Starboy [OFFICIAL MUSIC VIDEO] [HD]', 'Starboy'],
  ['Starboy (Official Audio)', 'Starboy'],
  ['Starboy (Official Lyric Video)', 'Starboy'],
  ['Starboy - Official Video - Lyrics', 'Starboy'],
  ['Starboy (Visualizer) [4K]', 'Starboy'],
  ['Song (With Lyrics)', 'Song'],
  ['Song (Live at Wembley) (Official Video)', 'Song (Live at Wembley)'],
  ['Song (Remix) [Lyrics]', 'Song (Remix)'],
  ["Song (Taylor's Version)", "Song (Taylor's Version)"],
  ['Song (2019 Remaster)', 'Song (2019 Remaster)'],
  ['Lyrics', 'Lyrics'],
  ['The Official Story', 'The Official Story'],
])('normalizes %s only for lyric lookup', (input, expected) => expect(lyricsTitle(input)).toBe(expected));

it('cleans a lookup copy while retaining track identity and the original queue title', () => {
  const track = new Track({ title: 'The Weeknd - Starboy (Official Video) (Lyrics)', author: 'The Weeknd - Topic' });
  const lookup = automaticLyricsTrack(track);
  expect(lookup).not.toBe(track);
  expect(lookup).toMatchObject({ id: track.id, title: 'Starboy', author: 'The Weeknd' });
  expect(track.title).toBe('The Weeknd - Starboy (Official Video) (Lyrics)');
  expect(track.author).toBe('The Weeknd - Topic');
});

it('leaves manual lyrics searches exactly as typed', async () => {
  const search = vi.fn().mockResolvedValue([]);
  const queue = {
    currentTrack: new Track({ title: 'Wrong (Lyrics)' }),
    player: { lyrics: { search } },
  } as unknown as GuildQueue;
  await getLyrics(queue, 'My Song (Official Video)');
  expect(search.mock.calls[0][0]).toBe('My Song (Official Video)');
  releaseLyrics(queue);
});

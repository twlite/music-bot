import { expect, it } from 'vitest';
import { splitLyrics } from '../src/utils/split-lyrics.js';

it.each(['A lyric line\n'.repeat(1000), 'word '.repeat(2000), 'x'.repeat(10000), '🎵'.repeat(5000)])(
  'preserves all lyrics within embed limits',
  (text) => {
    const parts = splitLyrics(text);
    expect(parts.join('')).toBe(text);
    expect(parts.every((part) => part.length > 0 && part.length <= 4000)).toBe(true);
    expect(parts.every((part) => !/^[\udc00-\udfff]|[\ud800-\udbff]$/.test(part))).toBe(true);
  },
);

it('uses line boundaries when they fit', () => {
  const lines = 'First line\n'.repeat(500);
  const chunks = splitLyrics(lines);
  expect(chunks.slice(0, -1).every((chunk) => chunk.endsWith('\n'))).toBe(true);
});

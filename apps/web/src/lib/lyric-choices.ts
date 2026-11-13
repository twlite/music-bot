import type { LyricsChoice } from '@music-bot/shared';

/** Show tenths of a second so small synchronization differences remain visible. */
function lyricTime(ms: number) {
  const tenths = Math.max(0, Math.round(ms / 100));
  return `${Math.floor(tenths / 600)}:${String(Math.floor(tenths / 10) % 60).padStart(2, '0')}.${tenths % 10}`;
}

export function lyricChoiceLabel(choice: LyricsChoice) {
  return `Version ${choice.index + 1}${choice.album ? ` · ${choice.album}` : ''}${choice.firstLineMs != null ? ` · Starts ${lyricTime(choice.firstLineMs)}` : ''}`;
}

export function lyricChoiceDetails(choice: LyricsChoice) {
  return [
    choice.synced ? `${choice.lineCount ?? 0} timed lines` : 'Plain text',
    choice.firstLineMs != null ? `First ${lyricTime(choice.firstLineMs)}` : null,
    choice.lastLineMs != null ? `Last ${lyricTime(choice.lastLineMs)}` : null,
    choice.recordId ? `LRCLIB #${choice.recordId}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

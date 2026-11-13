/** Find the line active on the authoritative source timeline, including after backwards seeks. */
export function activeLyricIndex(lines: { timestampMs: number }[], positionMs: number) {
  let low = 0;
  let high = lines.length - 1;
  let result = -1;
  while (low <= high) {
    const mid = (low + high) >>> 1;
    if (lines[mid].timestampMs <= positionMs) {
      result = mid;
      low = mid + 1;
    } else high = mid - 1;
  }
  return result;
}

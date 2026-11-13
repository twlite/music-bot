/** Split embed descriptions at line/word boundaries without dropping text or splitting UTF-16 pairs. */
export function splitLyrics(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + 4000, text.length);
    if (end < text.length) {
      const window = text.slice(start, end);
      const newline = window.lastIndexOf('\n');
      const space = window.lastIndexOf(' ');
      if (newline >= 0) end = start + newline + 1;
      else if (space >= 0) end = start + space + 1;
      const last = text.charCodeAt(end - 1);
      const next = text.charCodeAt(end);
      if (last >= 0xd800 && last <= 0xdbff && next >= 0xdc00 && next <= 0xdfff) end--;
    }
    chunks.push(text.slice(start, end));
    start = end;
  }
  return chunks;
}

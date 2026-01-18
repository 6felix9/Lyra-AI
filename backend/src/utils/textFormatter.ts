export function formatLyricsForSinging(rawLyrics: string): string {
  const cleaned = rawLyrics
    .replace(/\r\n/g, '\n')
    // Remove markdown formatting like **Verse 1**, **Chorus**, etc.
    .replace(/\*\*.*?\*\*/g, '')
    // Remove lines that are just section labels
    .replace(/^(Verse|Chorus|Bridge|Intro|Outro).*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[^\S\r\n]+/g, ' ')
    .trim();

  return cleaned;
}

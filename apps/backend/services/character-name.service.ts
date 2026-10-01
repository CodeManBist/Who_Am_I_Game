const IGNORED_NAME_PARTS = new Set(['a', 'an', 'the', 'of', 'jr', 'sr', 'ii', 'iii', 'iv']);

export function normalizeCharacterName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('en')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function matchesCharacterName(
  guess: string,
  characterName: string,
  aliases: string[] = [],
): boolean {
  const normalizedGuess = normalizeCharacterName(guess);
  if (!normalizedGuess) return false;

  const acceptedNames = new Set<string>([
    normalizeCharacterName(characterName),
    ...aliases.map(normalizeCharacterName),
    ...normalizeCharacterName(characterName)
      .split(' ')
      .filter((part) => part.length >= 3 && !IGNORED_NAME_PARTS.has(part)),
  ]);

  return acceptedNames.has(normalizedGuess);
}

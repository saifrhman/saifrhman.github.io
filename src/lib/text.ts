const ABBREVIATIONS = /(?:\be\.g|\bi\.e|\bet al|\bvs|\bcf|\bFig|\bDr|\bNo)\.$/;

/**
 * First sentence of a paragraph, up to and including its terminal . ? or !.
 * A full stop only ends a sentence when a capital letter, quote or bracket
 * follows, and not after common abbreviations.
 */
export function firstSentence(text: string): string {
  const re = /[.?!](?=\s+[A-Z“"(]|$)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const candidate = text.slice(0, match.index + 1);
    if (!ABBREVIATIONS.test(candidate)) return candidate;
  }
  return text;
}

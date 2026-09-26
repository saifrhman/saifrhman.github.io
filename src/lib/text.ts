/** First sentence of a paragraph (up to and including its terminal . or ?). */
export function firstSentence(text: string): string {
  return text.match(/^.*?[.?](?=\s+[A-Z“"(]|$)/)?.[0] ?? text;
}

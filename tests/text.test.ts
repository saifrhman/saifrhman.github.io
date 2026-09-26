import { describe, expect, it } from 'vitest';
import { firstSentence } from '@/lib/text';

describe('firstSentence', () => {
  it('stops at the first sentence end', () => {
    expect(firstSentence('One thing. Another thing.')).toBe('One thing.');
    expect(firstSentence('Is it? Yes.')).toBe('Is it?');
    expect(firstSentence('Stop! Now.')).toBe('Stop!');
  });

  it('ignores decimals, versions and abbreviations', () => {
    expect(firstSentence('A threshold of 0.30 was kept. Then more.')).toBe('A threshold of 0.30 was kept.');
    expect(firstSentence('Llama-3.1-8B was used, e.g. Mistral too. Next.')).toBe('Llama-3.1-8B was used, e.g. Mistral too.');
    expect(firstSentence('See Anosova et al. The rest.')).toBe('See Anosova et al. The rest.');
  });

  it('handles line breaks and text without a terminal stop', () => {
    expect(firstSentence('First line\ncontinues. Second.')).toBe('First line\ncontinues.');
    expect(firstSentence('No full stop here')).toBe('No full stop here');
  });
});

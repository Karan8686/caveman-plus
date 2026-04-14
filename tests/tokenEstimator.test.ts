import { describe, it, expect } from 'vitest';
import { estimateTokens, estimateTokenSavings, getCompressionStats } from '../src/utils/tokenEstimator.js';

describe('estimateTokens', () => {
  it('estimates tokens for simple text', () => {
    const tokens = estimateTokens('Hello world this is a test');
    expect(tokens).toBeGreaterThan(0);
    expect(tokens).toBeLessThan(20);
  });

  it('estimates proportionally to text length', () => {
    const short = 'Hi';
    const long = 'This is a much longer piece of text that should have more tokens';
    const shortTokens = estimateTokens(short);
    const longTokens = estimateTokens(long);
    expect(longTokens).toBeGreaterThan(shortTokens);
  });

  it('handles empty text', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens('   ')).toBe(0); // Whitespace-only has no words
  });

  it('handles code blocks with different estimation', () => {
    const codeBlock = '```\nconst x = 5;\nconst y = 10;\n```';
    const normalText = 'This is just some normal text without code';
    // Both should estimate, code may have different ratio
    expect(estimateTokens(codeBlock)).toBeGreaterThan(0);
    expect(estimateTokens(normalText)).toBeGreaterThan(0);
  });

  it('estimates consistently', () => {
    const text = 'Hello world this is a test';
    const estimate1 = estimateTokens(text);
    const estimate2 = estimateTokens(text);
    expect(estimate1).toBe(estimate2);
  });

  it('handles single word', () => {
    expect(estimateTokens('word')).toBeGreaterThan(0);
  });

  it('handles punctuation', () => {
    const text = 'Hello, world! This is a test...';
    expect(estimateTokens(text)).toBeGreaterThan(0);
  });

  it('handles multiline text', () => {
    const text = 'Line one.\nLine two.\nLine three.';
    expect(estimateTokens(text)).toBeGreaterThan(0);
  });
});

describe('estimateTokenSavings', () => {
  it('calculates positive savings when text is compressed', () => {
    const before = 'This is basically just a very long sentence that could be shorter.';
    const after = 'This is a very long sentence.';
    const result = estimateTokenSavings(before, after);

    expect(result.saved).toBeGreaterThan(0);
    expect(result.reductionPercent).toBeGreaterThan(0);
    expect(result.before).toBeGreaterThan(result.after);
  });

  it('returns zero savings when text is identical', () => {
    const text = 'No change here.';
    const result = estimateTokenSavings(text, text);

    expect(result.saved).toBe(0);
    expect(result.reductionPercent).toBe(0);
    expect(result.before).toBe(result.after);
  });

  it('returns negative savings when text is expanded', () => {
    const before = 'Short text';
    const after = 'This is a much longer expansion of the text';
    const result = estimateTokenSavings(before, after);

    expect(result.saved).toBeLessThan(0);
    expect(result.reductionPercent).toBeLessThan(0);
  });

  it('handles empty input', () => {
    const result = estimateTokenSavings('', '');
    expect(result.before).toBe(0);
    expect(result.after).toBe(0);
    expect(result.saved).toBe(0);
    expect(result.reductionPercent).toBe(0);
  });

  it('returns all expected fields', () => {
    const result = estimateTokenSavings('before text', 'after');
    expect(result).toHaveProperty('before');
    expect(result).toHaveProperty('after');
    expect(result).toHaveProperty('saved');
    expect(result).toHaveProperty('reductionPercent');
  });

  it('calculates reasonable percentage for typical compression', () => {
    const before = 'I just wanted to say that this is basically a really good test.';
    const after = 'I wanted to say that this is a good test.';
    const result = estimateTokenSavings(before, after);

    expect(result.reductionPercent).toBeGreaterThan(0);
    expect(result.reductionPercent).toBeLessThan(100);
  });
});

describe('getCompressionStats', () => {
  it('is an alias for estimateTokenSavings', () => {
    const original = 'This is basically just a test.';
    const compressed = 'This is a test.';

    const statsResult = getCompressionStats(original, compressed);
    const savingsResult = estimateTokenSavings(original, compressed);

    expect(statsResult).toEqual(savingsResult);
  });

  it('returns token estimation for compression', () => {
    const original = 'The reason is because of this basically working thing.';
    const compressed = 'because of this working thing.';
    const result = getCompressionStats(original, compressed);

    expect(result.before).toBeGreaterThan(result.after);
    expect(result.saved).toBeGreaterThan(0);
    expect(result.reductionPercent).toBeGreaterThan(0);
  });
});

import { describe, it, expect } from 'vitest';
import { compress, selectAutoMode, getAutoMode, auto } from '../src/index.js';

describe('auto mode selection', () => {
  describe('selectAutoMode logic', () => {
    it('selects lite for short text', () => {
      const short = 'Hi there';
      expect(selectAutoMode(short)).toBe('lite');
    });

    it('selects lite for error context regardless of length', () => {
      const error = 'Error: Something went wrong and the system failed to process the request properly due to an unexpected exception.';
      expect(selectAutoMode(error)).toBe('lite');
    });

    it('selects lite for code context', () => {
      const code = 'const result = calculateTotal(items);';
      expect(selectAutoMode(code)).toBe('lite');
    });

    it('selects full for explanation context', () => {
      const explanation = 'This function will calculate the total cost by summing all the items in the list and applying any applicable discounts based on the customer membership level.';
      expect(selectAutoMode(explanation)).toBe('full');
    });

    it('selects full for medium-length normal text', () => {
      const medium = 'This is a reasonably sized paragraph that contains some text but is not particularly long or verbose. It just has a few sentences to make it medium length.';
      expect(selectAutoMode(medium)).toBe('full');
    });

    it('selects ultra for long normal text', () => {
      const long = 'This is a very long piece of text that goes on and on and on. It contains multiple sentences that are quite verbose and could benefit from some aggressive compression. The text continues with more and more words that really don\'t need to be here. It just keeps going with filler words and verbose phrases that could be shortened. Actually, this is exactly the kind of text that would benefit from ultra compression mode.'.repeat(3);
      expect(selectAutoMode(long)).toBe('ultra');
    });

    it('respects custom thresholds', () => {
      const text = 'This is a medium length text.';
      // With very low thresholds, even short text should be ultra
      expect(selectAutoMode(text, { shortThreshold: 10, longThreshold: 20 })).toBe('ultra');
    });
  });

  describe('getAutoMode utility', () => {
    it('returns undefined for empty text', () => {
      expect(getAutoMode('')).toBe(undefined);
      expect(getAutoMode('   ')).toBe(undefined);
    });

    it('returns mode for valid text', () => {
      const mode = getAutoMode('Short text');
      expect(mode).toBe('lite');
    });
  });

  describe('auto preset export', () => {
    it('exports auto preset object', () => {
      expect(auto).toBeDefined();
      expect(typeof auto).toBe('object');
    });
  });

  describe('compress with auto mode', () => {
    it('applies lite compression to short text', () => {
      const input = 'This is just a short test.';
      const result = compress(input, 'auto');
      const liteResult = compress(input, 'lite');
      // Auto should select lite, so result should match lite
      expect(result).toBe(liteResult);
    });

    it('applies appropriate compression to long text', () => {
      const input = 'I just wanted to say that this is actually a really long and verbose piece of text that could definitely be compressed quite a bit because it has a lot of filler words and unnecessary phrases that don\'t really add much value to the overall message. It basically just goes on and on with words that could be removed without losing any important meaning.'.repeat(2);
      const result = compress(input, 'auto');
      const ultraResult = compress(input, 'ultra');
      const liteResult = compress(input, 'lite');
      // Auto should select ultra for long text, so result should be closer to ultra than lite
      expect(result.length).toBeLessThan(liteResult.length);
      expect(result.length).toBeLessThanOrEqual(ultraResult.length);
    });

    it('preserves error messages with minimal compression', () => {
      const input = 'TypeError: Cannot read property of undefined at Object.<anonymous> (/path/to/file.js:42:5)';
      const result = compress(input, 'auto');
      // Auto should select lite for errors
      expect(result).toContain('TypeError:');
      expect(result).toContain('Cannot read property');
    });

    it('deterministic output', () => {
      const input = 'This is basically just a test that really works.';
      const r1 = compress(input, 'auto');
      const r2 = compress(input, 'auto');
      const r3 = compress(input, 'auto');
      expect(r1).toBe(r2);
      expect(r2).toBe(r3);
    });

    it('handles markdown with auto mode', () => {
      const input = `# This is basically just a heading

This is actually a really verbose paragraph that could be shorter.

- First item that is just filler
- Second item which is basically unnecessary`;
      const result = compress(input, 'auto');
      // Structure preserved
      expect(result).toMatch(/^#\s/m);
      expect(result).toContain('- ');
      // Text compressed
      expect(result).not.toContain('basically just a heading');
    });

    it('auto mode differs from explicit ultra on short text', () => {
      const input = 'Short text.';
      const autoResult = compress(input, 'auto');
      const ultraResult = compress(input, 'ultra');
      // Auto should select lite for short text, so it should compress less than ultra
      expect(autoResult.length).toBeGreaterThanOrEqual(ultraResult.length);
    });
  });
});

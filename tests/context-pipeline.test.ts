import { describe, it, expect } from 'vitest';
import { compress } from '../src/core/pipeline.js';

describe('context-aware compression pipeline', () => {
  describe('error context - minimal compression', () => {
    it('should apply lite compression to error messages', () => {
      const input = 'Error: Something really went wrong and basically failed.';
      const result = compress(input, 'context');
      // Lite compression only removes a few filler words
      expect(result).toContain('Error:');
      expect(result).toContain('went wrong');
    });

    it('should preserve stack traces with minimal changes', () => {
      const input = `TypeError: Cannot read property 'foo'
    at Object.<anonymous> (/path/to/file.js:10:5)
    at Module._compile (internal/modules/cjs/loader.js:1085:14)`;
      const result = compress(input, 'context');
      // Should preserve the structure
      expect(result).toContain('TypeError:');
      expect(result).toContain('at Object');
    });

    it('should not over-compress error context', () => {
      const input = 'Fatal error: the system just stopped working actually.';
      const result = compress(input, 'context');
      const ultraResult = compress(input, 'ultra');
      // Context should compress less than ultra
      expect(result.length).toBeGreaterThanOrEqual(ultraResult.length);
    });
  });

  describe('code context - minimal compression', () => {
    it('should apply lite compression to code explanations', () => {
      const input = 'This function will basically just calculate the total.';
      const result = compress(input, 'context');
      // Should preserve more text than ultra compression
      expect(result).toContain('function');
      expect(result).toContain('calculate');
    });

    it('should still preserve actual code blocks', () => {
      const input = `Here is the code that just works:

\`\`\`javascript
const reallyImportant = true;
function actuallyWorks() {
  return reallyImportant;
}
\`\`\`

This basically demonstrates the solution.`;
      const result = compress(input, 'context');
      // Code block must be preserved exactly
      expect(result).toContain('const reallyImportant = true;');
      expect(result).toContain('function actuallyWorks()');
    });

    it('should apply minimal compression to code-like text', () => {
      const input = 'const result = basically just a test;';
      const result = compress(input, 'context');
      // Should detect as code context and apply lite compression
      expect(result).toContain('const result');
    });
  });

  describe('explanation context - medium compression', () => {
    it('should apply full compression to explanations', () => {
      const input = 'This function will basically just calculate the total for example.';
      const result = compress(input, 'context');
      // Full compression removes filler and compresses phrases
      expect(result).not.toContain('basically');
      expect(result).toContain('calculate');
    });

    it('should compress explanatory phrases', () => {
      const input = 'In order to understand this, you should really look at the code.';
      const contextResult = compress(input, 'context');
      const fullResult = compress(input, 'full');
      // Context mode should behave like full for explanations
      expect(contextResult).toBe(fullResult);
    });

    it('should handle questions with medium compression', () => {
      const input = 'How does this actually work in order to solve the problem?';
      const result = compress(input, 'context');
      expect(result).toContain('How does');
      expect(result).toContain('work');
    });
  });

  describe('normal context - aggressive compression', () => {
    it('should apply ultra compression to normal text', () => {
      const input = 'I just wanted to say that this is basically a really good test.';
      const result = compress(input, 'context');
      const ultraResult = compress(input, 'ultra');
      // Normal context should compress like ultra
      expect(result).toBe(ultraResult);
    });

    it('should aggressively remove filler words in normal text', () => {
      const input = 'This is actually just a very simple test that really works.';
      const result = compress(input, 'context');
      expect(result).not.toContain('actually');
      expect(result).not.toContain('very');
      expect(result).not.toContain('really');
    });

    it('should compress common phrases in normal text', () => {
      const input = 'The reason is because this is just basically working.';
      const result = compress(input, 'context');
      expect(result).not.toContain('The reason is because');
      expect(result).not.toContain('basically');
    });
  });

  describe('mixed context preservation', () => {
    it('should handle multiple contexts in one document', () => {
      const input = `I just wanted to explain that this is basically how it works.

Error: Something really failed in the system.

\`\`\`javascript
const reallyImportant = true;
\`\`\`

This function will just calculate things in order to succeed.

And that is basically all I have to say about this topic really.`;

      const result = compress(input, 'context');

      // Code block preserved exactly
      expect(result).toContain('const reallyImportant = true;');

      // Error context should have minimal compression
      expect(result).toContain('Error:');

      // Normal text should be compressed
      expect(result).not.toContain('basically all');
    });

    it('should maintain deterministic output', () => {
      const input = 'This is just basically a test that really works.';
      const r1 = compress(input, 'context');
      const r2 = compress(input, 'context');
      const r3 = compress(input, 'context');
      expect(r1).toBe(r2);
      expect(r2).toBe(r3);
    });

    it('should preserve code blocks regardless of context', () => {
      const codeBlock = `\`\`\`python
def really_important_function():
    # This basically does something
    return True
\`\`\``;

      const input = `Intro that is just verbose.

${codeBlock}

Conclusion that basically wraps everything up.`;

      const result = compress(input, 'context');
      expect(result).toContain('# This basically does something');
      expect(result).toContain('def really_important_function():');
    });
  });

  describe('context mode vs explicit modes', () => {
    it('context mode should differ from ultra mode on error text', () => {
      const input = 'Error: Something just really went wrong actually.';
      const contextResult = compress(input, 'context');
      const ultraResult = compress(input, 'ultra');
      // Context mode should compress less (lite for errors)
      expect(contextResult.length).toBeGreaterThanOrEqual(ultraResult.length);
    });

    it('context mode should differ from lite mode on normal text', () => {
      const input = 'This is just basically a really simple test.';
      const contextResult = compress(input, 'context');
      const liteResult = compress(input, 'lite');
      // Context mode should compress more (ultra for normal)
      expect(contextResult.length).toBeLessThanOrEqual(liteResult.length);
    });

    it('context mode should match full mode on explanation text', () => {
      const input = 'This example will show how it works in order to succeed.';
      const contextResult = compress(input, 'context');
      const fullResult = compress(input, 'full');
      // Should be similar or identical for explanations
      expect(contextResult).toBe(fullResult);
    });
  });

  describe('edge cases', () => {
    it('should handle empty input', () => {
      expect(compress('', 'context')).toBe('');
    });

    it('should handle whitespace-only input', () => {
      const result = compress('   \n\n   ', 'context');
      expect(result.trim()).toBe('');
    });

    it('should handle single word input', () => {
      const result = compress('Hello', 'context');
      expect(result).toBe('Hello');
    });

    it('should handle input that matches multiple context patterns', () => {
      // This has "function" (code) but is explanatory
      const input = 'This function will basically help you understand.';
      const result = compress(input, 'context');
      // Should detect as explanation (checked before code in priority)
      expect(result).not.toContain('basically');
    });
  });
});

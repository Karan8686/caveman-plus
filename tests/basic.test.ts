import { describe, it, expect } from 'vitest';
import {
  compress,
  splitCodeBlocks,
  removeFiller,
  compressPhrases,
  normalizeWhitespace,
  estimateTokens,
  estimateTokenSavings,
  getPrompt,
  loadConfig,
  mergeConfig,
} from '../src/index.js';

describe('splitCodeBlocks', () => {
  it('splits plain text', () => {
    const result = splitCodeBlocks('Hello world');
    expect(result).toEqual([{ type: 'text', content: 'Hello world' }]);
  });

  it('splits single code block', () => {
    const result = splitCodeBlocks('Text\n```js\ncode\n```\nMore');
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ type: 'text', content: 'Text\n' });
    expect(result[1]).toEqual({ type: 'code', content: '```js\ncode\n```' });
    expect(result[2]).toEqual({ type: 'text', content: '\nMore' });
  });

  it('splits multiple code blocks', () => {
    const result = splitCodeBlocks('A\n```x\n1\n```\nB\n```y\n2\n```\nC');
    expect(result).toHaveLength(5);
    expect(result[0].type).toBe('text');
    expect(result[1].type).toBe('code');
    expect(result[2].type).toBe('text');
    expect(result[3].type).toBe('code');
    expect(result[4].type).toBe('text');
  });

  it('preserves code block content exactly', () => {
    const code = '```python\nx = "don\'t touch me"\ny = True\n```';
    const result = splitCodeBlocks(`Intro\n${code}\nOutro`);
    expect(result[1].content).toBe(code);
  });

  it('handles empty input', () => {
    expect(splitCodeBlocks('')).toEqual([]);
  });

  it('handles whitespace-only segments', () => {
    const result = splitCodeBlocks('  \n```x\n```\n  ');
    expect(result).toHaveLength(3);
    expect(result[0].content).toBe('  \n');
    expect(result[2].content).toBe('\n  ');
  });
});

describe('removeFiller', () => {
  it('removes filler words', () => {
    expect(removeFiller('This is basically just a test.')).toBe('This is a test.');
  });

  it('removes multiple filler words', () => {
    expect(removeFiller('It really very basically works.')).toBe('It works.');
  });

  it('preserves code blocks', () => {
    const input = 'Text just here.\n```js\nconst veryImportant = true;\n```\nActually done.';
    const result = removeFiller(input);
    expect(result).toContain('veryImportant');
    expect(result).not.toContain(' just ');
    expect(result).not.toContain('Actually');
  });

  it('handles custom fillers', () => {
    expect(
      removeFiller('This is totally fine', { fillers: ['totally'] })
    ).toBe('This is fine');
  });

  it('handles empty input', () => {
    expect(removeFiller('')).toBe('');
  });

  it('preserves newlines around code blocks', () => {
    const input = 'Text.\n\n```x\ncode\n```\n\nMore.';
    const result = removeFiller(input);
    expect(result).toContain('\n\n```');
    expect(result).toContain('```\n\n');
  });
});

describe('compressPhrases', () => {
  it('compresses verbose phrases', () => {
    expect(compressPhrases('The reason is because of this')).toBe('because of this');
  });

  it('replaces "in order to" with "to"', () => {
    expect(compressPhrases('in order to succeed')).toBe('to succeed');
  });

  it('removes empty replacement phrases', () => {
    const result = compressPhrases('It is important to note that this works');
    expect(result).toBe('this works');
  });

  it('preserves code blocks', () => {
    const input = 'Intro\n```js\nconst x = the reason is because;\n```\nOutro';
    const result = compressPhrases(input);
    expect(result).toContain('the reason is because');
  });

  it('handles custom phrases', () => {
    expect(
      compressPhrases('at this time', { phrases: { 'at this time': 'now' } })
    ).toBe('now');
  });

  it('handles empty input', () => {
    expect(compressPhrases('')).toBe('');
  });
});

describe('normalizeWhitespace', () => {
  it('collapses multiple spaces', () => {
    expect(normalizeWhitespace('hello    world')).toBe('hello world');
  });

  it('fixes spacing around punctuation', () => {
    expect(normalizeWhitespace('hello , world .')).toBe('hello, world.');
  });

  it('normalizes line endings', () => {
    expect(normalizeWhitespace('line\r\nanother')).toBe('line\nanother');
  });

  it('preserves code block content', () => {
    const input = 'Text  here\n```js\n  const x = 1;\n```\nMore  text';
    const result = normalizeWhitespace(input);
    expect(result).toContain('  const x = 1;');
  });

  it('handles empty input', () => {
    expect(normalizeWhitespace('')).toBe('');
  });
});

describe('compress pipeline', () => {
  it('compresses normal text', () => {
    const input = 'I just wanted to say that, actually, this is basically a test.';
    const result = compress(input, 'full');
    expect(result).toBe('I wanted to say that, , this is a test.');
  });

  it('preserves code blocks exactly', () => {
    const input = `Intro text that is basically verbose.

\`\`\`javascript
const reallyImportant = "don't change me";
function actuallyWorks() {
  return true;
}
\`\`\`

In order to conclude, this is it.`;
    const result = compress(input, 'full');

    expect(result).toContain('const reallyImportant = "don\'t change me";');
    expect(result).toContain('function actuallyWorks() {');
    expect(result).toContain('  return true;');
    expect(result).toContain('```');
    expect(result).not.toContain(' basically ');
  });

  it('handles mixed input with multiple code blocks', () => {
    const input = `First.

\`\`\`js
const a = 1;
\`\`\`

Middle.

\`\`\`py
def b():
    pass
\`\`\`

End.`;
    const result = compress(input, 'lite');
    expect(result).toContain('const a = 1;');
    expect(result).toContain('def b():');
    expect(result).toContain('    pass');
  });

  it('handles empty input', () => {
    expect(compress('')).toBe('');
  });

  it('works with lite mode', () => {
    const input = 'This is just really a test.';
    const result = compress(input, 'lite');
    expect(result).toBe('This is a test.');
  });

  it('works with ultra mode', () => {
    const input = 'It is important to note that this is basically just a test.';
    const result = compress(input, 'ultra');
    expect(result).toBe('this is a test.');
  });

  it('deterministic output', () => {
    const input = 'This is basically just a test that really works very well.';
    const r1 = compress(input, 'full');
    const r2 = compress(input, 'full');
    const r3 = compress(input, 'full');
    expect(r1).toBe(r2);
    expect(r2).toBe(r3);
  });

  it('mode overrides work', () => {
    const result = compress('This is basically just a test.', {
      mode: 'ultra',
      filler: false,
    });
    expect(result).toContain('basically');
  });
});

describe('estimateTokens', () => {
  it('estimates tokens for simple text', () => {
    expect(estimateTokens('Hello world')).toBe(3); // 11 chars / 4 = 2.75 -> 3
  });

  it('handles empty text', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('estimates proportionally', () => {
    const short = 'Hi';
    const long = 'Hello world this is a longer text for testing';
    expect(estimateTokens(long)).toBeGreaterThan(estimateTokens(short));
  });
});

describe('estimateTokenSavings', () => {
  it('calculates savings', () => {
    const result = estimateTokenSavings('This is basically just a very long text.', 'This is a text.');
    expect(result.before).toBeGreaterThan(result.after);
    expect(result.saved).toBeGreaterThan(0);
    expect(result.reductionPercent).toBeGreaterThan(0);
  });

  it('handles identical input', () => {
    const text = 'No change here.';
    const result = estimateTokenSavings(text, text);
    expect(result.saved).toBe(0);
    expect(result.reductionPercent).toBe(0);
  });

  it('returns all fields', () => {
    const result = estimateTokenSavings('before text', 'after');
    expect(result).toHaveProperty('before');
    expect(result).toHaveProperty('after');
    expect(result).toHaveProperty('saved');
    expect(result).toHaveProperty('reductionPercent');
  });
});

describe('getPrompt', () => {
  it('generates lite prompt', () => {
    const prompt = getPrompt('lite');
    expect(prompt).toContain('Minimal compression');
    expect(prompt).toContain('just');
    expect(prompt).toContain('very');
    expect(prompt).toContain('really');
  });

  it('generates full prompt', () => {
    const prompt = getPrompt('full');
    expect(prompt).toContain('Standard compression');
    expect(prompt).toContain('actually');
    expect(prompt).toContain('basically');
  });

  it('generates ultra prompt', () => {
    const prompt = getPrompt('ultra');
    expect(prompt).toContain('Maximum compression');
    expect(prompt).toContain('aggressively');
  });

  it('includes domain context', () => {
    const prompt = getPrompt({ mode: 'full', domain: 'medical' });
    expect(prompt).toContain('medical');
  });

  it('includes custom instructions', () => {
    const prompt = getPrompt({
      mode: 'full',
      customInstructions: ['- Always use markdown'],
    });
    expect(prompt).toContain('Always use markdown');
  });
});

describe('config loading', () => {
  it('mergeConfig applies mode from config', () => {
    const config = { mode: 'lite' as const };
    const merged = mergeConfig(config, {});
    expect(merged.mode).toBe('lite');
  });

  it('mergeConfig overrides mode', () => {
    const config = { mode: 'lite' as const };
    const merged = mergeConfig(config, { mode: 'ultra' });
    expect(merged.mode).toBe('ultra');
  });

  it('mergeConfig appends custom fillers', () => {
    const config = { customFillers: ['customword'] };
    const merged = mergeConfig(config, {});
    expect(merged.filler).not.toBe(false);
    if (typeof merged.filler === 'object' && merged.filler?.fillers) {
      expect(merged.filler.fillers).toContain('customword');
    }
  });

  it('mergeConfig appends custom phrases', () => {
    const config = { customPhrases: { 'test phrase': 'short' } };
    const merged = mergeConfig(config, {});
    expect(merged.phrases).not.toBe(false);
    if (typeof merged.phrases === 'object' && merged.phrases?.phrases) {
      expect(merged.phrases.phrases).toHaveProperty('test phrase');
    }
  });

  it('mergeConfig respects filler: false', () => {
    const config = { filler: false };
    const merged = mergeConfig(config, {});
    expect(merged.filler).toBe(false);
  });

  it('mergeConfig respects phrases: false', () => {
    const config = { phrases: false };
    const merged = mergeConfig(config, {});
    expect(merged.phrases).toBe(false);
  });
});

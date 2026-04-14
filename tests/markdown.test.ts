import { describe, it, expect } from 'vitest';
import { compress, parseMarkdown, recompressMarkdown, compressMarkdown } from '../src/index.js';

describe('markdown-aware compression', () => {
  describe('headings preservation', () => {
    it('preserves heading markers while compressing text', () => {
      const input = '# This is basically just a really verbose heading';
      const result = compress(input, 'full');
      expect(result).toMatch(/^#\s/);
      expect(result).not.toContain('basically');
      expect(result).not.toContain('really');
    });

    it('preserves h2 headings', () => {
      const input = '## Another verbose heading that could be shorter';
      const result = compress(input, 'full');
      expect(result).toMatch(/^##\s/);
    });

    it('preserves deeper heading levels', () => {
      const input = '### Just a really verbose h3 heading';
      const result = compress(input, 'full');
      expect(result).toMatch(/^###\s/);
      expect(result).toContain('h3 heading');
    });

    it('handles headings with leading whitespace', () => {
      const input = '  ## This is actually a heading with indent';
      const result = compress(input, 'full');
      expect(result).toMatch(/^  ##\s/);
      expect(result).not.toContain('actually');
    });
  });

  describe('list items preservation', () => {
    it('preserves unordered list markers with dash', () => {
      const input = '- This is basically just a list item';
      const result = compress(input, 'full');
      expect(result).toMatch(/^-\s/);
      expect(result).not.toContain('basically');
    });

    it('preserves unordered list markers with asterisk', () => {
      const input = '* This is actually a really verbose item';
      const result = compress(input, 'full');
      expect(result).toMatch(/^\*\s/);
      expect(result).not.toContain('actually');
      expect(result).not.toContain('really');
    });

    it('preserves unordered list markers with plus', () => {
      const input = '+ Just another verbose list item';
      const result = compress(input, 'full');
      expect(result).toMatch(/^\+\s/);
    });

    it('preserves ordered list markers', () => {
      const input = '1. This is basically the first step';
      const result = compress(input, 'full');
      expect(result).toMatch(/^1\.\s/);
      expect(result).not.toContain('basically');
    });

    it('preserves numbered lists', () => {
      const input = '42. This is actually step forty-two';
      const result = compress(input, 'full');
      expect(result).toMatch(/^42\.\s/);
      expect(result).not.toContain('actually');
    });

    it('preserves indented list items', () => {
      const input = '  - Just a nested list item here';
      const result = compress(input, 'full');
      expect(result).toMatch(/^  -\s/);
    });
  });

  describe('blockquotes preservation', () => {
    it('preserves blockquote markers', () => {
      const input = '> This is basically just a quote';
      const result = compress(input, 'full');
      expect(result).toMatch(/^>\s/);
      expect(result).not.toContain('basically');
    });

    it('preserves nested blockquotes', () => {
      const input = '>> This is actually a nested quote';
      const result = compress(input, 'full');
      expect(result).toMatch(/^>>\s/);
      expect(result).not.toContain('actually');
    });

    it('handles blockquotes with indentation', () => {
      const input = '  > Just a verbose indented quote';
      const result = compress(input, 'full');
      expect(result).toMatch(/^  >\s/);
    });
  });

  describe('tables preservation', () => {
    it('preserves table row structure', () => {
      const input = '| Column One | Column Two |';
      const result = compress(input, 'full');
      expect(result).toMatch(/^\|.*\|$/);
    });

    it('preserves table separator rows', () => {
      const input = '|---|---|';
      const result = compress(input, 'full');
      expect(result).toBe('|---|---|');
    });

    it('preserves table with alignment', () => {
      const input = '|:---|:---:|---:|';
      const result = compress(input, 'full');
      expect(result).toBe('|:---|:---:|---:|');
    });
  });

  describe('thematic breaks preservation', () => {
    it('preserves dash thematic breaks', () => {
      const input = '---';
      const result = compress(input, 'full');
      expect(result).toBe('---');
    });

    it('preserves asterisk thematic breaks', () => {
      const input = '***';
      const result = compress(input, 'full');
      expect(result).toBe('***');
    });

    it('preserves underscore thematic breaks', () => {
      const input = '___';
      const result = compress(input, 'full');
      expect(result).toBe('___');
    });
  });

  describe('complex markdown documents', () => {
    it('compresses mixed markdown document', () => {
      const input = `# This is basically just a title

This is actually the introduction that could be shorter.

## Features

- First feature that is really verbose
- Second feature which is basically awesome
- Third item that just works

> This is actually a really important quote

| Column A | Column B |
|----------|----------|
| Data A   | Data B   |

---

In order to conclude, this is the end.`;

      const result = compress(input, 'full');

      // Structure preserved
      expect(result).toMatch(/^#\s/m);
      expect(result).toMatch(/^##\sFeatures/m);
      expect(result).toContain('- ');
      expect(result).toContain('> ');
      expect(result).toContain('|');
      expect(result).toContain('---');

      // Text compressed
      expect(result).not.toContain('basically just a title');
      expect(result).not.toContain('actually the introduction');
      expect(result).not.toContain('really verbose');
    });

    it('deterministic output for markdown', () => {
      const input = '# Just a really verbose heading\n\n- First actually verbose item';
      const r1 = compress(input, 'full');
      const r2 = compress(input, 'full');
      expect(r1).toBe(r2);
    });
  });

  describe('parseMarkdown utility', () => {
    it('parses headings correctly', () => {
      const segments = parseMarkdown('# Just a test');
      expect(segments).toHaveLength(1);
      expect(segments[0].type).toBe('heading');
      expect(segments[0].prefix).toBe('# ');
      expect(segments[0].text).toBe('Just a test');
    });

    it('parses list items correctly', () => {
      const segments = parseMarkdown('- Just a test');
      expect(segments).toHaveLength(1);
      expect(segments[0].type).toBe('list-item');
      expect(segments[0].prefix).toBe('- ');
      expect(segments[0].text).toBe('Just a test');
    });

    it('parses blockquotes correctly', () => {
      const segments = parseMarkdown('> Just a quote');
      expect(segments).toHaveLength(1);
      expect(segments[0].type).toBe('blockquote');
      expect(segments[0].prefix).toBe('> ');
      expect(segments[0].text).toBe('Just a quote');
    });

    it('parses plain text', () => {
      const segments = parseMarkdown('Just plain text');
      expect(segments).toHaveLength(1);
      expect(segments[0].type).toBe('text');
      expect(segments[0].content).toBe('Just plain text');
    });
  });

  describe('compressMarkdown utility', () => {
    it('applies compressor only to text content', () => {
      const input = '# Just a really verbose heading';
      const compressor = (text: string) => text.replace(/really\s+/g, '');
      const result = compressMarkdown(input, compressor);
      expect(result).toBe('# Just a verbose heading');
    });

    it('preserves markdown markers for lists', () => {
      const input = '- This is actually a test';
      const compressor = (text: string) => text.replace(/actually\s+/g, '');
      const result = compressMarkdown(input, compressor);
      expect(result).toBe('- This is a test');
    });
  });
});

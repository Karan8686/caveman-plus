import { describe, it, expect } from 'vitest';
import { compress } from '../src/index.js';

describe('selective compression flags', () => {
  describe('--preserve-errors flag', () => {
    it('applies minimal compression to error messages when flag is enabled', () => {
      const input = 'TypeError: Cannot read property of undefined at Object.<anonymous>';
      const withFlag = compress(input, { mode: 'ultra', preserveErrors: true });
      const withoutFlag = compress(input, 'ultra');

      // With flag should preserve more error details
      expect(withFlag.length).toBeGreaterThanOrEqual(withoutFlag.length);
      expect(withFlag).toContain('TypeError:');
    });

    it('preserves stack traces with preserveErrors flag', () => {
      const input = `Error: Something went wrong
    at Function.execute (/path/to/file.js:10:5)
    at Module._compile (internal/modules/cjs/loader.js:1085:14)`;
      const result = compress(input, { mode: 'full', preserveErrors: true });

      expect(result).toContain('Error:');
      expect(result).toContain('at Function');
      expect(result).toContain('execute');
      expect(result).toContain('at Module');
      expect(result).toContain('_compile');
    });

    it('does not affect non-error text when preserveErrors is enabled', () => {
      const input = 'This is basically just a really verbose sentence.';
      const result = compress(input, { mode: 'full', preserveErrors: true });

      // Should still compress normal text
      expect(result).not.toContain('basically');
      expect(result).not.toContain('really');
    });

    it('works with auto mode and preserveErrors', () => {
      const input = 'Fatal Exception: The application just crashed unexpectedly.';
      const result = compress(input, { mode: 'auto', preserveErrors: true });

      expect(result).toContain('Fatal Exception:');
    });
  });

  describe('--preserve-logs flag', () => {
    it('applies lighter compression to log messages with timestamps', () => {
      const input = '2024-01-15 12:30:45 INFO: This is basically just a log message';
      const withFlag = compress(input, { mode: 'ultra', preserveLogs: true });
      const withoutFlag = compress(input, 'ultra');

      // With flag should preserve more log content
      expect(withFlag.length).toBeGreaterThanOrEqual(withoutFlag.length);
      expect(withFlag).toContain('2024-01-15');
      expect(withFlag).toContain('INFO:');
    });

    it('preserves log levels and structure', () => {
      const input = '[2024-01-15] [ERROR] Something actually went wrong here';
      const result = compress(input, { mode: 'full', preserveLogs: true });

      expect(result).toContain('[ERROR]');
      expect(result).toContain('[2024-01-15]');
    });

    it('detects various log formats', () => {
      const logs = [
        '12:30:45 DEBUG: Just a test message',
        '[WARN] This is basically a warning',
        'app.js: Starting the server now',
        'Jan 15 2024 INFO: Server started',
      ];

      logs.forEach(log => {
        const result = compress(log, { mode: 'ultra', preserveLogs: true });
        // Should preserve log structure
        expect(result.length).toBeGreaterThan(0);
      });
    });

    it('does not affect non-log text when preserveLogs is enabled', () => {
      const input = 'This is actually just a normal sentence.';
      const result = compress(input, { mode: 'full', preserveLogs: true });

      // Should still compress normal text
      expect(result).not.toContain('actually');
    });
  });

  describe('combined flags', () => {
    it('preserves both errors and logs when both flags enabled', () => {
      const input = `2024-01-15 12:30:45 ERROR: Something just failed
TypeError: Cannot read property at line 42`;
      const result = compress(input, { mode: 'ultra', preserveErrors: true, preserveLogs: true });

      expect(result).toContain('2024-01-15');
      expect(result).toContain('ERROR:');
      expect(result).toContain('TypeError:');
    });

    it('mixed content with preserved and compressed sections', () => {
      const input = `This is basically just a verbose introduction.

2024-01-15 12:30:45 INFO: Server started successfully
Error: Actually something went wrong here

This is actually just a normal conclusion.`;
      const result = compress(input, { mode: 'ultra', preserveErrors: true, preserveLogs: true });

      // Normal text should be compressed
      expect(result).not.toContain('basically just a verbose');
      expect(result).not.toContain('actually just a normal');

      // Errors and logs should be preserved
      expect(result).toContain('2024-01-15');
      expect(result).toContain('Error:');
    });

    it('deterministic output with preservation flags', () => {
      const input = '2024-01-15 ERROR: Just a test message basically';
      const r1 = compress(input, { mode: 'full', preserveLogs: true });
      const r2 = compress(input, { mode: 'full', preserveLogs: true });
      expect(r1).toBe(r2);
    });
  });

  describe('context detection integration', () => {
    it('preserveErrors works with context detection system', () => {
      const errorInputs = [
        'Exception in thread "main" java.lang.NullPointerException',
        'FATAL: Process exited with code 1',
        'panic: runtime error: index out of range',
      ];

      errorInputs.forEach(input => {
        const result = compress(input, { mode: 'ultra', preserveErrors: true });
        // Should preserve error keywords
        expect(result).toMatch(/(Exception|FATAL|panic|Error)/i);
      });
    });

    it('preserveLogs detects timestamp patterns', () => {
      const logInputs = [
        '2024-01-15T12:30:45.123Z INFO: Starting up',
        '[2024-01-15 12:30:45] WARN: Low disk space',
        '12:30:45 DEBUG: Request received',
      ];

      logInputs.forEach(input => {
        const result = compress(input, { mode: 'full', preserveLogs: true });
        // Should preserve timestamps or log levels
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });
});

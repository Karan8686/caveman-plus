import { describe, it, expect } from 'vitest';
import { detectContext } from '../src/utils/context.js';

describe('detectContext', () => {
  describe('error context', () => {
    it('should detect Error keyword', () => {
      expect(detectContext('Error: Something went wrong')).toBe('error');
    });

    it('should detect Exception keyword', () => {
      expect(detectContext('Exception in thread "main"')).toBe('error');
    });

    it('should detect stack traces', () => {
      const stackTrace = `TypeError: Cannot read property 'foo' of undefined
    at Object.<anonymous> (/path/to/file.js:10:5)
    at Module._compile (internal/modules/cjs/loader.js:1085:14)`;
      expect(detectContext(stackTrace)).toBe('error');
    });

    it('should detect Python tracebacks', () => {
      const traceback = `Traceback (most recent call last):
  File "script.py", line 42, in main
    result = calculate()`;
      expect(detectContext(traceback)).toBe('error');
    });

    it('should detect fatal errors', () => {
      expect(detectContext('FATAL ERROR: Process terminated')).toBe('error');
    });
  });

  describe('code context', () => {
    it('should detect code blocks', () => {
      expect(detectContext('```javascript\nconst x = 5;\n```')).toBe('code');
    });

    it('should detect function definitions', () => {
      expect(detectContext('function calculateTotal(items) {')).toBe('code');
    });

    it('should detect const declarations', () => {
      expect(detectContext('const result = calculate();')).toBe('code');
    });

    it('should detect arrow functions', () => {
      expect(detectContext('const add = (a, b) => a + b;')).toBe('code');
    });

    it('should detect multiple code indicators', () => {
      expect(detectContext('const x = 5;\nreturn x;')).toBe('code');
    });

    it('should detect console.log', () => {
      expect(detectContext('console.log("debug");')).toBe('code');
    });
  });

  describe('explanation context', () => {
    it('should detect explanatory phrases', () => {
      expect(detectContext('This function will calculate the total.')).toBe('explanation');
    });

    it('should detect examples', () => {
      expect(detectContext('For example, you can use this approach.')).toBe('explanation');
    });

    it('should detect questions', () => {
      expect(detectContext('How does this work?')).toBe('explanation');
    });

    it('should detect instructional patterns', () => {
      expect(detectContext('First, you should initialize the variable.')).toBe('explanation');
    });
  });

  describe('normal context', () => {
    it('should classify empty string as normal', () => {
      expect(detectContext('')).toBe('normal');
    });

    it('should classify whitespace as normal', () => {
      expect(detectContext('   ')).toBe('normal');
    });

    it('should classify simple text as normal', () => {
      expect(detectContext('Hello, world!')).toBe('normal');
    });

    it('should classify greetings as normal', () => {
      expect(detectContext('Good morning!')).toBe('normal');
    });
  });

  describe('performance', () => {
    it('should be fast for large inputs', () => {
      const largeText = 'const x = 5; '.repeat(10000);
      const start = performance.now();
      detectContext(largeText);
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });
  });

  describe('determinism', () => {
    it('should return the same result for the same input', () => {
      const input = 'Error: Something went wrong';
      const result1 = detectContext(input);
      const result2 = detectContext(input);
      expect(result1).toBe(result2);
    });
  });
});

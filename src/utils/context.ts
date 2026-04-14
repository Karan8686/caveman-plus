export type ContextType = 'error' | 'code' | 'explanation' | 'normal';

/**
 * Classifies input text into context categories using fast heuristics.
 * Detection is deterministic and O(n) where n is text length.
 *
 * @param text - The input text to classify
 * @returns The detected context type
 */
export function detectContext(text: string): ContextType {
  if (!text || !text.trim()) {
    return 'normal';
  }

  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // Check for error context first (highest priority)
  if (isErrorContext(trimmed, lower)) {
    return 'error';
  }

  // Check for code context
  if (isCodeContext(trimmed, lower)) {
    return 'code';
  }

  // Check for explanation context
  if (isExplanationContext(lower)) {
    return 'explanation';
  }

  // Default to normal
  return 'normal';
}

function isErrorContext(text: string, lower: string): boolean {
  const errorPatterns = [
    // Error keywords and exceptions
    /\b(error|exception|traceback|fatal|critical|panic)\b/i,
    // Stack trace indicators
    /\bat\s+\w+.*\(/i,
    /\bat\s+[\w.]+:\d+/i,
    /File\s+"[^"]+",\s+line\s+\d+/i,
    // Language-specific error patterns
    /\w+Error[:\s]/i,
    /\w+Exception[:\s]/i,
    // Common error formats
    /at\s+\[as\s+\w+\]/i,
    /Process.*exited\s+with\s+code/i,
  ];

  return errorPatterns.some((pattern) => pattern.test(text));
}

function isCodeContext(text: string, lower: string): boolean {
  // Check for code block markers
  if (text.startsWith('```') || text.endsWith('```')) {
    return true;
  }

  // Check for programming language keywords and patterns
  const codePatterns = [
    // JavaScript/TypeScript keywords
    /\b(const|let|var|function|class|interface|type|import|export|from|return|if|else|for|while|switch|case|async|await)\b[\s(=;]/,
    // Function definitions
    /\bfunction\s+\w+\s*\(/,
    /\b\w+\s*=\s*(async\s+)?\(.*\)\s*=>/,
    // Method definitions
    /\b(public|private|protected|static)\s+\w+\s*\(/,
    // Common code patterns
    /;\s*\/\/.*$/,
    /\bconsole\.\w+\s*\(/,
    /\bmodule\.exports\b/,
    /\brequire\s*\(/,
    // Indentation with code-like content (tabs or 2+ spaces)
    /^( {2,}|\t).*(=\s*function|\bconst\b|\breturn\b|\bif\b|\{|\})/m,
  ];

  let matchCount = 0;
  for (const pattern of codePatterns) {
    if (pattern.test(text)) {
      matchCount++;
      // If we find multiple code indicators, it's likely code
      if (matchCount >= 2) {
        return true;
      }
    }
  }

  // Single strong indicator: code blocks or function definitions
  return matchCount >= 1 && (/function\s+\w+\s*\(/.test(text) || /\bconst\b/.test(text) || /=>/.test(text) || /console\.\w+\s*\(/.test(text));
}

function isExplanationContext(lower: string): boolean {
  // Look for explanatory language patterns
  const explanationPatterns = [
    // Common explanatory phrases
    /\bthis\s+(function|code|example|will|shows?)\b/,
    /\b(in\s+order\s+to|so\s+that|because|therefore|thus)\b/,
    /\bthe\s+(following|above|below|reason|purpose)\b/,
    /\b(for\s+example|for\s+instance|such\s+as)\b/,
    /\b(basically|essentially|simply|just)\s+\w+\s+to\b/,
    // Question patterns that seek explanations
    /\b(how|what|why|when|where)\s+(do|does|did|is|are|can|could|would|should)\b/,
    // instructional patterns
    /\b(first|next|then|finally|after\s+that)\s*,?\s+\w+\s+(can|should|will|need)/,
  ];

  let matchCount = 0;
  for (const pattern of explanationPatterns) {
    if (pattern.test(lower)) {
      matchCount++;
      if (matchCount >= 1) {
        return true;
      }
    }
  }

  return false;
}

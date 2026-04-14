import { splitCodeBlocks, Segment } from '../utils/splitCode.js';

export interface WhitespaceOptions {
  /**
   * Normalize line endings to \n (default: true)
   */
  normalizeLineEndings?: boolean;
  /**
   * Remove trailing whitespace (default: true)
   */
  trimTrailing?: boolean;
  /**
   * Collapse multiple newlines into a single one (default: false)
   */
  collapseNewlines?: boolean;
}

/**
 * Normalizes whitespace in text while preserving formatting and punctuation.
 * Removes extra spaces, trims segments, and ensures proper spacing after transformations.
 *
 * @param text - The text to normalize
 * @param options - Optional configuration for whitespace normalization
 * @returns Text with normalized whitespace
 */
export function normalizeWhitespace(text: string, options?: WhitespaceOptions): string {
  if (!text) return '';

  const normalizeLineEndings = options?.normalizeLineEndings ?? true;
  const trimTrailing = options?.trimTrailing ?? true;
  const collapseNewlines = options?.collapseNewlines ?? false;

  // Normalize line endings first
  let result = normalizeLineEndings ? text.replace(/\r\n/g, '\n') : text;

  // Split text into code and text segments
  const segments = splitCodeBlocks(result);

  // Process each segment
  const processed = segments.map((segment: Segment) => {
    if (segment.type === 'code') {
      // Only trim trailing whitespace in code blocks, preserve internal spacing
      return segment.content.replace(/[ \t]+$/gm, '');
    }

    // Normalize whitespace in text segments
    return normalizeTextWhitespace(segment.content, trimTrailing, collapseNewlines);
  });

  return processed.join('');
}

/**
 * Normalizes whitespace in a text segment.
 * Collapses spaces, fixes spacing around punctuation, and trims.
 * Preserves leading/trailing newlines for proper segment boundaries.
 */
function normalizeTextWhitespace(
  text: string,
  trimTrailing: boolean,
  collapseNewlines: boolean
): string {
  let result = text;

  // Extract and preserve leading/trailing newlines
  const leadingNewlines = result.match(/^\n*/)?.[0] || '';
  const trailingNewlines = result.match(/\n*$/)?.[0] || '';

  // Work with the inner content
  let inner = result.slice(leadingNewlines.length, result.length - trailingNewlines.length);

  // Remove trailing whitespace from lines (but preserve trailing newlines)
  if (trimTrailing) {
    inner = inner.replace(/[ \t]+$/gm, '');
  }

  // Collapse multiple spaces into single spaces (but not newlines)
  inner = inner.replace(/[^\S\n]+/g, ' ');

  // Fix spacing around punctuation
  inner = inner
    .replace(/\s+([.,;!?])/g, '$1')       // Remove space before punctuation
    .replace(/([.,;!?])(?=[^\s])/g, '$1 ') // Add space after punctuation if missing
    .replace(/ +/g, ' ')                   // Collapse multiple spaces (not newlines)
    .replace(/^[ \t]+/gm, '')              // Remove leading spaces/tabs from lines
    .trim();                               // Trim inner content

  // Optionally collapse multiple newlines
  if (collapseNewlines) {
    inner = inner.replace(/\n{3,}/g, '\n\n');
  }

  // Reconstruct with preserved boundaries
  return leadingNewlines + inner + trailingNewlines;
}

import { splitCodeBlocks, Segment } from '../utils/splitCode.js';

/**
 * Default filler words to remove from text
 */
export const DEFAULT_FILLERS = [
  'actually',
  'basically',
  'just',
  'very',
  'really',
  'literally',
  'simply',
  'totally',
  'completely',
  'absolutely',
  'obviously',
  'clearly',
  'certainly',
  'probably',
  'maybe',
  'perhaps',
  'quite',
  'somewhat',
  'rather',
  'pretty',
  'kind of',
  'sort of',
] as const;

export interface FillerOptions {
  /**
   * Additional filler words to remove
   */
  fillers?: string[];
  /**
   * Case-insensitive matching (default: true)
   */
  caseInsensitive?: boolean;
}

/**
 * Removes filler words from text while preserving code blocks.
 * Uses the splitCodeBlocks utility to ensure content inside code blocks is not affected.
 *
 * @param text - The text to process
 * @param options - Optional configuration for filler removal
 * @returns Text with filler words removed, maintaining spacing and readability
 */
export function removeFiller(text: string, options?: FillerOptions): string {
  if (!text) return '';

  const fillers = options?.fillers ?? DEFAULT_FILLERS;
  const caseInsensitive = options?.caseInsensitive ?? true;

  // Split text into code and text segments
  const segments = splitCodeBlocks(text);

  // Process each segment
  const processed = segments.map((segment: Segment) => {
    if (segment.type === 'code') {
      // Preserve code blocks exactly as they are
      return segment.content;
    }

    // Remove filler words from text segments
    return removeFillersFromText(segment.content, fillers, caseInsensitive);
  });

  return processed.join('');
}

/**
 * Removes filler words from a text segment using regex.
 * Handles word boundaries and cleans up extra spacing.
 * Preserves leading/trailing whitespace for proper segment boundaries.
 */
function removeFillersFromText(
  text: string,
  fillers: readonly string[],
  caseInsensitive: boolean
): string {
  // Extract and preserve leading/trailing whitespace
  const leadingWs = text.match(/^\s*/)?.[0] || '';
  const trailingWs = text.match(/\s*$/)?.[0] || '';

  // Work with inner content
  let inner = text.slice(leadingWs.length, text.length - trailingWs.length);

  for (const filler of fillers) {
    // Escape special regex characters in filler word
    const escaped = filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Match filler words with word boundaries, including multi-word phrases
    const wordBoundary = filler.includes(' ') ? '' : '\\b';
    const flags = caseInsensitive ? 'gi' : 'g';
    const regex = new RegExp(`${wordBoundary}${escaped}${wordBoundary}`, flags);

    // Replace filler words and clean up extra whitespace
    inner = inner.replace(regex, ' ').replace(/[^\S\n]+/g, ' ').trim();
  }

  // Reconstruct with preserved boundaries
  return leadingWs + inner + trailingWs;
}
